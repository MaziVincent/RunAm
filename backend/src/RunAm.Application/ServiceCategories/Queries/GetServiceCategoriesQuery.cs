using MediatR;
using RunAm.Application.Common.Interfaces;
using RunAm.Domain.Interfaces;
using RunAm.Shared.DTOs.Vendors;

namespace RunAm.Application.ServiceCategories.Queries;

// ─── Get All Active Service Categories (Public) ─────────────

public record GetServiceCategoriesQuery : IRequest<IReadOnlyList<ServiceCategoryDto>>;

public class GetServiceCategoriesQueryHandler : IRequestHandler<GetServiceCategoriesQuery, IReadOnlyList<ServiceCategoryDto>>
{
    private static readonly TimeSpan CacheDuration = TimeSpan.FromMinutes(30);

    private readonly IAppCache _cache;
    private readonly IServiceCategoryRepository _repo;

    public GetServiceCategoriesQueryHandler(IServiceCategoryRepository repo, IAppCache cache)
    {
        _repo = repo;
        _cache = cache;
    }

    public async Task<IReadOnlyList<ServiceCategoryDto>> Handle(GetServiceCategoriesQuery query, CancellationToken ct)
    {
        var cached = await _cache.GetAsync<List<ServiceCategoryDto>>(ServiceCategoryCacheKeys.All, ct);
        if (cached is not null)
            return cached;

        var categories = await _repo.GetAllActiveAsync(ct);
        var dtos = categories.Select(c => new ServiceCategoryDto(
            c.Id, c.Name, c.Slug, c.Description, c.IconUrl,
            c.SortOrder, c.IsActive, c.RequiresVendor,
            c.VendorServiceCategories.Count
        )).ToList();

        await _cache.SetAsync(ServiceCategoryCacheKeys.All, dtos, CacheDuration, ct);

        return dtos;
    }
}

// ─── Get Service Category By Slug (Public) ──────────────────

public record GetServiceCategoryBySlugQuery(string Slug) : IRequest<ServiceCategoryDto?>;

public class GetServiceCategoryBySlugQueryHandler : IRequestHandler<GetServiceCategoryBySlugQuery, ServiceCategoryDto?>
{
    private static readonly TimeSpan CacheDuration = TimeSpan.FromMinutes(30);

    private readonly IAppCache _cache;
    private readonly IServiceCategoryRepository _repo;

    public GetServiceCategoryBySlugQueryHandler(IServiceCategoryRepository repo, IAppCache cache)
    {
        _repo = repo;
        _cache = cache;
    }

    public async Task<ServiceCategoryDto?> Handle(GetServiceCategoryBySlugQuery query, CancellationToken ct)
    {
        var cacheKey = ServiceCategoryCacheKeys.BySlug(query.Slug);
        var cached = await _cache.GetAsync<ServiceCategoryDto>(cacheKey, ct);
        if (cached is not null)
            return cached;

        var c = await _repo.GetBySlugAsync(query.Slug, ct);
        if (c is null) return null;

        var dto = new ServiceCategoryDto(
            c.Id, c.Name, c.Slug, c.Description, c.IconUrl,
            c.SortOrder, c.IsActive, c.RequiresVendor, 0
        );

        await _cache.SetAsync(cacheKey, dto, CacheDuration, ct);

        return dto;
    }
}
