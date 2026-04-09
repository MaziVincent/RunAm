using RunAm.Domain.Entities;
using RunAm.Shared.DTOs.Vendors;

namespace RunAm.Application.Products;

internal static class ProductCatalogMapping
{
    public static List<ProductCategoryWithProductsDto> MapCategories(IEnumerable<ProductCategory> categories)
        => categories.Select(MapCategory).ToList();

    private static ProductCategoryWithProductsDto MapCategory(ProductCategory category)
        => new(
            category.Id,
            category.Name,
            category.Description,
            category.ImageUrl,
            category.SortOrder,
            category.Products.Select(product => new ProductDto(
                product.Id,
                product.VendorId,
                product.ProductCategoryId,
                category.Name,
                product.Name,
                product.Description,
                product.Price,
                product.CompareAtPrice,
                product.ImageUrl,
                product.IsAvailable,
                product.IsActive,
                product.SortOrder,
                product.VariantsJson,
                product.ExtrasJson
            )).ToList()
        );
}