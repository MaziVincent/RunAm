using MediatR;
using RunAm.Application.Common.Interfaces;
using RunAm.Application.Products;
using RunAm.Domain.Interfaces;
using RunAm.Shared.DTOs.Vendors;

namespace RunAm.Application.Vendors.Queries;

// ─── Get Vendors (Public - browse/search) ───────────────────

public record GetVendorsQuery(
    string? Search,
    Guid? CategoryId,
    double? Latitude,
    double? Longitude,
    double? RadiusKm,
    int? Status = null,
    int Page = 1,
    int PageSize = 20
) : IRequest<(IReadOnlyList<VendorDto> Vendors, int TotalCount)>;

public class GetVendorsQueryHandler : IRequestHandler<GetVendorsQuery, (IReadOnlyList<VendorDto> Vendors, int TotalCount)>
{
    private static readonly TimeSpan SearchCacheDuration = TimeSpan.FromMinutes(5);

    private readonly IAppCache _cache;
    private readonly IVendorRepository _repo;

    public GetVendorsQueryHandler(IVendorRepository repo, IAppCache cache)
    {
        _repo = repo;
        _cache = cache;
    }

    public async Task<(IReadOnlyList<VendorDto> Vendors, int TotalCount)> Handle(GetVendorsQuery query, CancellationToken ct)
    {
        var version = await VendorCache.GetCatalogVersionAsync(_cache, ct);
        var cacheKey = VendorCache.SearchKey(query, version);
        var cached = await _cache.GetAsync<CachedVendorSearchResult>(cacheKey, ct);
        if (cached is not null)
            return (cached.Vendors, cached.TotalCount);

        var vendors = query.Latitude.HasValue && query.Longitude.HasValue && query.RadiusKm.HasValue
            ? await _repo.GetNearbyAsync(query.Latitude.Value, query.Longitude.Value, query.RadiusKm.Value, query.Page, query.PageSize, ct)
            : await _repo.SearchAsync(query.Search, query.CategoryId, query.Status, query.Page, query.PageSize, ct);

        var totalCount = await _repo.GetCountAsync(query.CategoryId, query.Status, ct);

        var dtos = vendors.Select(MapToDto).ToList();
        await _cache.SetAsync(cacheKey, new CachedVendorSearchResult(dtos, totalCount), SearchCacheDuration, ct);
        return (dtos, totalCount);
    }

    internal static VendorDto MapToDto(Domain.Entities.Vendor v) => new(
        v.Id, v.UserId, v.BusinessName, v.BusinessDescription,
        v.LogoUrl, v.BannerUrl, v.User?.PhoneNumber, v.Address, v.Latitude, v.Longitude,
        v.OperatingHours, v.IsOpen, v.IsActive,
        v.MinimumOrderAmount, v.DeliveryFee, v.EstimatedPrepTimeMinutes,
        v.Rating, v.TotalReviews, v.TotalOrders,
        v.Status.ToString(),
        v.VendorServiceCategories.Select(vsc => new ServiceCategorySlimDto(
            vsc.ServiceCategoryId, vsc.ServiceCategory.Name, vsc.ServiceCategory.Slug
        )).ToList(),
        v.CreatedAt
    );
}

// ─── Get Vendor by ID (Public) ──────────────────────────────

public record GetVendorByIdQuery(Guid Id) : IRequest<VendorDetailDto?>;

public class GetVendorByIdQueryHandler : IRequestHandler<GetVendorByIdQuery, VendorDetailDto?>
{
    private static readonly TimeSpan DetailCacheDuration = TimeSpan.FromMinutes(10);
    private static readonly TimeSpan ProductCatalogCacheDuration = TimeSpan.FromMinutes(10);

    private readonly IAppCache _cache;
    private readonly IVendorRepository _repo;

    public GetVendorByIdQueryHandler(IVendorRepository repo, IAppCache cache)
    {
        _repo = repo;
        _cache = cache;
    }

    public async Task<VendorDetailDto?> Handle(GetVendorByIdQuery query, CancellationToken ct)
    {
        var version = await VendorCache.GetCatalogVersionAsync(_cache, ct);
        var cacheKey = VendorCache.DetailKey(query.Id, version);
        var cached = await _cache.GetAsync<VendorDetailDto>(cacheKey, ct);
        if (cached is not null)
            return cached;

        var v = await _repo.GetByIdWithDetailsAsync(query.Id, ct);
        if (v is null) return null;

        var productCatalogCacheKey = VendorCache.ProductCatalogKey(query.Id, version);
        var productCategories = await _cache.GetAsync<List<ProductCategoryWithProductsDto>>(productCatalogCacheKey, ct);
        if (productCategories is null)
        {
            productCategories = ProductCatalogMapping.MapCategories(v.ProductCategories);
            await _cache.SetAsync(productCatalogCacheKey, productCategories, ProductCatalogCacheDuration, ct);
        }

        var dto = new VendorDetailDto(
            v.Id, v.UserId, v.BusinessName, v.BusinessDescription,
            v.LogoUrl, v.BannerUrl, v.User?.PhoneNumber, v.Address, v.Latitude, v.Longitude,
            v.OperatingHours, v.IsOpen, v.IsActive,
            v.MinimumOrderAmount, v.DeliveryFee, v.EstimatedPrepTimeMinutes,
            v.Rating, v.TotalReviews, v.TotalOrders,
            v.Status.ToString(),
            v.VendorServiceCategories.Select(vsc => new ServiceCategorySlimDto(
                vsc.ServiceCategoryId, vsc.ServiceCategory.Name, vsc.ServiceCategory.Slug
            )).ToList(),
            productCategories,
            v.CreatedAt
        );

        await _cache.SetAsync(cacheKey, dto, DetailCacheDuration, ct);
        return dto;
    }
}

// ─── Get Vendor by ID (Admin — all products) ────────────────

public record GetVendorByIdAdminQuery(Guid Id) : IRequest<VendorDetailDto?>;

public class GetVendorByIdAdminQueryHandler : IRequestHandler<GetVendorByIdAdminQuery, VendorDetailDto?>
{
    private readonly IVendorRepository _repo;

    public GetVendorByIdAdminQueryHandler(IVendorRepository repo) => _repo = repo;

    public async Task<VendorDetailDto?> Handle(GetVendorByIdAdminQuery query, CancellationToken ct)
    {
        var v = await _repo.GetByIdWithAllDetailsAsync(query.Id, ct);
        if (v is null) return null;

        return new VendorDetailDto(
            v.Id, v.UserId, v.BusinessName, v.BusinessDescription,
            v.LogoUrl, v.BannerUrl, v.User?.PhoneNumber, v.Address, v.Latitude, v.Longitude,
            v.OperatingHours, v.IsOpen, v.IsActive,
            v.MinimumOrderAmount, v.DeliveryFee, v.EstimatedPrepTimeMinutes,
            v.Rating, v.TotalReviews, v.TotalOrders,
            v.Status.ToString(),
            v.VendorServiceCategories.Select(vsc => new ServiceCategorySlimDto(
                vsc.ServiceCategoryId, vsc.ServiceCategory.Name, vsc.ServiceCategory.Slug
            )).ToList(),
            v.ProductCategories.Select(pc => new ProductCategoryWithProductsDto(
                pc.Id, pc.Name, pc.Description, pc.ImageUrl, pc.SortOrder,
                pc.Products.Select(p => new ProductDto(
                    p.Id, p.VendorId, p.ProductCategoryId, pc.Name,
                    p.Name, p.Description, p.Price, p.CompareAtPrice,
                    p.ImageUrl, p.IsAvailable, p.IsActive, p.SortOrder,
                    p.VariantsJson, p.ExtrasJson
                )).ToList()
            )).ToList(),
            v.CreatedAt
        );
    }
}

// ─── Get My Vendor Profile (Merchant) ───────────────────────

public record GetMyVendorQuery(Guid UserId) : IRequest<VendorDto?>;

public class GetMyVendorQueryHandler : IRequestHandler<GetMyVendorQuery, VendorDto?>
{
    private static readonly TimeSpan MyVendorCacheDuration = TimeSpan.FromMinutes(5);

    private readonly IAppCache _cache;
    private readonly IVendorRepository _repo;

    public GetMyVendorQueryHandler(IVendorRepository repo, IAppCache cache)
    {
        _repo = repo;
        _cache = cache;
    }

    public async Task<VendorDto?> Handle(GetMyVendorQuery query, CancellationToken ct)
    {
        var version = await VendorCache.GetCatalogVersionAsync(_cache, ct);
        var cacheKey = VendorCache.MyVendorKey(query.UserId, version);
        var cached = await _cache.GetAsync<VendorDto>(cacheKey, ct);
        if (cached is not null)
            return cached;

        var v = await _repo.GetByUserIdAsync(query.UserId, ct);
        if (v is null) return null;

        var dto = GetVendorsQueryHandler.MapToDto(v);
        await _cache.SetAsync(cacheKey, dto, MyVendorCacheDuration, ct);
        return dto;
    }
}

internal sealed record CachedVendorSearchResult(IReadOnlyList<VendorDto> Vendors, int TotalCount);
