namespace RunAm.Domain.Entities;

public class UserAddress : BaseEntity
{
    public Guid UserId { get; set; }
    public string Label { get; set; } = string.Empty; // Home, Work, Custom
    public string Address { get; set; } = string.Empty;
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public bool IsDefault { get; set; }

    // Navigation
    public ApplicationUser User { get; set; } = null!;
}
