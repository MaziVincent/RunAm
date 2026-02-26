using RunAm.Domain.Entities;
using RunAm.Domain.Enums;

namespace RunAm.Domain.Interfaces;

public interface IRiderRepository
{
    Task<RiderProfile?> GetByUserIdAsync(Guid userId, CancellationToken ct = default);
    Task<RiderProfile?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<RiderProfile>> GetNearbyAvailableRidersAsync(double latitude, double longitude, double radiusKm, VehicleType? vehicleType = null, CancellationToken ct = default);
    Task<IReadOnlyList<RiderProfile>> GetPendingApprovalAsync(CancellationToken ct = default);
    Task AddAsync(RiderProfile profile, CancellationToken ct = default);
    Task UpdateAsync(RiderProfile profile, CancellationToken ct = default);
    Task AddLocationsAsync(IEnumerable<RiderLocation> locations, CancellationToken ct = default);
}
