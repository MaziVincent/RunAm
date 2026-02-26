using RunAm.Domain.Enums;

namespace RunAm.Domain.Entities;

public class Vendor : BaseEntity
{
    public Guid UserId { get; set; }
    public string BusinessName { get; set; } = string.Empty;
    public string? BusinessDescription { get; set; }
    public string? LogoUrl { get; set; }
    public string? BannerUrl { get; set; }

    // Location
    public string Address { get; set; } = string.Empty;
    public double Latitude { get; set; }
    public double Longitude { get; set; }

    // Operations
    public string? OperatingHours { get; set; } // JSON: {"mon":"09:00-21:00", ...}
    public bool IsOpen { get; set; }
    public bool IsActive { get; set; } = true;
    public decimal MinimumOrderAmount { get; set; }
    public decimal DeliveryFee { get; set; }
    public int EstimatedPrepTimeMinutes { get; set; }

    // Rating
    public double Rating { get; set; }
    public int TotalReviews { get; set; }
    public int TotalOrders { get; set; }

    // Status
    public VendorStatus Status { get; set; } = VendorStatus.Pending;

    // Navigation
    public ApplicationUser User { get; set; } = null!;
    public ICollection<VendorServiceCategory> VendorServiceCategories { get; set; } = new List<VendorServiceCategory>();
    public ICollection<Product> Products { get; set; } = new List<Product>();
    public ICollection<ProductCategory> ProductCategories { get; set; } = new List<ProductCategory>();
    public ICollection<Review> Reviews { get; set; } = new List<Review>();
}
