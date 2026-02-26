namespace RunAm.Domain.Entities;

public class Wallet : BaseEntity
{
    public Guid UserId { get; set; }
    public decimal Balance { get; set; }
    public string Currency { get; set; } = "NGN";

    // Navigation
    public ApplicationUser User { get; set; } = null!;
    public ICollection<WalletTransaction> Transactions { get; set; } = new List<WalletTransaction>();

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
