namespace RunAm.Domain.Entities;

/// <summary>
/// Many-to-many join entity: Vendor ↔ ServiceCategory
/// </summary>
public class VendorServiceCategory
{
    public Guid VendorId { get; set; }
    public Vendor Vendor { get; set; } = null!;

    public Guid ServiceCategoryId { get; set; }
    public ServiceCategory ServiceCategory { get; set; } = null!;
}
