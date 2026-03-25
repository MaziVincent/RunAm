using RunAm.Domain.Entities;

namespace RunAm.Domain.Interfaces;

public interface IVendorRepository
{
    Task<Vendor?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<Vendor?> GetByIdWithDetailsAsync(Guid id, CancellationToken ct = default);
    Task<Vendor?> GetByUserIdAsync(Guid userId, CancellationToken ct = default);
    Task<IReadOnlyList<Vendor>> GetByCategoryIdAsync(Guid categoryId, int page, int pageSize, CancellationToken ct = default);
    Task<IReadOnlyList<Vendor>> GetNearbyAsync(double latitude, double longitude, double radiusKm, int page, int pageSize, CancellationToken ct = default);
    Task<IReadOnlyList<Vendor>> SearchAsync(string? query, Guid? categoryId, int? status, int page, int pageSize, CancellationToken ct = default);
    Task<int> GetCountAsync(Guid? categoryId = null, int? status = null, CancellationToken ct = default);
    Task AddAsync(Vendor vendor, CancellationToken ct = default);
    Task UpdateAsync(Vendor vendor, CancellationToken ct = default);
}
