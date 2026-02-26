using MediatR;
using RunAm.Domain.Enums;
using RunAm.Domain.Interfaces;
using RunAm.Shared.Constants;
using RunAm.Shared.DTOs.Riders;

namespace RunAm.Application.Matching.Queries;

public record FindNearbyRidersQuery(
    double PickupLatitude,
    double PickupLongitude,
    VehicleType? VehicleType = null,
    double? RadiusKm = null
) : IRequest<IReadOnlyList<RiderProfileDto>>;

public class FindNearbyRidersQueryHandler : IRequestHandler<FindNearbyRidersQuery, IReadOnlyList<RiderProfileDto>>
{
    private readonly IRiderRepository _riderRepo;

    public FindNearbyRidersQueryHandler(IRiderRepository riderRepo) => _riderRepo = riderRepo;

    public async Task<IReadOnlyList<RiderProfileDto>> Handle(FindNearbyRidersQuery query, CancellationToken cancellationToken)
    {
        var radius = query.RadiusKm ?? AppConstants.Matching.InitialRadiusKm;

        var riders = await _riderRepo.GetNearbyAvailableRidersAsync(
            query.PickupLatitude, query.PickupLongitude, radius,
            query.VehicleType, cancellationToken);

        // If no riders found, expand search radius
        while (!riders.Any() && radius < AppConstants.Matching.MaxRadiusKm)
        {
            radius += AppConstants.Matching.RadiusIncrementKm;
            riders = await _riderRepo.GetNearbyAvailableRidersAsync(
                query.PickupLatitude, query.PickupLongitude, radius,
                query.VehicleType, cancellationToken);
        }

        return riders.Select(r => new RiderProfileDto(
            r.Id, r.UserId, r.User?.FullName ?? "", r.VehicleType, r.LicensePlate,
            r.ApprovalStatus, r.Rating, r.TotalCompletedTasks, r.IsOnline,
            r.CurrentLatitude, r.CurrentLongitude, r.LastLocationUpdate, r.CreatedAt
        )).ToList();
    }
}
