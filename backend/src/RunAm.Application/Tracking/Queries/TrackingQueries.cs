using MediatR;
using RunAm.Shared.DTOs.Tracking;

namespace RunAm.Application.Tracking.Queries;

// ── Calculate ETA ───────────────────────────────

public record CalculateEtaQuery(
    double RiderLatitude,
    double RiderLongitude,
    double DestinationLatitude,
    double DestinationLongitude
) : IRequest<EtaResponseDto>;

public class CalculateEtaQueryHandler : IRequestHandler<CalculateEtaQuery, EtaResponseDto>
{
    public Task<EtaResponseDto> Handle(CalculateEtaQuery query, CancellationToken ct)
    {
        // Haversine formula for distance calculation
        var distanceMeters = CalculateHaversineDistance(
            query.RiderLatitude, query.RiderLongitude,
            query.DestinationLatitude, query.DestinationLongitude
        );

        // Assume average speed of 25 km/h for urban delivery
        const double averageSpeedMps = 25.0 * 1000.0 / 3600.0; // ~6.94 m/s
        var etaSeconds = (int)Math.Ceiling(distanceMeters / averageSpeedMps);

        // Add buffer for traffic (20%)
        etaSeconds = (int)(etaSeconds * 1.2);

        var estimatedArrival = DateTime.UtcNow.AddSeconds(etaSeconds);

        return Task.FromResult(new EtaResponseDto(etaSeconds, distanceMeters, estimatedArrival));
    }

    private static double CalculateHaversineDistance(double lat1, double lon1, double lat2, double lon2)
    {
        const double earthRadiusMeters = 6_371_000;

        var dLat = DegreesToRadians(lat2 - lat1);
        var dLon = DegreesToRadians(lon2 - lon1);

        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(DegreesToRadians(lat1)) * Math.Cos(DegreesToRadians(lat2)) *
                Math.Sin(dLon / 2) * Math.Sin(dLon / 2);

        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));

        return earthRadiusMeters * c;
    }

    private static double DegreesToRadians(double degrees) => degrees * Math.PI / 180.0;
}

// ── Check Geofence ──────────────────────────────

public record CheckGeofenceQuery(
    Guid ErrandId,
    Guid RiderId,
    double RiderLatitude,
    double RiderLongitude,
    double TargetLatitude,
    double TargetLongitude,
    string TargetType // "pickup" or "dropoff"
) : IRequest<GeofenceEventDto?>;

public class CheckGeofenceQueryHandler : IRequestHandler<CheckGeofenceQuery, GeofenceEventDto?>
{
    private const double GeofenceRadiusMeters = 100; // 100m radius

    public Task<GeofenceEventDto?> Handle(CheckGeofenceQuery query, CancellationToken ct)
    {
        var distance = CalculateHaversineDistance(
            query.RiderLatitude, query.RiderLongitude,
            query.TargetLatitude, query.TargetLongitude
        );

        if (distance <= GeofenceRadiusMeters)
        {
            var eventType = query.TargetType == "pickup" ? "arrived_pickup" : "arrived_dropoff";
            return Task.FromResult<GeofenceEventDto?>(new GeofenceEventDto(
                query.ErrandId,
                query.RiderId,
                eventType,
                query.RiderLatitude,
                query.RiderLongitude,
                DateTime.UtcNow
            ));
        }

        return Task.FromResult<GeofenceEventDto?>(null);
    }

    private static double CalculateHaversineDistance(double lat1, double lon1, double lat2, double lon2)
    {
        const double earthRadiusMeters = 6_371_000;

        var dLat = DegreesToRadians(lat2 - lat1);
        var dLon = DegreesToRadians(lon2 - lon1);

        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(DegreesToRadians(lat1)) * Math.Cos(DegreesToRadians(lat2)) *
                Math.Sin(dLon / 2) * Math.Sin(dLon / 2);

        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));

        return earthRadiusMeters * c;
    }

    private static double DegreesToRadians(double degrees) => degrees * Math.PI / 180.0;
}
