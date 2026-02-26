using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using RunAm.Domain.Entities;
using RunAm.Domain.Enums;
using RunAm.Domain.Interfaces;
using RunAm.Infrastructure.Persistence;

namespace RunAm.Infrastructure.Services;

/// <summary>
/// Orchestrates multi-channel notification dispatch: InApp + Push + Email + SMS.
/// Respects user notification preferences.
/// </summary>
public class NotificationDispatcher : INotificationDispatcher
{
    private readonly INotificationRepository _notifRepo;
    private readonly INotificationPreferenceRepository _prefRepo;
    private readonly IEmailService _emailService;
    private readonly ISmsService _smsService;
    private readonly IPushNotificationService _pushService;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IUnitOfWork _uow;
    private readonly ILogger<NotificationDispatcher> _logger;

    public NotificationDispatcher(
        INotificationRepository notifRepo,
        INotificationPreferenceRepository prefRepo,
        IEmailService emailService,
        ISmsService smsService,
        IPushNotificationService pushService,
        UserManager<ApplicationUser> userManager,
        IUnitOfWork uow,
        ILogger<NotificationDispatcher> logger)
    {
        _notifRepo = notifRepo;
        _prefRepo = prefRepo;
        _emailService = emailService;
        _smsService = smsService;
        _pushService = pushService;
        _userManager = userManager;
        _uow = uow;
        _logger = logger;
    }

    public async Task DispatchAsync(Guid userId, string title, string body, NotificationType type, string? data = null, CancellationToken ct = default)
    {
        // 1. Always create in-app notification
        var notification = new Notification
        {
            UserId = userId,
            Title = title,
            Body = body,
            Type = type,
            Data = data
        };
        await _notifRepo.AddAsync(notification, ct);
        await _uow.SaveChangesAsync(ct);

        // 2. Load user + preferences
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null) return;

        var prefs = await _prefRepo.GetOrCreateAsync(userId, ct);

        // Check category preference
        if (!ShouldNotifyForType(type, prefs)) return;

        // 3. Send push
        if (prefs.PushEnabled && !string.IsNullOrEmpty(prefs.FcmToken))
        {
            var pushData = data != null ? new Dictionary<string, string> { { "data", data } } : null;
            await _pushService.SendToDeviceAsync(prefs.FcmToken, title, body, pushData, ct);
        }

        // 4. Send email
        if (prefs.EmailEnabled && !string.IsNullOrEmpty(user.Email))
        {
            var htmlBody = $"<h2>{title}</h2><p>{body}</p>";
            await _emailService.SendAsync(user.Email, user.FullName, title, htmlBody, ct);
        }

        // 5. Send SMS (only for critical notifications)
        if (prefs.SmsEnabled && !string.IsNullOrEmpty(user.PhoneNumber) && IsCriticalNotification(type))
        {
            await _smsService.SendAsync(user.PhoneNumber, $"{title}: {body}", ct);
        }
    }

    public async Task BroadcastAsync(string segment, string title, string body, bool sendEmail, bool sendSms, bool sendPush, CancellationToken ct = default)
    {
        // Get users by segment
        IList<ApplicationUser> users;
        switch (segment?.ToLowerInvariant())
        {
            case "customers":
                users = await _userManager.GetUsersInRoleAsync("Customer");
                break;
            case "riders":
                users = await _userManager.GetUsersInRoleAsync("Rider");
                break;
            default: // "all"
                users = _userManager.Users.Where(u => u.Status == UserStatus.Active).Take(10000).ToList();
                break;
        }

        _logger.LogInformation("Broadcasting notification to {Count} users in segment '{Segment}'", users.Count, segment);

        foreach (var user in users)
        {
            // In-app
            var notification = new Notification
            {
                UserId = user.Id,
                Title = title,
                Body = body,
                Type = NotificationType.SystemAlert
            };
            await _notifRepo.AddAsync(notification, ct);
        }
        await _uow.SaveChangesAsync(ct);

        // Email
        if (sendEmail)
        {
            var recipients = users
                .Where(u => !string.IsNullOrEmpty(u.Email))
                .Select(u => (u.Email!, u.FullName));
            var htmlBody = $"<h2>{title}</h2><p>{body}</p>";
            await _emailService.SendBulkAsync(recipients, title, htmlBody, ct);
        }

        // SMS
        if (sendSms)
        {
            var phones = users
                .Where(u => !string.IsNullOrEmpty(u.PhoneNumber))
                .Select(u => u.PhoneNumber!);
            await _smsService.SendBulkAsync(phones, $"{title}: {body}", ct);
        }

        // Push
        if (sendPush)
        {
            // Load FCM tokens from preferences
            var userIds = users.Select(u => u.Id).ToList();
            foreach (var userId in userIds)
            {
                var prefs = await _prefRepo.GetByUserIdAsync(userId, ct);
                if (prefs?.PushEnabled == true && !string.IsNullOrEmpty(prefs.FcmToken))
                {
                    await _pushService.SendToDeviceAsync(prefs.FcmToken, title, body, ct: ct);
                }
            }
        }
    }

    private static bool ShouldNotifyForType(NotificationType type, NotificationPreference prefs) => type switch
    {
        NotificationType.ErrandCreated or NotificationType.ErrandAccepted or
        NotificationType.ErrandStatusUpdate or NotificationType.ErrandDelivered or
        NotificationType.ErrandCancelled => prefs.ErrandUpdates,

        NotificationType.ChatMessage => prefs.ChatMessages,

        NotificationType.PaymentReceived or NotificationType.PaymentFailed or
        NotificationType.WalletTopUp or NotificationType.WalletWithdrawal or
        NotificationType.PayoutCompleted => prefs.PaymentAlerts,

        NotificationType.PromotionAvailable => prefs.Promotions,

        NotificationType.SystemAlert => prefs.SystemAlerts,

        _ => true
    };

    private static bool IsCriticalNotification(NotificationType type) =>
        type is NotificationType.ErrandDelivered or NotificationType.PaymentReceived
            or NotificationType.PaymentFailed or NotificationType.SystemAlert;
}
