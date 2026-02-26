namespace RunAm.Shared.DTOs.Tracking;

public record TrackingUpdateDto(
    Guid ErrandId,
    Guid RiderId,
    double Latitude,
    double Longitude,
    double? Heading,
    double? Speed,
    int? EtaSeconds,
    string? Status,
    DateTime Timestamp
);

public record EtaResponseDto(
    int EtaSeconds,
    double DistanceMeters,
    DateTime EstimatedArrival
);

public record GeofenceEventDto(
    Guid ErrandId,
    Guid RiderId,
    string EventType, // "arrived_pickup" | "arrived_dropoff"
    double Latitude,
    double Longitude,
    DateTime Timestamp
);
