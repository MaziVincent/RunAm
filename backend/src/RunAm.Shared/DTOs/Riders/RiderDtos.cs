using RunAm.Domain.Enums;

namespace RunAm.Shared.DTOs.Riders;

public record RiderProfileDto(
    Guid Id,
    Guid UserId,
    string RiderName,
    VehicleType VehicleType,
    string? LicensePlate,
    ApprovalStatus ApprovalStatus,
    decimal Rating,
    int TotalCompletedTasks,
    bool IsOnline,
    double? CurrentLatitude,
    double? CurrentLongitude,
    DateTime? LastLocationUpdate,
    DateTime CreatedAt
);

public record CreateRiderProfileRequest(
    VehicleType VehicleType,
    string? LicensePlate
);

public record UpdateRiderLocationRequest(
    double Latitude,
    double Longitude,
    double? Heading,
    double? Speed
);

public record BatchLocationUpdate(
    List<LocationPoint> Points
);

public record LocationPoint(
    double Latitude,
    double Longitude,
    double? Heading,
    double? Speed,
    DateTime RecordedAt
);

public record RiderStatusRequest(bool IsOnline);

public record ApproveRiderRequest(
    ApprovalStatus Status,
    string? Reason
);
