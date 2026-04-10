namespace RunAm.Domain.Entities;

public class Wallet : BaseEntity
{
    public Guid UserId { get; set; }
    public decimal Balance { get; set; }
    public string Currency { get; set; } = "NGN";
    public bool IsActive { get; set; }
    public DateTime? ActivatedAt { get; set; }
    public string? MonnifyAccountReference { get; set; }
    public string? MonnifyAccountNumber { get; set; }
    public string? MonnifyAccountName { get; set; }
    public string? MonnifyBankName { get; set; }
    public string? MonnifyBankCode { get; set; }

    // Navigation
    public ApplicationUser User { get; set; } = null!;
    public ICollection<WalletTransaction> Transactions { get; set; } = new List<WalletTransaction>();

    public void Activate(string accountReference, string accountNumber, string accountName, string bankName, string bankCode)
    {
        IsActive = true;
        ActivatedAt = DateTime.UtcNow;
        MonnifyAccountReference = accountReference;
        MonnifyAccountNumber = accountNumber;
        MonnifyAccountName = accountName;
        MonnifyBankName = bankName;
        MonnifyBankCode = bankCode;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Credit(decimal amount)
    {
        if (amount <= 0) throw new InvalidOperationException("Credit amount must be positive.");
        Balance += amount;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Debit(decimal amount)
    {
        if (amount <= 0) throw new InvalidOperationException("Debit amount must be positive.");
        if (Balance < amount) throw new InvalidOperationException("Insufficient wallet balance.");
        Balance -= amount;
        UpdatedAt = DateTime.UtcNow;
    }
}
