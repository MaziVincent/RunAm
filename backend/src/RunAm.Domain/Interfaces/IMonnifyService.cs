namespace RunAm.Domain.Interfaces;

public interface IMonnifyService
{
    /// <summary>Reserve a virtual account for a user's wallet top-ups.</summary>
    Task<MonnifyReservedAccount> ReserveAccountAsync(Guid userId, string name, string email, string nin, CancellationToken ct = default);

    /// <summary>Initialize a transaction (card, bank transfer, USSD) and get a checkout URL.</summary>
    Task<MonnifyInitTransactionResult> InitializeTransactionAsync(decimal amount, string customerName, string customerEmail, string paymentReference, string paymentDescription, string redirectUrl, CancellationToken ct = default);

    /// <summary>Initiate a single bank transfer (rider payout).</summary>
    Task<MonnifyTransferResult> InitiateTransferAsync(decimal amount, string bankCode, string accountNumber, string accountName, string reference, CancellationToken ct = default);

    /// <summary>Get a single transfer status by merchant reference.</summary>
    Task<MonnifyTransferStatus> GetTransferStatusAsync(string reference, CancellationToken ct = default);

    /// <summary>Verify a transaction by reference.</summary>
    Task<MonnifyTransactionStatus> VerifyTransactionAsync(string transactionReference, CancellationToken ct = default);

    /// <summary>Validate a bank account number and return the resolved account name.</summary>
    Task<MonnifyBankAccountInfo> ValidateBankAccountAsync(string bankCode, string accountNumber, CancellationToken ct = default);
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
    string? Status,
    string? Message
);

public record MonnifyTransferStatus(
    bool Found,
    string? Status,
    string? TransactionReference,
    string? Message
);

public record MonnifyTransactionStatus(
    bool Paid,
    decimal Amount,
    string? PaymentReference,
    string? TransactionReference,
    string? AccountReference
);

public record MonnifyBankAccountInfo(
    bool Success,
    string? AccountNumber,
    string? AccountName,
    string? BankCode
);

public record MonnifyInitTransactionResult(
    bool Success,
    string? TransactionReference,
    string? CheckoutUrl,
    string? Message
);
