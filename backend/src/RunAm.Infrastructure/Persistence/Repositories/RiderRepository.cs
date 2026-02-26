using Microsoft.EntityFrameworkCore;
using RunAm.Domain.Entities;
using RunAm.Domain.Enums;
using RunAm.Domain.Interfaces;
using RunAm.Infrastructure.Persistence;

namespace RunAm.Infrastructure.Persistence.Repositories;

public class RiderRepository : IRiderRepository
{
    private readonly AppDbContext _db;

    public RiderRepository(AppDbContext db) => _db = db;

    public async Task<RiderProfile?> GetByUserIdAsync(Guid userId, CancellationToken ct = default)
        => await _db.RiderProfiles
            .Include(r => r.User)
            .FirstOrDefaultAsync(r => r.UserId == userId, ct);

    public async Task<RiderProfile?> GetByIdAsync(Guid id, CancellationToken ct = default)
        => await _db.RiderProfiles
            .Include(r => r.User)
            .FirstOrDefaultAsync(r => r.Id == id, ct);

    public async Task<IReadOnlyList<RiderProfile>> GetNearbyAvailableRidersAsync(
        double latitude, double longitude, double radiusKm,
        VehicleType? vehicleType = null, CancellationToken ct = default)
    {
        // Haversine distance approximation using simple Euclidean for performance
        // 1 degree latitude ≈ 111 km
        var latDelta = radiusKm / 111.0;
        var lngDelta = radiusKm / (111.0 * Math.Cos(latitude * Math.PI / 180));

        var query = _db.RiderProfiles
            .Include(r => r.User)
            .Where(r => r.IsOnline
                && r.ApprovalStatus == ApprovalStatus.Approved
                && r.CurrentLatitude != null
                && r.CurrentLongitude != null
                && r.CurrentLatitude >= latitude - latDelta
                && r.CurrentLatitude <= latitude + latDelta
                && r.CurrentLongitude >= longitude - lngDelta
                && r.CurrentLongitude <= longitude + lngDelta);

        if (vehicleType.HasValue)
            query = query.Where(r => r.VehicleType == vehicleType.Value);

        return await query
            .OrderByDescending(r => r.Rating)
            .ToListAsync(ct);
    }

    public async Task<IReadOnlyList<RiderProfile>> GetPendingApprovalAsync(CancellationToken ct = default)
        => await _db.RiderProfiles
            .Include(r => r.User)
            .Where(r => r.ApprovalStatus == ApprovalStatus.Pending)
            .OrderBy(r => r.CreatedAt)
            .ToListAsync(ct);

    public async Task AddAsync(RiderProfile profile, CancellationToken ct = default)
        => await _db.RiderProfiles.AddAsync(profile, ct);

    public Task UpdateAsync(RiderProfile profile, CancellationToken ct = default)
    {
        _db.RiderProfiles.Update(profile);
        return Task.CompletedTask;
    }

    public async Task AddLocationsAsync(IEnumerable<RiderLocation> locations, CancellationToken ct = default)
        => await _db.RiderLocations.AddRangeAsync(locations, ct);
}
