using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using RunAm.Shared.DTOs.Tracking;

namespace RunAm.Api.Hubs;

[Authorize]
public class TrackingHub : Hub
{
    /// <summary>
    /// Customer joins a tracking room for their errand.
    /// </summary>
    public async Task JoinErrandTracking(Guid errandId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"errand-{errandId}");
    }

    /// <summary>
    /// Leave an errand tracking room.
    /// </summary>
    public async Task LeaveErrandTracking(Guid errandId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"errand-{errandId}");
    }

    /// <summary>
    /// Rider sends location update. Broadcast to the errand's customer.
    /// </summary>
    public async Task SendLocationUpdate(TrackingUpdateDto update)
    {
        await Clients.Group($"errand-{update.ErrandId}").SendAsync("LocationUpdated", update);
    }

    /// <summary>
    /// Broadcast an ETA update to watchers of an errand.
    /// </summary>
    public static async Task BroadcastEta(IHubContext<TrackingHub> context, Guid errandId, EtaResponseDto eta)
    {
        await context.Clients.Group($"errand-{errandId}").SendAsync("EtaUpdated", eta);
    }

    /// <summary>
    /// Broadcast a geofence event (arrival at pickup/dropoff).
    /// </summary>
    public static async Task BroadcastGeofenceEvent(IHubContext<TrackingHub> context, Guid errandId, GeofenceEventDto geoEvent)
    {
        await context.Clients.Group($"errand-{errandId}").SendAsync("GeofenceEvent", geoEvent);
    }

    public override async Task OnConnectedAsync()
    {
        var userId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId != null)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"user-{userId}");
        }
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId != null)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"user-{userId}");
        }
        await base.OnDisconnectedAsync(exception);
    }
}
