namespace RunAm.Domain.Entities;

public class Product : BaseEntity
{
    public Guid VendorId { get; set; }
    public Guid ProductCategoryId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal Price { get; set; }
    public decimal? CompareAtPrice { get; set; }
    public string? ImageUrl { get; set; }
    public bool IsAvailable { get; set; } = true;
    public bool IsActive { get; set; } = true;
    public int SortOrder { get; set; }

    // Variants & extras stored as JSON for MVP
    public string? VariantsJson { get; set; }  // e.g., [{"name":"Size","options":[{"label":"Small","priceAdj":0},{"label":"Large","priceAdj":500}]}]
    public string? ExtrasJson { get; set; }    // e.g., [{"name":"Extra Meat","price":300},{"name":"Extra Cheese","price":200}]

    // Navigation
    public Vendor Vendor { get; set; } = null!;
    public ProductCategory ProductCategory { get; set; } = null!;
}
