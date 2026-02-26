namespace RunAm.Domain.Entities;

public class ProductCategory : BaseEntity
{
    public Guid VendorId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? ImageUrl { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;

    // Navigation
    public Vendor Vendor { get; set; } = null!;
    public ICollection<Product> Products { get; set; } = new List<Product>();
}
