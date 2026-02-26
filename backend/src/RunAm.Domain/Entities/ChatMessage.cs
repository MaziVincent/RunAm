using RunAm.Domain.Enums;

namespace RunAm.Domain.Entities;

public class ChatMessage : BaseEntity
{
    public Guid ErrandId { get; set; }
    public Guid SenderId { get; set; }
    public string Message { get; set; } = string.Empty;
    public MessageType MessageType { get; set; } = MessageType.Text;
    public bool IsRead { get; set; }

    // Navigation
    public Errand Errand { get; set; } = null!;
    public ApplicationUser Sender { get; set; } = null!;
}
