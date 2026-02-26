namespace RunAm.Domain.Entities;

/// <summary>
/// Stores user preferences for which notification types/channels they want.
/// </summary>
public class NotificationPreference : BaseEntity
{
    public Guid UserId { get; set; }

    // Channel toggles
    public bool PushEnabled { get; set; } = true;
    public bool EmailEnabled { get; set; } = true;
    public bool SmsEnabled { get; set; } = true;

    // Category toggles
    public bool ErrandUpdates { get; set; } = true;
    public bool ChatMessages { get; set; } = true;
    public bool PaymentAlerts { get; set; } = true;
    public bool Promotions { get; set; } = true;
    public bool SystemAlerts { get; set; } = true;

    // Push token
    public string? FcmToken { get; set; }

    // Navigation
    public ApplicationUser User { get; set; } = null!;
}
