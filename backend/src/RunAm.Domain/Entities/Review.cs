namespace RunAm.Domain.Entities;

public class Review : BaseEntity
{
    public Guid ErrandId { get; set; }
    public Guid ReviewerId { get; set; }
    public Guid RevieweeId { get; set; }
    public Guid? VendorId { get; set; }
    public int Rating { get; set; } // 1-5
    public string? Comment { get; set; }
    public bool IsApproved { get; set; } = true;
    public bool IsFlagged { get; set; }
    public string? FlagReason { get; set; }

    // Navigation
    public Errand Errand { get; set; } = null!;
    public ApplicationUser Reviewer { get; set; } = null!;
    public ApplicationUser Reviewee { get; set; } = null!;
    public Vendor? Vendor { get; set; }
}
