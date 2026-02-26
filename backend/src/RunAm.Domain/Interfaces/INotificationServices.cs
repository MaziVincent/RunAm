namespace RunAm.Domain.Interfaces;

/// <summary>
/// Abstraction for sending emails (Zoho ZeptoMail).
/// </summary>
public interface IEmailService
{
    Task SendAsync(string toEmail, string toName, string subject, string htmlBody, CancellationToken ct = default);
    Task SendBulkAsync(IEnumerable<(string Email, string Name)> recipients, string subject, string htmlBody, CancellationToken ct = default);
}

/// <summary>
/// Abstraction for sending SMS (Termii).
/// </summary>
public interface ISmsService
{
    Task SendAsync(string phoneNumber, string message, CancellationToken ct = default);
    Task SendBulkAsync(IEnumerable<string> phoneNumbers, string message, CancellationToken ct = default);
}

/// <summary>
/// Abstraction for sending push notifications (FCM).
/// </summary>
public interface IPushNotificationService
{
    Task SendToDeviceAsync(string fcmToken, string title, string body, Dictionary<string, string>? data = null, CancellationToken ct = default);
    Task SendToMultipleDevicesAsync(IEnumerable<string> fcmTokens, string title, string body, Dictionary<string, string>? data = null, CancellationToken ct = default);
}

/// <summary>
/// Orchestrates multi-channel notification dispatch based on user preferences.
/// </summary>
public interface INotificationDispatcher
{
    Task DispatchAsync(Guid userId, string title, string body, Domain.Enums.NotificationType type, string? data = null, CancellationToken ct = default);
    Task BroadcastAsync(string segment, string title, string body, bool sendEmail, bool sendSms, bool sendPush, CancellationToken ct = default);
}
