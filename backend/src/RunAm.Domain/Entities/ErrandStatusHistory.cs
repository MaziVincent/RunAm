using RunAm.Domain.Enums;

namespace RunAm.Domain.Entities;

public class ErrandStatusHistory : BaseEntity
{
    public Guid ErrandId { get; set; }
    public ErrandStatus Status { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public string? Notes { get; set; }
    public string? ImageUrl { get; set; }

    // Navigation
    public Errand Errand { get; set; } = null!;
}
