using RunAm.Domain.Enums;

namespace RunAm.Shared.DTOs.Errands;

public record ErrandDto(
    Guid Id,
    Guid CustomerId,
    string CustomerName,
    Guid? RiderId,
    string? RiderName,
    ErrandCategory Category,
    ErrandStatus Status,
    string? Description,
    string? SpecialInstructions,
    ErrandPriority Priority,
    DateTime? ScheduledAt,
    string PickupAddress,
    double PickupLatitude,
    double PickupLongitude,
    string DropoffAddress,
    double DropoffLatitude,
    double DropoffLongitude,
    double? EstimatedDistance,
    int? EstimatedDuration,
    PackageSize? PackageSize,
    decimal? PackageWeight,
    bool IsFragile,
    bool RequiresPhotoProof,
    string? RecipientName,
    string? RecipientPhone,
    decimal TotalAmount,
    DateTime? AcceptedAt,
    DateTime? PickedUpAt,
    DateTime? DeliveredAt,
    DateTime? CancelledAt,
    string? CancellationReason,
    DateTime CreatedAt,
    List<ErrandStatusHistoryDto>? StatusHistory,
    List<ErrandStopDto>? Stops
);

public record CreateErrandRequest(
    ErrandCategory Category,
    string? Description,
    string? SpecialInstructions,
    ErrandPriority Priority,
    DateTime? ScheduledAt,
    string PickupAddress,
    double PickupLatitude,
    double PickupLongitude,
    string DropoffAddress,
    double DropoffLatitude,
    double DropoffLongitude,
    PackageSize? PackageSize,
    decimal? PackageWeight,
    bool IsFragile,
    bool RequiresPhotoProof,
    string? RecipientName,
    string? RecipientPhone,
    PaymentMethod PaymentMethod,
    List<CreateErrandStopRequest>? Stops
);

public record CreateErrandStopRequest(
    int StopOrder,
    string Address,
    double Latitude,
    double Longitude,
    string? ContactName,
    string? ContactPhone,
    string? Instructions
);

public record ErrandStatusHistoryDto(
    Guid Id,
    ErrandStatus Status,
    double? Latitude,
    double? Longitude,
    string? Notes,
    string? ImageUrl,
    DateTime CreatedAt
);

public record ErrandStopDto(
    Guid Id,
    int StopOrder,
    string Address,
    double Latitude,
    double Longitude,
    string? ContactName,
    string? ContactPhone,
    string? Instructions,
    ErrandStopStatus Status,
    DateTime? ArrivedAt,
    DateTime? CompletedAt
);

public record CancelErrandRequest(string Reason);

public record UpdateErrandStatusRequest(
    ErrandStatus Status,
    double? Latitude,
    double? Longitude,
    string? Notes,
    string? ImageUrl
);

public record PriceEstimateRequest(
    ErrandCategory Category,
    double PickupLatitude,
    double PickupLongitude,
    double DropoffLatitude,
    double DropoffLongitude,
    PackageSize? PackageSize,
    decimal? PackageWeight,
    ErrandPriority Priority
);

public record PriceEstimateResponse(
    decimal EstimatedPrice,
    decimal BaseFare,
    decimal DistanceFare,
    decimal WeightSurcharge,
    decimal PrioritySurcharge,
    double EstimatedDistanceKm,
    int EstimatedDurationMinutes
);

// ── Marketplace (Vendor) Order ──────────────────────────────────

public record CreateMarketplaceOrderRequest(
    Guid VendorId,
    string DropoffAddress,
    double DropoffLatitude,
    double DropoffLongitude,
    string? RecipientName,
    string? RecipientPhone,
    string? SpecialInstructions,
    PaymentMethod PaymentMethod,
    string? PromoCode,
    List<CreateOrderItemRequest> Items
);

public record CreateOrderItemRequest(
    Guid ProductId,
    int Quantity,
    string? Notes,
    string? SelectedVariantJson,
    string? SelectedExtrasJson
);
