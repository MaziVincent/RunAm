namespace RunAm.Domain.Entities;

/// <summary>
/// Reusable notification templates for admin broadcasts.
/// </summary>
public class NotificationTemplate : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public string? HtmlBody { get; set; }
    public string Channel { get; set; } = "InApp"; // InApp, Email, Sms, Push, All
    public bool IsActive { get; set; } = true;
}
