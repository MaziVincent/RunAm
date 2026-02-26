using RunAm.Domain.Enums;

namespace RunAm.Domain.Entities;

public class Payment : BaseEntity
{
    public Guid ErrandId { get; set; }
    public Guid PayerId { get; set; }
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "NGN";
    public PaymentMethod PaymentMethod { get; set; }
    public string? PaymentGatewayRef { get; set; }
    public PaymentStatus Status { get; set; } = PaymentStatus.Pending;

    // Navigation
    public Errand Errand { get; set; } = null!;
    public ApplicationUser Payer { get; set; } = null!;
}
