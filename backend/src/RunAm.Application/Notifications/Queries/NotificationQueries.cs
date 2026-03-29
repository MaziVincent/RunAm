using MediatR;
using RunAm.Domain.Interfaces;
using RunAm.Shared.DTOs.Notifications;

namespace RunAm.Application.Notifications.Queries;

// ── Get Notifications ───────────────────────────

public record GetNotificationsQuery(Guid UserId, int Page = 1, int PageSize = 20) : IRequest<(IReadOnlyList<NotificationDto> Notifications, int TotalCount)>;

public class GetNotificationsQueryHandler : IRequestHandler<GetNotificationsQuery, (IReadOnlyList<NotificationDto> Notifications, int TotalCount)>
{
    private readonly INotificationRepository _notifRepo;

    public GetNotificationsQueryHandler(INotificationRepository notifRepo) => _notifRepo = notifRepo;

    public async Task<(IReadOnlyList<NotificationDto> Notifications, int TotalCount)> Handle(GetNotificationsQuery query, CancellationToken ct)
    {
        var notifications = await _notifRepo.GetByUserIdAsync(query.UserId, query.Page, query.PageSize, ct);
        var totalCount = await _notifRepo.GetCountByUserIdAsync(query.UserId, ct);

        var dtos = notifications.Select(n => new NotificationDto(
            n.Id,
            n.Title,
            n.Body,
            n.Type,
            n.Data,
            n.IsRead,
            n.CreatedAt
        )).ToList();

        return (dtos, totalCount);
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
