using RunAm.Domain.Enums;

namespace RunAm.Domain.Entities;

public class Errand : BaseEntity
{
    public Guid CustomerId { get; set; }
    public Guid? RiderId { get; set; }
    public ErrandCategory Category { get; set; }
    public ErrandStatus Status { get; set; } = ErrandStatus.Pending;
    public string? Description { get; set; }
    public string? SpecialInstructions { get; set; }
    public ErrandPriority Priority { get; set; } = ErrandPriority.Standard;
    public DateTime? ScheduledAt { get; set; }

    // Pickup
    public string PickupAddress { get; set; } = string.Empty;
    public double PickupLatitude { get; set; }
    public double PickupLongitude { get; set; }

    // Dropoff
    public string DropoffAddress { get; set; } = string.Empty;
    public double DropoffLatitude { get; set; }
    public double DropoffLongitude { get; set; }

    // Package details
    public double? EstimatedDistance { get; set; } // meters
    public int? EstimatedDuration { get; set; } // seconds
    public PackageSize? PackageSize { get; set; }
    public decimal? PackageWeight { get; set; }
    public bool IsFragile { get; set; }
    public bool RequiresPhotoProof { get; set; }

    // Recipient
    public string? RecipientName { get; set; }
    public string? RecipientPhone { get; set; }

    // Pricing
    public string? PricingBreakdown { get; set; } // JSON
    public decimal TotalAmount { get; set; }
    public decimal CommissionAmount { get; set; }

    // Marketplace (null for logistics-only errands)
    public Guid? VendorId { get; set; }
    public Guid? ServiceCategoryId { get; set; }
    public VendorOrderStatus? VendorOrderStatus { get; set; }

    // Timestamps
    public DateTime? AcceptedAt { get; set; }
    public DateTime? PickedUpAt { get; set; }
    public DateTime? DeliveredAt { get; set; }
    public DateTime? CancelledAt { get; set; }
    public string? CancellationReason { get; set; }

    // Navigation
    public ApplicationUser Customer { get; set; } = null!;
    public ApplicationUser? Rider { get; set; }
    public Vendor? Vendor { get; set; }
    public ServiceCategory? ServiceCategory { get; set; }
    public ICollection<ErrandStatusHistory> StatusHistory { get; set; } = new List<ErrandStatusHistory>();
    public ICollection<ErrandStop> Stops { get; set; } = new List<ErrandStop>();
    public ICollection<Review> Reviews { get; set; } = new List<Review>();
    public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();

    /// <summary>
    /// Validates whether a status transition is allowed.
    /// </summary>
    public bool CanTransitionTo(ErrandStatus newStatus)
    {
        return (Status, newStatus) switch
        {
            (ErrandStatus.Pending, ErrandStatus.Accepted) => true,
            (ErrandStatus.Pending, ErrandStatus.Cancelled) => true,
            (ErrandStatus.Accepted, ErrandStatus.EnRouteToPickup) => true,
            (ErrandStatus.Accepted, ErrandStatus.Cancelled) => true,
            (ErrandStatus.EnRouteToPickup, ErrandStatus.ArrivedAtPickup) => true,
            (ErrandStatus.EnRouteToPickup, ErrandStatus.Cancelled) => true,
            (ErrandStatus.ArrivedAtPickup, ErrandStatus.PackageCollected) => true,
            (ErrandStatus.ArrivedAtPickup, ErrandStatus.Failed) => true,
            (ErrandStatus.PackageCollected, ErrandStatus.EnRouteToDropoff) => true,
            (ErrandStatus.EnRouteToDropoff, ErrandStatus.ArrivedAtDropoff) => true,
            (ErrandStatus.ArrivedAtDropoff, ErrandStatus.Delivered) => true,
            (ErrandStatus.ArrivedAtDropoff, ErrandStatus.Failed) => true,
            _ => false
        };
    }

    public void TransitionTo(ErrandStatus newStatus, double? latitude = null, double? longitude = null, string? notes = null, string? imageUrl = null)
    {
        if (!CanTransitionTo(newStatus))
            throw new InvalidOperationException($"Cannot transition from {Status} to {newStatus}");

        Status = newStatus;
        UpdatedAt = DateTime.UtcNow;

        // Set relevant timestamps
        switch (newStatus)
        {
            case ErrandStatus.Accepted:
                AcceptedAt = DateTime.UtcNow;
                break;
            case ErrandStatus.PackageCollected:
                PickedUpAt = DateTime.UtcNow;
                break;
            case ErrandStatus.Delivered:
                DeliveredAt = DateTime.UtcNow;
                break;
            case ErrandStatus.Cancelled:
                CancelledAt = DateTime.UtcNow;
                CancellationReason = notes;
                break;
        }

        StatusHistory.Add(new ErrandStatusHistory
        {
            ErrandId = Id,
            Status = newStatus,
            Latitude = latitude,
            Longitude = longitude,
            Notes = notes,
            ImageUrl = imageUrl
        });
    }
}
