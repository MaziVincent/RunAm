using RunAm.Domain.Enums;

namespace RunAm.Shared.DTOs.Chat;

public record ChatMessageDto(
    Guid Id,
    Guid ErrandId,
    Guid SenderId,
    string SenderName,
    string Message,
    MessageType MessageType,
    bool IsRead,
    DateTime CreatedAt
);

public record SendMessageRequest(
    string Message,
    MessageType MessageType = MessageType.Text
);
