using RunAm.Domain.Entities;

namespace RunAm.Domain.Interfaces;

public interface IServiceCategoryRepository
{
    Task<ServiceCategory?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<ServiceCategory?> GetBySlugAsync(string slug, CancellationToken ct = default);
    Task<IReadOnlyList<ServiceCategory>> GetAllActiveAsync(CancellationToken ct = default);
    Task<IReadOnlyList<ServiceCategory>> GetAllAsync(int page, int pageSize, CancellationToken ct = default);
    Task AddAsync(ServiceCategory category, CancellationToken ct = default);
    Task UpdateAsync(ServiceCategory category, CancellationToken ct = default);
    Task DeleteAsync(Guid id, CancellationToken ct = default);
}
