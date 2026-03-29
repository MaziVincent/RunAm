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
            .Include(e => e.Customer)
            .Include(e => e.Rider)
            .Include(e => e.StatusHistory.OrderBy(s => s.CreatedAt))
            .Include(e => e.Stops.OrderBy(s => s.StopOrder))
            .FirstOrDefaultAsync(e => e.Id == id, ct);

    public async Task<IReadOnlyList<Errand>> GetByCustomerIdAsync(Guid customerId, int page, int pageSize, CancellationToken ct = default)
        => await _db.Errands
            .Where(e => e.CustomerId == customerId)
            .OrderByDescending(e => e.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Include(e => e.Rider)
            .ToListAsync(ct);

    public async Task<IReadOnlyList<Errand>> GetByRiderIdAsync(Guid riderId, int page, int pageSize, CancellationToken ct = default)
        => await _db.Errands
            .Where(e => e.RiderId == riderId)
            .OrderByDescending(e => e.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Include(e => e.Customer)
            .ToListAsync(ct);

    public async Task<IReadOnlyList<Errand>> GetByVendorIdAsync(Guid vendorId, int page, int pageSize, CancellationToken ct = default)
        => await _db.Errands
            .Where(e => e.VendorId == vendorId)
            .OrderByDescending(e => e.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Include(e => e.Customer)
            .ToListAsync(ct);

    public async Task<IReadOnlyList<Errand>> GetPendingErrandsAsync(CancellationToken ct = default)
        => await _db.Errands
            .Where(e => e.Status == Domain.Enums.ErrandStatus.Pending)
            .OrderBy(e => e.CreatedAt)
            .Include(e => e.Customer)
            .ToListAsync(ct);

    public async Task<int> GetCountByCustomerIdAsync(Guid customerId, CancellationToken ct = default)
        => await _db.Errands.CountAsync(e => e.CustomerId == customerId, ct);

    public async Task<int> GetCountByVendorIdAsync(Guid vendorId, CancellationToken ct = default)
        => await _db.Errands.CountAsync(e => e.VendorId == vendorId, ct);

    public async Task AddAsync(Errand errand, CancellationToken ct = default)
        => await _db.Errands.AddAsync(errand, ct);

    public Task UpdateAsync(Errand errand, CancellationToken ct = default)
    {
        _db.Errands.Update(errand);
        return Task.CompletedTask;
    }
}
