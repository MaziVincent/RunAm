using Microsoft.EntityFrameworkCore;
using RunAm.Domain.Entities;
using RunAm.Domain.Interfaces;

namespace RunAm.Infrastructure.Persistence.Repositories;

public class ServiceCategoryRepository : IServiceCategoryRepository
{
    private readonly AppDbContext _db;

    public ServiceCategoryRepository(AppDbContext db) => _db = db;

    public async Task<ServiceCategory?> GetByIdAsync(Guid id, CancellationToken ct = default)
        => await _db.ServiceCategories.FindAsync(new object[] { id }, ct);

    public async Task<ServiceCategory?> GetBySlugAsync(string slug, CancellationToken ct = default)
        => await _db.ServiceCategories.FirstOrDefaultAsync(c => c.Slug == slug, ct);

    public async Task<IReadOnlyList<ServiceCategory>> GetAllActiveAsync(CancellationToken ct = default)
        => await _db.ServiceCategories
            .Where(c => c.IsActive)
            .OrderBy(c => c.SortOrder)
            .ToListAsync(ct);

    public async Task<IReadOnlyList<ServiceCategory>> GetAllAsync(int page, int pageSize, CancellationToken ct = default)
        => await _db.ServiceCategories
            .OrderBy(c => c.SortOrder)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

    public async Task AddAsync(ServiceCategory category, CancellationToken ct = default)
        => await _db.ServiceCategories.AddAsync(category, ct);

    public Task UpdateAsync(ServiceCategory category, CancellationToken ct = default)
    {
        _db.ServiceCategories.Update(category);
        return Task.CompletedTask;
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var entity = await _db.ServiceCategories.FindAsync(new object[] { id }, ct);
        if (entity is not null)
            _db.ServiceCategories.Remove(entity);
    }
}
