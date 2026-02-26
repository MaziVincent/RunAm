using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using RunAm.Shared.DTOs.Chat;

namespace RunAm.Api.Hubs;

[Authorize]
public class ChatHub : Hub
{
    /// <summary>
    /// Join the chat room for a specific errand.
    /// </summary>
    public async Task JoinErrandChat(Guid errandId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"chat-{errandId}");
    }

    /// <summary>
    /// Leave the chat room for a specific errand.
    /// </summary>
    public async Task LeaveErrandChat(Guid errandId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"chat-{errandId}");
    }

    /// <summary>
    /// Broadcast a new chat message to all participants in the errand.
    /// </summary>
    public static async Task BroadcastMessage(IHubContext<ChatHub> context, Guid errandId, ChatMessageDto message)
    {
        await context.Clients.Group($"chat-{errandId}").SendAsync("NewMessage", message);
    }

    /// <summary>
    /// Notify that messages have been read.
    /// </summary>
    public static async Task BroadcastMessagesRead(IHubContext<ChatHub> context, Guid errandId, Guid userId)
    {
        await context.Clients.Group($"chat-{errandId}").SendAsync("MessagesRead", new { errandId, userId });
    }

    public override async Task OnConnectedAsync()
    {
        var userId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId != null)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"user-chat-{userId}");
        }
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId != null)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"user-chat-{userId}");
        }
        await base.OnDisconnectedAsync(exception);
    }
}
