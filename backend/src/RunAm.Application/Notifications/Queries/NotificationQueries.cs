using MediatR;
using RunAm.Domain.Interfaces;
using RunAm.Shared.DTOs.Notifications;

namespace RunAm.Application.Notifications.Queries;

// ── Get Notifications ───────────────────────────

public record GetNotificationsQuery(Guid UserId, int Page = 1, int PageSize = 20) : IRequest<IReadOnlyList<NotificationDto>>;

public class GetNotificationsQueryHandler : IRequestHandler<GetNotificationsQuery, IReadOnlyList<NotificationDto>>
{
    private readonly INotificationRepository _notifRepo;

    public GetNotificationsQueryHandler(INotificationRepository notifRepo) => _notifRepo = notifRepo;

    public async Task<IReadOnlyList<NotificationDto>> Handle(GetNotificationsQuery query, CancellationToken ct)
    {
        var notifications = await _notifRepo.GetByUserIdAsync(query.UserId, query.Page, query.PageSize, ct);

        return notifications.Select(n => new NotificationDto(
            n.Id,
            n.Title,
            n.Body,
            n.Type,
            n.Data,
            n.IsRead,
            n.CreatedAt
        )).ToList();
    }
}

// ── Get Unread Count ────────────────────────────

public record GetUnreadCountQuery(Guid UserId) : IRequest<NotificationCountDto>;

public class GetUnreadCountQueryHandler : IRequestHandler<GetUnreadCountQuery, NotificationCountDto>
{
    private readonly INotificationRepository _notifRepo;

    public GetUnreadCountQueryHandler(INotificationRepository notifRepo) => _notifRepo = notifRepo;

    public async Task<NotificationCountDto> Handle(GetUnreadCountQuery query, CancellationToken ct)
    {
        var count = await _notifRepo.GetUnreadCountAsync(query.UserId, ct);
        return new NotificationCountDto(count);
    }
}
