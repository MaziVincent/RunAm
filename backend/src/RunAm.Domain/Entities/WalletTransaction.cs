using RunAm.Domain.Enums;

namespace RunAm.Domain.Entities;

public class WalletTransaction : BaseEntity
{
    public Guid WalletId { get; set; }
    public TransactionType Type { get; set; }
    public decimal Amount { get; set; }
    public decimal BalanceAfter { get; set; }
    public TransactionSource Source { get; set; }
    public Guid? ReferenceId { get; set; }
    public string? Description { get; set; }

    // Navigation
    public Wallet Wallet { get; set; } = null!;
}
