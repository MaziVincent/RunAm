using MediatR;
using RunAm.Domain.Interfaces;
using RunAm.Shared.DTOs.Vendors;

namespace RunAm.Application.ServiceCategories.Queries;

// ─── Get All Active Service Categories (Public) ─────────────

public record GetServiceCategoriesQuery : IRequest<IReadOnlyList<ServiceCategoryDto>>;

public class GetServiceCategoriesQueryHandler : IRequestHandler<GetServiceCategoriesQuery, IReadOnlyList<ServiceCategoryDto>>
{
    private readonly IServiceCategoryRepository _repo;

    public GetServiceCategoriesQueryHandler(IServiceCategoryRepository repo) => _repo = repo;

    public async Task<IReadOnlyList<ServiceCategoryDto>> Handle(GetServiceCategoriesQuery query, CancellationToken ct)
    {
        var categories = await _repo.GetAllActiveAsync(ct);
        return categories.Select(c => new ServiceCategoryDto(
            c.Id, c.Name, c.Slug, c.Description, c.IconUrl,
            c.SortOrder, c.IsActive, c.RequiresVendor,
            c.VendorServiceCategories.Count
        )).ToList();
    }
}

// ─── Get Service Category By Slug (Public) ──────────────────

public record GetServiceCategoryBySlugQuery(string Slug) : IRequest<ServiceCategoryDto?>;

public class GetServiceCategoryBySlugQueryHandler : IRequestHandler<GetServiceCategoryBySlugQuery, ServiceCategoryDto?>
{
    private readonly IServiceCategoryRepository _repo;

    public GetServiceCategoryBySlugQueryHandler(IServiceCategoryRepository repo) => _repo = repo;

    public async Task<ServiceCategoryDto?> Handle(GetServiceCategoryBySlugQuery query, CancellationToken ct)
    {
        var c = await _repo.GetBySlugAsync(query.Slug, ct);
        if (c is null) return null;

        return new ServiceCategoryDto(
            c.Id, c.Name, c.Slug, c.Description, c.IconUrl,
            c.SortOrder, c.IsActive, c.RequiresVendor, 0
        );
    }
}
