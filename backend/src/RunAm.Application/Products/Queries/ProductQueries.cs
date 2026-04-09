using MediatR;
using RunAm.Application.Common.Interfaces;
using RunAm.Application.Vendors;
using RunAm.Domain.Interfaces;
using RunAm.Shared.DTOs.Vendors;

namespace RunAm.Application.Products.Queries;

// ─── Get Products by Vendor (Public) ────────────────────────

public record GetVendorProductsQuery(Guid VendorId) : IRequest<IReadOnlyList<ProductCategoryWithProductsDto>>;

public class GetVendorProductsQueryHandler : IRequestHandler<GetVendorProductsQuery, IReadOnlyList<ProductCategoryWithProductsDto>>
{
    private static readonly TimeSpan ProductCatalogCacheDuration = TimeSpan.FromMinutes(10);

    private readonly IAppCache _cache;
    private readonly IProductCategoryRepository _catRepo;

    public GetVendorProductsQueryHandler(IProductCategoryRepository catRepo, IAppCache cache)
    {
        _catRepo = catRepo;
        _cache = cache;
    }

    public async Task<IReadOnlyList<ProductCategoryWithProductsDto>> Handle(GetVendorProductsQuery query, CancellationToken ct)
    {
        var version = await VendorCache.GetCatalogVersionAsync(_cache, ct);
        var cacheKey = VendorCache.ProductCatalogKey(query.VendorId, version);
        var cached = await _cache.GetAsync<List<ProductCategoryWithProductsDto>>(cacheKey, ct);
        if (cached is not null)
            return cached;

        var categories = await _catRepo.GetByVendorIdAsync(query.VendorId, ct);
        var catalog = ProductCatalogMapping.MapCategories(categories);

        await _cache.SetAsync(cacheKey, catalog, ProductCatalogCacheDuration, ct);
        return catalog;
    }
}

// ─── Get My Products (Merchant — all, including inactive) ───

public record GetMyProductsQuery(Guid UserId) : IRequest<IReadOnlyList<ProductDto>>;

public class GetMyProductsQueryHandler : IRequestHandler<GetMyProductsQuery, IReadOnlyList<ProductDto>>
{
    private readonly IVendorRepository _vendorRepo;
    private readonly IProductRepository _productRepo;

    public GetMyProductsQueryHandler(IVendorRepository vendorRepo, IProductRepository productRepo)
    {
        _vendorRepo = vendorRepo;
        _productRepo = productRepo;
    }

    public async Task<IReadOnlyList<ProductDto>> Handle(GetMyProductsQuery query, CancellationToken ct)
    {
        var vendor = await _vendorRepo.GetByUserIdAsync(query.UserId, ct)
            ?? throw new KeyNotFoundException("Vendor profile not found.");

        var products = await _productRepo.GetByVendorIdAsync(vendor.Id, ct);

        return products.Select(p => new ProductDto(
            p.Id, p.VendorId, p.ProductCategoryId, p.ProductCategory.Name,
            p.Name, p.Description, p.Price, p.CompareAtPrice,
            p.ImageUrl, p.IsAvailable, p.IsActive, p.SortOrder,
            p.VariantsJson, p.ExtrasJson
        )).ToList();
    }
}

// ─── Get My Product Categories (Merchant) ───────────────────

public record GetMyProductCategoriesQuery(Guid UserId) : IRequest<IReadOnlyList<ProductCategoryDto>>;

public class GetMyProductCategoriesQueryHandler : IRequestHandler<GetMyProductCategoriesQuery, IReadOnlyList<ProductCategoryDto>>
{
    private readonly IVendorRepository _vendorRepo;
    private readonly IProductCategoryRepository _catRepo;

    public GetMyProductCategoriesQueryHandler(IVendorRepository vendorRepo, IProductCategoryRepository catRepo)
    {
        _vendorRepo = vendorRepo;
        _catRepo = catRepo;
    }

    public async Task<IReadOnlyList<ProductCategoryDto>> Handle(GetMyProductCategoriesQuery query, CancellationToken ct)
    {
        var vendor = await _vendorRepo.GetByUserIdAsync(query.UserId, ct)
            ?? throw new KeyNotFoundException("Vendor profile not found.");

        var categories = await _catRepo.GetByVendorIdAsync(vendor.Id, ct);

        return categories.Select(c => new ProductCategoryDto(
            c.Id, c.VendorId, c.Name, c.Description, c.ImageUrl, c.SortOrder, c.IsActive
        )).ToList();
    }
}
