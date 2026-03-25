using Microsoft.EntityFrameworkCore;
using RunAm.Domain.Entities;
using RunAm.Domain.Enums;
using RunAm.Domain.Interfaces;

namespace RunAm.Infrastructure.Persistence.Repositories;

public class VendorRepository : IVendorRepository
{
    private readonly AppDbContext _db;

    public VendorRepository(AppDbContext db) => _db = db;

    public async Task<Vendor?> GetByIdAsync(Guid id, CancellationToken ct = default)
        => await _db.Vendors.FindAsync(new object[] { id }, ct);

    public async Task<Vendor?> GetByIdWithDetailsAsync(Guid id, CancellationToken ct = default)
        => await _db.Vendors
            .Include(v => v.User)
            .Include(v => v.VendorServiceCategories)
                .ThenInclude(vsc => vsc.ServiceCategory)
            .Include(v => v.ProductCategories.Where(pc => pc.IsActive).OrderBy(pc => pc.SortOrder))
            .Include(v => v.Products.Where(p => p.IsActive && p.IsAvailable))
            .FirstOrDefaultAsync(v => v.Id == id, ct);

    public async Task<Vendor?> GetByUserIdAsync(Guid userId, CancellationToken ct = default)
        => await _db.Vendors
            .Include(v => v.VendorServiceCategories)
                .ThenInclude(vsc => vsc.ServiceCategory)
            .FirstOrDefaultAsync(v => v.UserId == userId, ct);

    public async Task<IReadOnlyList<Vendor>> GetByCategoryIdAsync(Guid categoryId, int page, int pageSize, CancellationToken ct = default)
        => await _db.Vendors
            .Where(v => v.IsActive && v.Status == VendorStatus.Active)
            .Where(v => v.VendorServiceCategories.Any(vsc => vsc.ServiceCategoryId == categoryId))
            .OrderByDescending(v => v.Rating)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Include(v => v.VendorServiceCategories)
                .ThenInclude(vsc => vsc.ServiceCategory)
            .ToListAsync(ct);

    public async Task<IReadOnlyList<Vendor>> GetNearbyAsync(double latitude, double longitude, double radiusKm, int page, int pageSize, CancellationToken ct = default)
    {
        // Simple distance filter using Euclidean approximation (good enough for short distances)
        // ~111.32 km per degree latitude, ~111.32 * cos(lat) km per degree longitude
        var latDelta = radiusKm / 111.32;
        var lngDelta = radiusKm / (111.32 * Math.Cos(latitude * Math.PI / 180));

        return await _db.Vendors
            .Where(v => v.IsActive && v.Status == VendorStatus.Active)
            .Where(v => v.Latitude >= latitude - latDelta && v.Latitude <= latitude + latDelta)
            .Where(v => v.Longitude >= longitude - lngDelta && v.Longitude <= longitude + lngDelta)
            .OrderByDescending(v => v.Rating)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Include(v => v.VendorServiceCategories)
                .ThenInclude(vsc => vsc.ServiceCategory)
            .ToListAsync(ct);
    }

    public async Task<IReadOnlyList<Vendor>> SearchAsync(string? query, Guid? categoryId, int? status, int page, int pageSize, CancellationToken ct = default)
    {
        var q = status.HasValue
            ? _db.Vendors.Where(v => v.Status == (VendorStatus)status.Value)
            : _db.Vendors.Where(v => v.IsActive && v.Status == VendorStatus.Active);

        if (!string.IsNullOrWhiteSpace(query))
            q = q.Where(v => EF.Functions.ILike(v.BusinessName, $"%{query}%"));

        if (categoryId.HasValue)
            q = q.Where(v => v.VendorServiceCategories.Any(vsc => vsc.ServiceCategoryId == categoryId));

        return await q
            .OrderByDescending(v => v.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Include(v => v.VendorServiceCategories)
                .ThenInclude(vsc => vsc.ServiceCategory)
            .ToListAsync(ct);
    }

    public async Task<int> GetCountAsync(Guid? categoryId = null, int? status = null, CancellationToken ct = default)
    {
        var q = status.HasValue
            ? _db.Vendors.Where(v => v.Status == (VendorStatus)status.Value)
            : _db.Vendors.Where(v => v.IsActive && v.Status == VendorStatus.Active);
        if (categoryId.HasValue)
            q = q.Where(v => v.VendorServiceCategories.Any(vsc => vsc.ServiceCategoryId == categoryId));
        return await q.CountAsync(ct);
    }

    public async Task AddAsync(Vendor vendor, CancellationToken ct = default)
        => await _db.Vendors.AddAsync(vendor, ct);

    public Task UpdateAsync(Vendor vendor, CancellationToken ct = default)
    {
        _db.Vendors.Update(vendor);
        return Task.CompletedTask;
    }
}
