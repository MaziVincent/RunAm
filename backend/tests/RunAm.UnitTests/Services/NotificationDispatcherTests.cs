using FluentAssertions;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using Moq;
using RunAm.Domain.Entities;
using RunAm.Domain.Enums;
using RunAm.Domain.Interfaces;
using RunAm.Infrastructure.Services;
using Xunit;

namespace RunAm.UnitTests.Services;

public class NotificationDispatcherTests
{
    private readonly Mock<INotificationRepository> _notifRepo;
    private readonly Mock<INotificationPreferenceRepository> _prefRepo;
    private readonly Mock<IEmailService> _emailService;
    private readonly Mock<ISmsService> _smsService;
    private readonly Mock<IPushNotificationService> _pushService;
    private readonly Mock<UserManager<ApplicationUser>> _userManager;
    private readonly Mock<IUnitOfWork> _uow;
    private readonly NotificationDispatcher _dispatcher;

    public NotificationDispatcherTests()
    {
        _notifRepo = new Mock<INotificationRepository>();
        _prefRepo = new Mock<INotificationPreferenceRepository>();
        _emailService = new Mock<IEmailService>();
        _smsService = new Mock<ISmsService>();
        _pushService = new Mock<IPushNotificationService>();
        _uow = new Mock<IUnitOfWork>();

        var store = new Mock<IUserStore<ApplicationUser>>();
        _userManager = new Mock<UserManager<ApplicationUser>>(
            store.Object, null!, null!, null!, null!, null!, null!, null!, null!);

        _dispatcher = new NotificationDispatcher(
            _notifRepo.Object,
            _prefRepo.Object,
            _emailService.Object,
            _smsService.Object,
            _pushService.Object,
            _userManager.Object,
            _uow.Object,
            Mock.Of<ILogger<NotificationDispatcher>>());
    }

    [Fact]
    public async Task DispatchAsync_AlwaysCreatesInAppNotification()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _userManager.Setup(x => x.FindByIdAsync(userId.ToString()))
            .ReturnsAsync((ApplicationUser?)null); // user not found — still creates in-app

        // Act
        await _dispatcher.DispatchAsync(userId, "Test", "Body", NotificationType.SystemAlert);

        // Assert
        _notifRepo.Verify(r => r.AddAsync(
            It.Is<Notification>(n => n.UserId == userId && n.Title == "Test"),
            It.IsAny<CancellationToken>()), Times.Once);
        _uow.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task DispatchAsync_SendsEmail_WhenEmailEnabled()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var user = new ApplicationUser
        {
            Id = userId,
            Email = "test@runam.app",
            FirstName = "Test",
            LastName = "User"
        };

        _userManager.Setup(x => x.FindByIdAsync(userId.ToString()))
            .ReturnsAsync(user);

        _prefRepo.Setup(x => x.GetOrCreateAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new NotificationPreference
            {
                UserId = userId,
                EmailEnabled = true,
                SmsEnabled = false,
                PushEnabled = false,
                SystemAlerts = true
            });

        // Act
        await _dispatcher.DispatchAsync(userId, "Alert", "Something happened", NotificationType.SystemAlert);

        // Assert
        _emailService.Verify(e => e.SendAsync(
            "test@runam.app",
            "Test User",
            "Alert",
            It.Is<string>(html => html.Contains("Alert") && html.Contains("Something happened")),
            It.IsAny<CancellationToken>()), Times.Once);

        // SMS should NOT be sent (disabled)
        _smsService.Verify(s => s.SendAsync(
            It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task DispatchAsync_SendsSms_ForCriticalNotification_WhenSmsEnabled()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var user = new ApplicationUser
        {
            Id = userId,
            Email = "test@runam.app",
            PhoneNumber = "+2348001234567",
            FirstName = "Test",
            LastName = "User"
        };

        _userManager.Setup(x => x.FindByIdAsync(userId.ToString()))
            .ReturnsAsync(user);

        _prefRepo.Setup(x => x.GetOrCreateAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new NotificationPreference
            {
                UserId = userId,
                EmailEnabled = false,
                SmsEnabled = true,
                PushEnabled = false,
                PaymentAlerts = true
            });

        // Act — PaymentFailed is a critical notification type
        await _dispatcher.DispatchAsync(userId, "Payment Failed", "Your payment failed", NotificationType.PaymentFailed);

        // Assert
        _smsService.Verify(s => s.SendAsync(
            "+2348001234567",
            It.Is<string>(msg => msg.Contains("Payment Failed")),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task DispatchAsync_DoesNotSendSms_ForNonCriticalNotification()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var user = new ApplicationUser
        {
            Id = userId,
            Email = "test@runam.app",
            PhoneNumber = "+2348001234567",
            FirstName = "Test",
            LastName = "User"
        };

        _userManager.Setup(x => x.FindByIdAsync(userId.ToString()))
            .ReturnsAsync(user);

        _prefRepo.Setup(x => x.GetOrCreateAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new NotificationPreference
            {
                UserId = userId,
                EmailEnabled = false,
                SmsEnabled = true,
                PushEnabled = false,
                Promotions = true
            });

        // Act — PromotionAvailable is NOT critical
        await _dispatcher.DispatchAsync(userId, "Sale!", "50% off", NotificationType.PromotionAvailable);

        // Assert — SMS should NOT be sent for non-critical notifications
        _smsService.Verify(s => s.SendAsync(
            It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task DispatchAsync_SendsPush_WhenPushEnabledAndFcmTokenPresent()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var user = new ApplicationUser
        {
            Id = userId,
            Email = "test@runam.app",
            FirstName = "Test",
            LastName = "User"
        };

        _userManager.Setup(x => x.FindByIdAsync(userId.ToString()))
            .ReturnsAsync(user);

        _prefRepo.Setup(x => x.GetOrCreateAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new NotificationPreference
            {
                UserId = userId,
                EmailEnabled = false,
                SmsEnabled = false,
                PushEnabled = true,
                FcmToken = "test-fcm-token-123",
                ErrandUpdates = true
            });

        // Act
        await _dispatcher.DispatchAsync(userId, "Errand Update", "Rider is on the way", NotificationType.ErrandStatusUpdate);

        // Assert
        _pushService.Verify(p => p.SendToDeviceAsync(
            "test-fcm-token-123",
            "Errand Update",
            "Rider is on the way",
            It.IsAny<Dictionary<string, string>?>(),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task DispatchAsync_DoesNotSendPush_WhenNoFcmToken()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var user = new ApplicationUser
        {
            Id = userId,
            Email = "test@runam.app",
            FirstName = "Test",
            LastName = "User"
        };

        _userManager.Setup(x => x.FindByIdAsync(userId.ToString()))
            .ReturnsAsync(user);

        _prefRepo.Setup(x => x.GetOrCreateAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new NotificationPreference
            {
                UserId = userId,
                PushEnabled = true,
                FcmToken = null, // No FCM token
                ErrandUpdates = true
            });

        // Act
        await _dispatcher.DispatchAsync(userId, "Errand", "Update", NotificationType.ErrandStatusUpdate);

        // Assert
        _pushService.Verify(p => p.SendToDeviceAsync(
            It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(),
            It.IsAny<Dictionary<string, string>?>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task DispatchAsync_RespectsDisabledCategory()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var user = new ApplicationUser
        {
            Id = userId,
            Email = "test@runam.app",
            FirstName = "Test",
            LastName = "User"
        };

        _userManager.Setup(x => x.FindByIdAsync(userId.ToString()))
            .ReturnsAsync(user);

        _prefRepo.Setup(x => x.GetOrCreateAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new NotificationPreference
            {
                UserId = userId,
                EmailEnabled = true,
                SmsEnabled = true,
                PushEnabled = true,
                FcmToken = "token",
                Promotions = false // Promotions disabled
            });

        // Act
        await _dispatcher.DispatchAsync(userId, "Sale!", "50% off", NotificationType.PromotionAvailable);

        // Assert — No email/SMS/push should be sent since Promotions category is disabled
        _emailService.Verify(e => e.SendAsync(
            It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(),
            It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
        _smsService.Verify(s => s.SendAsync(
            It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
        _pushService.Verify(p => p.SendToDeviceAsync(
            It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(),
            It.IsAny<Dictionary<string, string>?>(), It.IsAny<CancellationToken>()), Times.Never);
    }
}
