using MediatR;
using RunAm.Domain.Interfaces;
using RunAm.Shared.DTOs.Vendors;

namespace RunAm.Application.Products.Queries;

// ─── Get Products by Vendor (Public) ────────────────────────

public record GetVendorProductsQuery(Guid VendorId) : IRequest<IReadOnlyList<ProductCategoryWithProductsDto>>;

public class GetVendorProductsQueryHandler : IRequestHandler<GetVendorProductsQuery, IReadOnlyList<ProductCategoryWithProductsDto>>
{
    private readonly IProductCategoryRepository _catRepo;

    public GetVendorProductsQueryHandler(IProductCategoryRepository catRepo) => _catRepo = catRepo;

    public async Task<IReadOnlyList<ProductCategoryWithProductsDto>> Handle(GetVendorProductsQuery query, CancellationToken ct)
    {
        var categories = await _catRepo.GetByVendorIdAsync(query.VendorId, ct);

        return categories.Select(pc => new ProductCategoryWithProductsDto(
            pc.Id, pc.Name, pc.Description, pc.ImageUrl, pc.SortOrder,
            pc.Products.Select(p => new ProductDto(
                p.Id, p.VendorId, p.ProductCategoryId, pc.Name,
                p.Name, p.Description, p.Price, p.CompareAtPrice,
                p.ImageUrl, p.IsAvailable, p.IsActive, p.SortOrder,
                p.VariantsJson, p.ExtrasJson
            )).ToList()
        )).ToList();
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
