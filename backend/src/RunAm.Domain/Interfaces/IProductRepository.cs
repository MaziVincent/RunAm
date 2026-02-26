using RunAm.Domain.Entities;

namespace RunAm.Domain.Interfaces;

public interface IProductRepository
{
    Task<Product?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<Product>> GetByVendorIdAsync(Guid vendorId, CancellationToken ct = default);
    Task<IReadOnlyList<Product>> GetByCategoryIdAsync(Guid productCategoryId, CancellationToken ct = default);
    Task<IReadOnlyList<Product>> GetAvailableByVendorIdAsync(Guid vendorId, CancellationToken ct = default);
    Task AddAsync(Product product, CancellationToken ct = default);
    Task UpdateAsync(Product product, CancellationToken ct = default);
    Task DeleteAsync(Guid id, CancellationToken ct = default);
}

public interface IProductCategoryRepository
{
    Task<ProductCategory?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<ProductCategory>> GetByVendorIdAsync(Guid vendorId, CancellationToken ct = default);
    Task AddAsync(ProductCategory category, CancellationToken ct = default);
    Task UpdateAsync(ProductCategory category, CancellationToken ct = default);
    Task DeleteAsync(Guid id, CancellationToken ct = default);
}

public interface IOrderItemRepository
{
    Task<IReadOnlyList<OrderItem>> GetByErrandIdAsync(Guid errandId, CancellationToken ct = default);
    Task AddRangeAsync(IEnumerable<OrderItem> items, CancellationToken ct = default);
    Task UpdateAsync(OrderItem item, CancellationToken ct = default);
}
