using Microsoft.Extensions.Logging;
using RunAm.Domain.Interfaces;

namespace RunAm.Infrastructure.Services;

/// <summary>
/// Push notification service using Firebase Cloud Messaging (FCM).
/// In production, use FirebaseAdmin SDK. This is a placeholder that logs sends.
/// </summary>
public class FcmPushNotificationService : IPushNotificationService
{
    private readonly ILogger<FcmPushNotificationService> _logger;

    public FcmPushNotificationService(ILogger<FcmPushNotificationService> logger)
    {
        _logger = logger;
    }

    public Task SendToDeviceAsync(string fcmToken, string title, string body, Dictionary<string, string>? data = null, CancellationToken ct = default)
    {
        // TODO: Integrate Firebase Admin SDK
        // var message = new Message
        // {
        //     Token = fcmToken,
        //     Notification = new Notification { Title = title, Body = body },
        //     Data = data
        // };
        // await FirebaseMessaging.DefaultInstance.SendAsync(message, ct);

        _logger.LogInformation("Push notification sent to device: Title='{Title}', Token={Token}", title, fcmToken[..Math.Min(10, fcmToken.Length)] + "...");
        return Task.CompletedTask;
    }

    public Task SendToMultipleDevicesAsync(IEnumerable<string> fcmTokens, string title, string body, Dictionary<string, string>? data = null, CancellationToken ct = default)
    {
        var tokens = fcmTokens.ToList();
        _logger.LogInformation("Push notification sent to {Count} devices: Title='{Title}'", tokens.Count, title);
        return Task.CompletedTask;
    }
}
