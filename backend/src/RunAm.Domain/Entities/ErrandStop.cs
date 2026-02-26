using RunAm.Domain.Enums;

namespace RunAm.Domain.Entities;

public class ErrandStop : BaseEntity
{
    public Guid ErrandId { get; set; }
    public int StopOrder { get; set; }
    public string Address { get; set; } = string.Empty;
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public string? ContactName { get; set; }
    public string? ContactPhone { get; set; }
    public string? Instructions { get; set; }
    public ErrandStopStatus Status { get; set; } = ErrandStopStatus.Pending;
    public DateTime? ArrivedAt { get; set; }
    public DateTime? CompletedAt { get; set; }

    // Navigation
    public Errand Errand { get; set; } = null!;
}
