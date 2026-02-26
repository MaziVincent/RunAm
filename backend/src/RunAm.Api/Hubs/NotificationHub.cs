using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using RunAm.Shared.DTOs.Notifications;

namespace RunAm.Api.Hubs;

[Authorize]
public class NotificationHub : Hub
{
    /// <summary>
    /// Send a real-time notification to a specific user.
    /// </summary>
    public static async Task SendToUser(IHubContext<NotificationHub> context, Guid userId, NotificationDto notification)
    {
        await context.Clients.Group($"notifications-{userId}").SendAsync("NewNotification", notification);
    }

    /// <summary>
    /// Broadcast notification count update to a user.
    /// </summary>
    public static async Task SendUnreadCount(IHubContext<NotificationHub> context, Guid userId, int count)
    {
        await context.Clients.Group($"notifications-{userId}").SendAsync("UnreadCountUpdated", new { count });
    }

    public override async Task OnConnectedAsync()
    {
        var userId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId != null)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"notifications-{userId}");
        }
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId != null)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"notifications-{userId}");
        }
        await base.OnDisconnectedAsync(exception);
    }
}
