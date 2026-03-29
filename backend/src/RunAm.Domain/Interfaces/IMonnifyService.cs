namespace RunAm.Domain.Interfaces;

public interface IMonnifyService
{
    /// <summary>Reserve a virtual account for a user's wallet top-ups.</summary>
    Task<MonnifyReservedAccount> ReserveAccountAsync(Guid userId, string name, string email, CancellationToken ct = default);

    /// <summary>Initiate a single bank transfer (rider payout).</summary>
    Task<MonnifyTransferResult> InitiateTransferAsync(decimal amount, string bankCode, string accountNumber, string accountName, string reference, CancellationToken ct = default);

    /// <summary>Verify a transaction by reference.</summary>
    Task<MonnifyTransactionStatus> VerifyTransactionAsync(string transactionReference, CancellationToken ct = default);
}

public record MonnifyReservedAccount(
    string AccountNumber,
    string AccountName,
    string BankName,
    string BankCode,
    string AccountReference
);

public record MonnifyTransferResult(
    bool Success,
    string? Reference,
    string? Message
);

public record MonnifyTransactionStatus(
    bool Paid,
    decimal Amount,
    string? PaymentReference
);
