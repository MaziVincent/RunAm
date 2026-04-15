using Microsoft.EntityFrameworkCore;
using RunAm.Domain.Entities;
using RunAm.Domain.Interfaces;
using RunAm.Infrastructure.Persistence;

namespace RunAm.Infrastructure.Persistence.Repositories;

public class ErrandRepository : IErrandRepository
{
    private readonly AppDbContext _db;

    public ErrandRepository(AppDbContext db) => _db = db;

    public async Task<Errand?> GetByIdAsync(Guid id, CancellationToken ct = default)
        => await _db.Errands.FindAsync(new object[] { id }, ct);

    public async Task<Errand?> GetByIdWithDetailsAsync(Guid id, CancellationToken ct = default)
        => await _db.Errands
            .AsSplitQuery()
            .Include(e => e.Customer)
            .Include(e => e.Rider)
            .Include(e => e.Vendor)
            .Include(e => e.StatusHistory.OrderBy(s => s.CreatedAt))
            .Include(e => e.Stops.OrderBy(s => s.StopOrder))
            .FirstOrDefaultAsync(e => e.Id == id, ct);

    public async Task<IReadOnlyList<Errand>> GetByCustomerIdAsync(Guid customerId, int page, int pageSize, string? status = null, CancellationToken ct = default)
    {
        var query = _db.Errands.Where(e => e.CustomerId == customerId);
        query = ApplyStatusFilter(query, status);
        return await query
            .OrderByDescending(e => e.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Include(e => e.Rider)
            .Include(e => e.Vendor)
            .ToListAsync(ct);
    }

    public async Task<IReadOnlyList<Errand>> GetByRiderIdAsync(Guid riderId, int page, int pageSize, string? status = null, CancellationToken ct = default)
    {
        var query = _db.Errands.Where(e => e.RiderId == riderId);
        query = ApplyStatusFilter(query, status);

        return await query
            .OrderByDescending(e => e.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Include(e => e.Customer)
            .ToListAsync(ct);
    }

    public async Task<IReadOnlyList<Errand>> GetByVendorIdAsync(Guid vendorId, int page, int pageSize, string? status = null, CancellationToken ct = default)
    {
        var query = _db.Errands.Where(e => e.VendorId == vendorId);
        query = ApplyVendorOrderStatusFilter(query, status);

        return await query
            .OrderByDescending(e => e.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Include(e => e.Customer)
            .Include(e => e.Rider)
            .ToListAsync(ct);
    }

    public async Task<IReadOnlyList<Errand>> GetPendingErrandsAsync(CancellationToken ct = default)
        => await _db.Errands
            .Where(e => e.Status == Domain.Enums.ErrandStatus.Pending)
            .Where(e => e.RiderId == null)
            .Where(e => e.VendorId == null || e.VendorOrderStatus == Domain.Enums.VendorOrderStatus.ReadyForPickup)
            .OrderBy(e => e.CreatedAt)
            .Include(e => e.Customer)
            .Include(e => e.Vendor)
            .ToListAsync(ct);

    public async Task<(IReadOnlyList<Errand> Items, int TotalCount)> GetAllAsync(int page, int pageSize, string? search = null, int? status = null, CancellationToken ct = default)
    {
        var query = _db.Errands.Include(e => e.Customer).Include(e => e.Rider).Include(e => e.Vendor).AsQueryable();

        if (status.HasValue)
            query = query.Where(e => (int)e.Status == status.Value);

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(e =>
                (e.Customer != null && e.Customer.FullName.Contains(search)) ||
                (e.Description != null && e.Description.Contains(search)) ||
                e.Id.ToString().Contains(search));

        var totalCount = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(e => e.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return (items, totalCount);
    }

    public async Task<int> GetCountByCustomerIdAsync(Guid customerId, string? status = null, CancellationToken ct = default)
    {
        var query = _db.Errands.Where(e => e.CustomerId == customerId);
        query = ApplyStatusFilter(query, status);
        return await query.CountAsync(ct);
    }

    private static IQueryable<Errand> ApplyStatusFilter(IQueryable<Errand> query, string? status)
    {
        return status?.ToLowerInvariant() switch
        {
            "active" => query.Where(e => e.Status != Domain.Enums.ErrandStatus.Delivered
                                       && e.Status != Domain.Enums.ErrandStatus.Cancelled
                                       && e.Status != Domain.Enums.ErrandStatus.Failed),
            "completed" => query.Where(e => e.Status == Domain.Enums.ErrandStatus.Delivered),
            "cancelled" => query.Where(e => e.Status == Domain.Enums.ErrandStatus.Cancelled
                                          || e.Status == Domain.Enums.ErrandStatus.Failed),
            "history" => query.Where(e => e.Status == Domain.Enums.ErrandStatus.Delivered
                                         || e.Status == Domain.Enums.ErrandStatus.Cancelled
                                         || e.Status == Domain.Enums.ErrandStatus.Failed),
            _ => query
        };
    }

    public async Task<int> GetCountByVendorIdAsync(Guid vendorId, string? status = null, CancellationToken ct = default)
    {
        var query = _db.Errands.Where(e => e.VendorId == vendorId);
        query = ApplyVendorOrderStatusFilter(query, status);
        return await query.CountAsync(ct);
    }

    private static IQueryable<Errand> ApplyVendorOrderStatusFilter(IQueryable<Errand> query, string? status)
    {
        return status?.ToLowerInvariant() switch
        {
            "open" => query.Where(e => e.VendorOrderStatus == Domain.Enums.VendorOrderStatus.Received
                                     || e.VendorOrderStatus == Domain.Enums.VendorOrderStatus.Confirmed
                                     || e.VendorOrderStatus == Domain.Enums.VendorOrderStatus.Preparing),
            "ready" => query.Where(e => e.VendorOrderStatus == Domain.Enums.VendorOrderStatus.ReadyForPickup),
            "cancelled" => query.Where(e => e.VendorOrderStatus == Domain.Enums.VendorOrderStatus.Cancelled),
            var numeric when int.TryParse(numeric, out var parsed) => query.Where(e => (int?)e.VendorOrderStatus == parsed),
            _ => query
        };
    }

    public async Task AddAsync(Errand errand, CancellationToken ct = default)
        => await _db.Errands.AddAsync(errand, ct);

    public Task UpdateAsync(Errand errand, CancellationToken ct = default)
    {
        var entry = _db.Entry(errand);

        if (entry.State == EntityState.Detached)
        {
            _db.Errands.Attach(errand);
            entry = _db.Entry(errand);
            entry.State = EntityState.Modified;
        }

        return Task.CompletedTask;
    }
}
