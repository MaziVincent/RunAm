using RunAm.Domain.Enums;

namespace RunAm.Domain.Entities;

public class RiderPayout : BaseEntity
{
    public Guid RiderId { get; set; }
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "NGN";
    public PayoutStatus Status { get; set; } = PayoutStatus.Pending;
    public string? PaymentReference { get; set; }
    public string DestinationBankCode { get; set; } = string.Empty;
    public string DestinationBankName { get; set; } = string.Empty;
    public string DestinationAccountNumber { get; set; } = string.Empty;
    public string DestinationAccountName { get; set; } = string.Empty;
    public string? FailureReason { get; set; }
    public DateTime? ProcessedAt { get; set; }
    public DateTime? LastCheckedAt { get; set; }
    public bool WalletRefunded { get; set; }
    public DateTime PeriodStart { get; set; }
    public DateTime PeriodEnd { get; set; }
    public int ErrandCount { get; set; }

    // Navigation
    public ApplicationUser Rider { get; set; } = null!;
}
