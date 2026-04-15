using RunAm.Domain.Entities;

namespace RunAm.Domain.Interfaces;

public interface IErrandRepository
{
    Task<Errand?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<Errand?> GetByIdWithDetailsAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<Errand>> GetByCustomerIdAsync(Guid customerId, int page, int pageSize, string? status = null, CancellationToken ct = default);
    Task<IReadOnlyList<Errand>> GetByRiderIdAsync(Guid riderId, int page, int pageSize, string? status = null, CancellationToken ct = default);
    Task<IReadOnlyList<Errand>> GetByVendorIdAsync(Guid vendorId, int page, int pageSize, string? status = null, CancellationToken ct = default);
    Task<IReadOnlyList<Errand>> GetPendingErrandsAsync(CancellationToken ct = default);
    Task<(IReadOnlyList<Errand> Items, int TotalCount)> GetAllAsync(int page, int pageSize, string? search = null, int? status = null, CancellationToken ct = default);
    Task<int> GetCountByCustomerIdAsync(Guid customerId, string? status = null, CancellationToken ct = default);
    Task<int> GetCountByVendorIdAsync(Guid vendorId, string? status = null, CancellationToken ct = default);
    Task AddAsync(Errand errand, CancellationToken ct = default);
    Task UpdateAsync(Errand errand, CancellationToken ct = default);
}
