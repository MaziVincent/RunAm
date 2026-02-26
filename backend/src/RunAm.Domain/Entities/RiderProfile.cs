using RunAm.Domain.Enums;

namespace RunAm.Domain.Entities;

public class RiderProfile : BaseEntity
{
    public Guid UserId { get; set; }
    public VehicleType VehicleType { get; set; } = VehicleType.OnFoot;
    public string? LicensePlate { get; set; }
    public string? IdDocumentUrl { get; set; }
    public string? SelfieUrl { get; set; }
    public string? BackgroundCheckStatus { get; set; }
    public ApprovalStatus ApprovalStatus { get; set; } = ApprovalStatus.Pending;
    public decimal Rating { get; set; }
    public int TotalCompletedTasks { get; set; }
    public bool IsOnline { get; set; }
    public double? CurrentLatitude { get; set; }
    public double? CurrentLongitude { get; set; }
    public DateTime? LastLocationUpdate { get; set; }

    // Navigation
    public ApplicationUser User { get; set; } = null!;
}
