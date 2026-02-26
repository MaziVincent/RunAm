using RunAm.Domain.Enums;

namespace RunAm.Domain.Entities;

public class Notification : BaseEntity
{
    public Guid UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public NotificationType Type { get; set; }
    public string? Data { get; set; } // JSON — deep link info
    public bool IsRead { get; set; }

    // Navigation
    public ApplicationUser User { get; set; } = null!;
}
