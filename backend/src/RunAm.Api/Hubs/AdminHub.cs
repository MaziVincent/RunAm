using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using RunAm.Shared.DTOs.Tracking;

namespace RunAm.Api.Hubs;

/// <summary>
/// Real-time updates for the admin dashboard: live metrics, errand status changes, rider movement.
/// </summary>
[Authorize(Roles = "Admin,SupportAgent")]
public class AdminHub : Hub
{
    /// <summary>
    /// Broadcast errand status change to all admin connections.
    /// </summary>
    public static async Task BroadcastErrandUpdate(IHubContext<AdminHub> context, object errandUpdate)
    {
        await context.Clients.All.SendAsync("ErrandUpdated", errandUpdate);
    }

    /// <summary>
    /// Broadcast rider location updates for the live map.
    /// </summary>
    public static async Task BroadcastRiderLocations(IHubContext<AdminHub> context, IEnumerable<TrackingUpdateDto> locations)
    {
        await context.Clients.All.SendAsync("RiderLocationsUpdated", locations);
    }

    /// <summary>
    /// Broadcast live dashboard metric updates.
    /// </summary>
    public static async Task BroadcastMetrics(IHubContext<AdminHub> context, object metrics)
    {
        await context.Clients.All.SendAsync("MetricsUpdated", metrics);
    }

    public override async Task OnConnectedAsync()
    {
        var userId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId != null)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"admin-{userId}");
        }
        await base.OnConnectedAsync();
    }
}
