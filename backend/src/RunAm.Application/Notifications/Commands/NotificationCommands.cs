using MediatR;
using RunAm.Domain.Entities;
using RunAm.Domain.Enums;
using RunAm.Domain.Interfaces;
using RunAm.Shared.DTOs.Notifications;

namespace RunAm.Application.Notifications.Commands;

// ── Create Notification ─────────────────────────

public record CreateNotificationCommand(
    Guid UserId,
    string Title,
    string Body,
    NotificationType Type,
    string? Data = null
) : IRequest<NotificationDto>;

public class CreateNotificationCommandHandler : IRequestHandler<CreateNotificationCommand, NotificationDto>
{
    private readonly INotificationRepository _notifRepo;
    private readonly IUnitOfWork _uow;

    public CreateNotificationCommandHandler(INotificationRepository notifRepo, IUnitOfWork uow)
    {
        _notifRepo = notifRepo;
        _uow = uow;
    }

    public async Task<NotificationDto> Handle(CreateNotificationCommand command, CancellationToken ct)
    {
        var notification = new Notification
        {
            UserId = command.UserId,
            Title = command.Title,
            Body = command.Body,
            Type = command.Type,
            Data = command.Data
        };

        await _notifRepo.AddAsync(notification, ct);
        await _uow.SaveChangesAsync(ct);

        return new NotificationDto(
            notification.Id,
            notification.Title,
            notification.Body,
            notification.Type,
            notification.Data,
            notification.IsRead,
            notification.CreatedAt
        );
    }
}

// ── Mark Read ───────────────────────────────────

public record MarkNotificationReadCommand(Guid NotificationId, Guid UserId) : IRequest;

public class MarkNotificationReadCommandHandler : IRequestHandler<MarkNotificationReadCommand>
{
    private readonly INotificationRepository _notifRepo;

    public MarkNotificationReadCommandHandler(INotificationRepository notifRepo) => _notifRepo = notifRepo;

    public async Task Handle(MarkNotificationReadCommand command, CancellationToken ct)
    {
        await _notifRepo.MarkAsReadAsync(command.NotificationId, command.UserId, ct);
    }
}

// ── Mark All Read ───────────────────────────────

public record MarkAllNotificationsReadCommand(Guid UserId) : IRequest;

public class MarkAllNotificationsReadCommandHandler : IRequestHandler<MarkAllNotificationsReadCommand>
{
    private readonly INotificationRepository _notifRepo;

    public MarkAllNotificationsReadCommandHandler(INotificationRepository notifRepo) => _notifRepo = notifRepo;

    public async Task Handle(MarkAllNotificationsReadCommand command, CancellationToken ct)
    {
        await _notifRepo.MarkAllAsReadAsync(command.UserId, ct);
    }
}
