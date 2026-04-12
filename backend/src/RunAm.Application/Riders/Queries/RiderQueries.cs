using MediatR;
using RunAm.Domain.Enums;
using RunAm.Domain.Exceptions;
using RunAm.Domain.Interfaces;
using RunAm.Shared.DTOs.Errands;
using RunAm.Shared.DTOs.Riders;

namespace RunAm.Application.Riders.Queries;

// ── Get Rider Profile ───────────────────────────

public record GetRiderProfileQuery(Guid UserId) : IRequest<RiderProfileDto?>;

public class GetRiderProfileQueryHandler : IRequestHandler<GetRiderProfileQuery, RiderProfileDto?>
{
    private readonly IRiderRepository _riderRepo;
    public GetRiderProfileQueryHandler(IRiderRepository riderRepo) => _riderRepo = riderRepo;

    public async Task<RiderProfileDto?> Handle(GetRiderProfileQuery query, CancellationToken ct)
    {
        var profile = await _riderRepo.GetByUserIdAsync(query.UserId, ct);
        if (profile is null) return null;

        return new RiderProfileDto(
            profile.Id, profile.UserId, profile.User?.FullName ?? "",
            profile.VehicleType, profile.LicensePlate,
            profile.ApprovalStatus, profile.Rating, profile.TotalCompletedTasks,
            profile.IsOnline, profile.CurrentLatitude, profile.CurrentLongitude,
            profile.LastLocationUpdate, profile.CreatedAt);
    }
}

// ── Get Available Tasks (pending, unassigned) ───

public record GetAvailableTasksQuery(Guid UserId) : IRequest<IReadOnlyList<ErrandDto>>;

public class GetAvailableTasksQueryHandler : IRequestHandler<GetAvailableTasksQuery, IReadOnlyList<ErrandDto>>
{
    private readonly IErrandRepository _errandRepo;
    public GetAvailableTasksQueryHandler(IErrandRepository errandRepo) => _errandRepo = errandRepo;

    public async Task<IReadOnlyList<ErrandDto>> Handle(GetAvailableTasksQuery query, CancellationToken ct)
    {
        var errands = await _errandRepo.GetPendingErrandsAsync(ct);

        return errands.Select(e => new ErrandDto(
            e.Id, e.CustomerId, e.Customer?.FullName ?? "", e.RiderId, null,
            e.Category, e.Status, e.Description, e.SpecialInstructions,
            e.Priority, e.ScheduledAt, e.PickupAddress, e.PickupLatitude, e.PickupLongitude,
            e.DropoffAddress, e.DropoffLatitude, e.DropoffLongitude,
            e.EstimatedDistance, e.EstimatedDuration, e.PackageSize, e.PackageWeight,
            e.IsFragile, e.RequiresPhotoProof, e.RecipientName, e.RecipientPhone,
            e.TotalAmount, e.AcceptedAt, e.PickedUpAt, e.DeliveredAt, e.CancelledAt,
            e.CancellationReason, e.CreatedAt, null, null,
            e.VendorId, e.Vendor?.BusinessName, e.VendorOrderStatus != null ? (int)e.VendorOrderStatus : null
        )).ToList();
    }
}

// ── Get Active Tasks (rider's in-progress) ──────

public record GetActiveRiderTasksQuery(Guid UserId) : IRequest<IReadOnlyList<ErrandDto>>;

public class GetActiveRiderTasksQueryHandler : IRequestHandler<GetActiveRiderTasksQuery, IReadOnlyList<ErrandDto>>
{
    private readonly IErrandRepository _errandRepo;
    private readonly IRiderRepository _riderRepo;

    public GetActiveRiderTasksQueryHandler(IErrandRepository errandRepo, IRiderRepository riderRepo)
    { _errandRepo = errandRepo; _riderRepo = riderRepo; }

    public async Task<IReadOnlyList<ErrandDto>> Handle(GetActiveRiderTasksQuery query, CancellationToken ct)
    {
        var profile = await _riderRepo.GetByUserIdAsync(query.UserId, ct);
        if (profile is null) return Array.Empty<ErrandDto>();

        // Get rider's errands and filter to active (not terminal) statuses
        var errands = await _errandRepo.GetByRiderIdAsync(profile.UserId, 1, 50, ct);
        var active = errands.Where(e =>
            e.Status != ErrandStatus.Delivered &&
            e.Status != ErrandStatus.Cancelled &&
            e.Status != ErrandStatus.Failed &&
            e.Status != ErrandStatus.Pending).ToList();

        return active.Select(e => new ErrandDto(
            e.Id, e.CustomerId, e.Customer?.FullName ?? "", e.RiderId, null,
            e.Category, e.Status, e.Description, e.SpecialInstructions,
            e.Priority, e.ScheduledAt, e.PickupAddress, e.PickupLatitude, e.PickupLongitude,
            e.DropoffAddress, e.DropoffLatitude, e.DropoffLongitude,
            e.EstimatedDistance, e.EstimatedDuration, e.PackageSize, e.PackageWeight,
            e.IsFragile, e.RequiresPhotoProof, e.RecipientName, e.RecipientPhone,
            e.TotalAmount, e.AcceptedAt, e.PickedUpAt, e.DeliveredAt, e.CancelledAt,
            e.CancellationReason, e.CreatedAt, null, null,
            e.VendorId, e.Vendor?.BusinessName, e.VendorOrderStatus != null ? (int)e.VendorOrderStatus : null
        )).ToList();
    }
}

// ── Get Task History (rider's completed/cancelled) ──

public record GetRiderTaskHistoryQuery(Guid UserId, int Page = 1, int PageSize = 20)
    : IRequest<IReadOnlyList<ErrandDto>>;

public class GetRiderTaskHistoryQueryHandler : IRequestHandler<GetRiderTaskHistoryQuery, IReadOnlyList<ErrandDto>>
{
    private readonly IErrandRepository _errandRepo;
    private readonly IRiderRepository _riderRepo;

    public GetRiderTaskHistoryQueryHandler(IErrandRepository errandRepo, IRiderRepository riderRepo)
    { _errandRepo = errandRepo; _riderRepo = riderRepo; }

    public async Task<IReadOnlyList<ErrandDto>> Handle(GetRiderTaskHistoryQuery query, CancellationToken ct)
    {
        var profile = await _riderRepo.GetByUserIdAsync(query.UserId, ct);
        if (profile is null) return Array.Empty<ErrandDto>();

        var errands = await _errandRepo.GetByRiderIdAsync(profile.UserId, query.Page, query.PageSize, ct);
        var history = errands.Where(e =>
            e.Status == ErrandStatus.Delivered ||
            e.Status == ErrandStatus.Cancelled ||
            e.Status == ErrandStatus.Failed).ToList();

        return history.Select(e => new ErrandDto(
            e.Id, e.CustomerId, e.Customer?.FullName ?? "", e.RiderId, null,
            e.Category, e.Status, e.Description, e.SpecialInstructions,
            e.Priority, e.ScheduledAt, e.PickupAddress, e.PickupLatitude, e.PickupLongitude,
            e.DropoffAddress, e.DropoffLatitude, e.DropoffLongitude,
            e.EstimatedDistance, e.EstimatedDuration, e.PackageSize, e.PackageWeight,
            e.IsFragile, e.RequiresPhotoProof, e.RecipientName, e.RecipientPhone,
            e.TotalAmount, e.AcceptedAt, e.PickedUpAt, e.DeliveredAt, e.CancelledAt,
            e.CancellationReason, e.CreatedAt, null, null,
            e.VendorId, e.Vendor?.BusinessName, e.VendorOrderStatus != null ? (int)e.VendorOrderStatus : null
        )).ToList();
    }
}

// ── Get Rider Performance ───────────────────────

public record GetRiderPerformanceQuery(Guid UserId) : IRequest<RiderPerformanceDto>;

public record RiderPerformanceDto(
    decimal CompletionRate,
    decimal AverageRating,
    double AverageResponseTime,
    decimal OnTimeRate,
    int TotalDeliveries,
    int MonthlyDeliveries
);

public class GetRiderPerformanceQueryHandler : IRequestHandler<GetRiderPerformanceQuery, RiderPerformanceDto>
{
    private readonly IRiderRepository _riderRepo;
    private readonly IErrandRepository _errandRepo;

    public GetRiderPerformanceQueryHandler(IRiderRepository riderRepo, IErrandRepository errandRepo)
    { _riderRepo = riderRepo; _errandRepo = errandRepo; }

    public async Task<RiderPerformanceDto> Handle(GetRiderPerformanceQuery query, CancellationToken ct)
    {
        var profile = await _riderRepo.GetByUserIdAsync(query.UserId, ct);
        if (profile is null)
            return new RiderPerformanceDto(0, 0, 0, 0, 0, 0);

        var totalDeliveries = profile.TotalCompletedTasks;
        var averageRating = profile.Rating;

        // Get recent errands for this rider to compute rates
        var recentErrands = await _errandRepo.GetByRiderIdAsync(profile.UserId, 1, 200, ct);
        var monthStart = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var monthlyDeliveries = recentErrands.Count(e =>
            e.Status == ErrandStatus.Delivered && e.DeliveredAt >= monthStart);

        var assignedCount = recentErrands.Count;
        var deliveredCount = recentErrands.Count(e => e.Status == ErrandStatus.Delivered);
        var completionRate = assignedCount > 0 ? (decimal)deliveredCount / assignedCount : 0m;

        // On-time rate: delivered errands that took less than estimated duration
        var deliveredWithEstimate = recentErrands
            .Where(e => e.Status == ErrandStatus.Delivered && e.EstimatedDuration.HasValue && e.AcceptedAt.HasValue && e.DeliveredAt.HasValue)
            .ToList();
        var onTimeCount = deliveredWithEstimate.Count(e =>
            (e.DeliveredAt!.Value - e.AcceptedAt!.Value).TotalMinutes <= e.EstimatedDuration!.Value * 1.2);
        var onTimeRate = deliveredWithEstimate.Count > 0 ? (decimal)onTimeCount / deliveredWithEstimate.Count : 0m;

        // Average response time: time from creation to acceptance (seconds)
        var acceptedErrands = recentErrands
            .Where(e => e.AcceptedAt.HasValue)
            .Select(e => (e.AcceptedAt!.Value - e.CreatedAt).TotalSeconds)
            .ToList();
        var avgResponseTime = acceptedErrands.Count > 0 ? acceptedErrands.Average() : 0;

        return new RiderPerformanceDto(
            Math.Round(completionRate, 4),
            averageRating,
            Math.Round(avgResponseTime, 0),
            Math.Round(onTimeRate, 4),
            totalDeliveries,
            monthlyDeliveries);
    }
}
