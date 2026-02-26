using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using RunAm.Api.Hubs;
using RunAm.Application.Notifications.Commands;
using RunAm.Application.Notifications.Queries;
using RunAm.Shared.DTOs;
using RunAm.Shared.DTOs.Notifications;
using RunAm.Shared.DTOs.Reviews;

namespace RunAm.Api.Controllers;

[Route("api/v1/notifications")]
[Authorize]
public class NotificationsController : BaseApiController
{
    private readonly IMediator _mediator;
    private readonly IHubContext<NotificationHub> _notifHub;

    public NotificationsController(IMediator mediator, IHubContext<NotificationHub> notifHub)
    {
        _mediator = mediator;
        _notifHub = notifHub;
    }

    /// <summary>Get current user's notifications</summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<NotificationDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetNotifications([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var result = await _mediator.Send(new GetNotificationsQuery(GetUserId(), page, pageSize));
        return Ok(ApiResponse<IReadOnlyList<NotificationDto>>.Ok(result));
    }

    /// <summary>Get unread notification count</summary>
    [HttpGet("unread-count")]
    [ProducesResponseType(typeof(ApiResponse<NotificationCountDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUnreadCount()
    {
        var result = await _mediator.Send(new GetUnreadCountQuery(GetUserId()));
        return Ok(ApiResponse<NotificationCountDto>.Ok(result));
    }

    /// <summary>Mark a notification as read</summary>
    [HttpPatch("{id:guid}/read")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> MarkAsRead(Guid id)
    {
        var userId = GetUserId();
        await _mediator.Send(new MarkNotificationReadCommand(id, userId));
        await NotificationHub.SendUnreadCount(_notifHub, userId,
            (await _mediator.Send(new GetUnreadCountQuery(userId))).UnreadCount);
        return NoContent();
    }

    /// <summary>Mark all notifications as read</summary>
    [HttpPatch("read-all")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> MarkAllAsRead()
    {
        var userId = GetUserId();
        await _mediator.Send(new MarkAllNotificationsReadCommand(userId));
        await NotificationHub.SendUnreadCount(_notifHub, userId, 0);
        return NoContent();
    }

    // ── Notification Preferences ────────────────

    /// <summary>Get current user's notification preferences</summary>
    [HttpGet("preferences")]
    [ProducesResponseType(typeof(ApiResponse<NotificationPreferenceDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPreferences()
    {
        var result = await _mediator.Send(new GetNotificationPreferencesQuery(GetUserId()));
        return Ok(ApiResponse<NotificationPreferenceDto>.Ok(result));
    }

    /// <summary>Update current user's notification preferences</summary>
    [HttpPatch("preferences")]
    [ProducesResponseType(typeof(ApiResponse<NotificationPreferenceDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> UpdatePreferences([FromBody] UpdateNotificationPreferenceRequest request)
    {
        var result = await _mediator.Send(new UpdateNotificationPreferencesCommand(GetUserId(), request));
        return Ok(ApiResponse<NotificationPreferenceDto>.Ok(result));
    }
}
