using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using RunAm.Api.Hubs;
using RunAm.Application.Tracking.Queries;
using RunAm.Shared.DTOs;
using RunAm.Shared.DTOs.Tracking;

namespace RunAm.Api.Controllers;

[Route("api/v1/tracking")]
[Authorize]
public class TrackingController : BaseApiController
{
    private readonly IMediator _mediator;
    private readonly IHubContext<TrackingHub> _trackingHub;

    public TrackingController(IMediator mediator, IHubContext<TrackingHub> trackingHub)
    {
        _mediator = mediator;
        _trackingHub = trackingHub;
    }

    /// <summary>Calculate ETA from rider to destination</summary>
    [HttpGet("eta")]
    [ProducesResponseType(typeof(ApiResponse<EtaResponseDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> CalculateEta(
        [FromQuery] double riderLat,
        [FromQuery] double riderLng,
        [FromQuery] double destLat,
        [FromQuery] double destLng)
    {
        var result = await _mediator.Send(new CalculateEtaQuery(riderLat, riderLng, destLat, destLng));
        return Ok(ApiResponse<EtaResponseDto>.Ok(result));
    }

    /// <summary>Check if rider is within geofence of pickup/dropoff</summary>
    [HttpPost("geofence")]
    [ProducesResponseType(typeof(ApiResponse<GeofenceEventDto?>), StatusCodes.Status200OK)]
    public async Task<IActionResult> CheckGeofence([FromBody] CheckGeofenceRequest request)
    {
        var result = await _mediator.Send(new CheckGeofenceQuery(
            request.ErrandId, request.RiderId,
            request.RiderLat, request.RiderLng,
            request.TargetLat, request.TargetLng,
            request.TargetType
        ));

        if (result != null)
        {
            // Broadcast geofence event
            await TrackingHub.BroadcastGeofenceEvent(_trackingHub, request.ErrandId, result);
        }

        return Ok(ApiResponse<GeofenceEventDto?>.Ok(result));
    }
}

public record CheckGeofenceRequest(
    Guid ErrandId,
    Guid RiderId,
    double RiderLat,
    double RiderLng,
    double TargetLat,
    double TargetLng,
    string TargetType
);
