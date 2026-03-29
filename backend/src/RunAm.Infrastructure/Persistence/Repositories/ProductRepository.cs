using Microsoft.EntityFrameworkCore;
using RunAm.Domain.Entities;
using RunAm.Domain.Interfaces;

namespace RunAm.Infrastructure.Persistence.Repositories;

public class ProductRepository : IProductRepository
{
    private readonly AppDbContext _db;

    public ProductRepository(AppDbContext db) => _db = db;

    public async Task<Product?> GetByIdAsync(Guid id, CancellationToken ct = default)
        => await _db.Products
            .Include(p => p.ProductCategory)
            .FirstOrDefaultAsync(p => p.Id == id, ct);

    public async Task<IReadOnlyList<Product>> GetByVendorIdAsync(Guid vendorId, CancellationToken ct = default)
        => await _db.Products
            .Where(p => p.VendorId == vendorId)
            .OrderBy(p => p.ProductCategory.SortOrder)
            .ThenBy(p => p.SortOrder)
            .Include(p => p.ProductCategory)
            .ToListAsync(ct);

    public async Task<IReadOnlyList<Product>> GetByCategoryIdAsync(Guid productCategoryId, CancellationToken ct = default)
        => await _db.Products
            .Where(p => p.ProductCategoryId == productCategoryId && p.IsActive)
            .OrderBy(p => p.SortOrder)
            .ToListAsync(ct);

    public async Task<IReadOnlyList<Product>> GetAvailableByVendorIdAsync(Guid vendorId, CancellationToken ct = default)
        => await _db.Products
            .Where(p => p.VendorId == vendorId && p.IsActive && p.IsAvailable)
            .OrderBy(p => p.ProductCategory.SortOrder)
            .ThenBy(p => p.SortOrder)
            .Include(p => p.ProductCategory)
            .ToListAsync(ct);

    public async Task AddAsync(Product product, CancellationToken ct = default)
        => await _db.Products.AddAsync(product, ct);

    public Task UpdateAsync(Product product, CancellationToken ct = default)
    {
        _db.Products.Update(product);
        return Task.CompletedTask;
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var entity = await _db.Products.FindAsync(new object[] { id }, ct);
        if (entity is not null)
            _db.Products.Remove(entity);
    }
}

public class ProductCategoryRepository : IProductCategoryRepository
{
    private readonly AppDbContext _db;

    public ProductCategoryRepository(AppDbContext db) => _db = db;

    public async Task<ProductCategory?> GetByIdAsync(Guid id, CancellationToken ct = default)
        => await _db.ProductCategories.FindAsync(new object[] { id }, ct);

    public async Task<IReadOnlyList<ProductCategory>> GetByVendorIdAsync(Guid vendorId, CancellationToken ct = default)
        => await _db.ProductCategories
            .Where(pc => pc.VendorId == vendorId && pc.IsActive)
            .OrderBy(pc => pc.SortOrder)
            .Include(pc => pc.Products.Where(p => p.IsActive).OrderBy(p => p.SortOrder))
            .ToListAsync(ct);

    public async Task AddAsync(ProductCategory category, CancellationToken ct = default)
        => await _db.ProductCategories.AddAsync(category, ct);

    public Task UpdateAsync(ProductCategory category, CancellationToken ct = default)
    {
        _db.ProductCategories.Update(category);
        return Task.CompletedTask;
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var entity = await _db.ProductCategories.FindAsync(new object[] { id }, ct);
        if (entity is not null)
            _db.ProductCategories.Remove(entity);
    }
}

public class OrderItemRepository : IOrderItemRepository
{
    private readonly AppDbContext _db;

    public OrderItemRepository(AppDbContext db) => _db = db;

    public async Task<IReadOnlyList<OrderItem>> GetByErrandIdAsync(Guid errandId, CancellationToken ct = default)
        => await _db.OrderItems
            .Where(oi => oi.ErrandId == errandId)
            .Include(oi => oi.Product)
            .ToListAsync(ct);

    public async Task AddRangeAsync(IEnumerable<OrderItem> items, CancellationToken ct = default)
        => await _db.OrderItems.AddRangeAsync(items, ct);

    public Task UpdateAsync(OrderItem item, CancellationToken ct = default)
    {
        _db.OrderItems.Update(item);
        return Task.CompletedTask;
    }
}
