using RunAm.Domain.Enums;

namespace RunAm.Shared.DTOs.Notifications;

public record NotificationDto(
    Guid Id,
    string Title,
    string Body,
    NotificationType Type,
    string? Data,
    bool IsRead,
    DateTime CreatedAt
);

public record NotificationCountDto(int UnreadCount);
