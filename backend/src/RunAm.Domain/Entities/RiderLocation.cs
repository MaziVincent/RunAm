namespace RunAm.Domain.Entities;

public class RiderLocation
{
    public long Id { get; set; }
    public Guid RiderId { get; set; }
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public double? Heading { get; set; }
    public double? Speed { get; set; }
    public DateTime RecordedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public ApplicationUser Rider { get; set; } = null!;
}
