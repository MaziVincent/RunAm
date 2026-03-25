using MediatR;
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
    private readonly IVendorRepository _repo;

    public GetVendorsQueryHandler(IVendorRepository repo) => _repo = repo;

    public async Task<(IReadOnlyList<VendorDto> Vendors, int TotalCount)> Handle(GetVendorsQuery query, CancellationToken ct)
    {
        var vendors = query.Latitude.HasValue && query.Longitude.HasValue && query.RadiusKm.HasValue
            ? await _repo.GetNearbyAsync(query.Latitude.Value, query.Longitude.Value, query.RadiusKm.Value, query.Page, query.PageSize, ct)
            : await _repo.SearchAsync(query.Search, query.CategoryId, query.Status, query.Page, query.PageSize, ct);

        var totalCount = await _repo.GetCountAsync(query.CategoryId, query.Status, ct);

        var dtos = vendors.Select(MapToDto).ToList();
        return (dtos, totalCount);
    }

    internal static VendorDto MapToDto(Domain.Entities.Vendor v) => new(
        v.Id, v.UserId, v.BusinessName, v.BusinessDescription,
        v.LogoUrl, v.BannerUrl, v.Address, v.Latitude, v.Longitude,
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
    private readonly IVendorRepository _repo;

    public GetVendorByIdQueryHandler(IVendorRepository repo) => _repo = repo;

    public async Task<VendorDetailDto?> Handle(GetVendorByIdQuery query, CancellationToken ct)
    {
        var v = await _repo.GetByIdWithDetailsAsync(query.Id, ct);
        if (v is null) return null;

        return new VendorDetailDto(
            v.Id, v.UserId, v.BusinessName, v.BusinessDescription,
            v.LogoUrl, v.BannerUrl, v.Address, v.Latitude, v.Longitude,
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
    private readonly IVendorRepository _repo;

    public GetMyVendorQueryHandler(IVendorRepository repo) => _repo = repo;

    public async Task<VendorDto?> Handle(GetMyVendorQuery query, CancellationToken ct)
    {
        var v = await _repo.GetByUserIdAsync(query.UserId, ct);
        if (v is null) return null;
        return GetVendorsQueryHandler.MapToDto(v);
    }
}
