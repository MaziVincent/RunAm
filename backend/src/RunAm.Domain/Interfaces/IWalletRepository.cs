using RunAm.Domain.Entities;
using RunAm.Domain.Enums;

namespace RunAm.Domain.Interfaces;

public interface IWalletRepository
{
    Task<Wallet?> GetByUserIdAsync(Guid userId, CancellationToken ct = default);
    Task AddAsync(Wallet wallet, CancellationToken ct = default);
    Task AddTransactionAsync(WalletTransaction transaction, CancellationToken ct = default);
    Task<WalletTransaction?> GetTransactionByExternalReferenceAsync(string externalReference, CancellationToken ct = default);
    Task<IReadOnlyList<WalletTransaction>> GetTransactionsAsync(Guid walletId, int page, int pageSize, CancellationToken ct = default);
    Task<int> GetTransactionCountAsync(Guid walletId, CancellationToken ct = default);
    Task UpdateAsync(Wallet wallet, CancellationToken ct = default);
    Task<IReadOnlyList<WalletTransaction>> GetCreditTransactionsSinceAsync(Guid walletId, DateTime since, TransactionSource[] sources, CancellationToken ct = default);
    Task<decimal> GetTotalCreditAmountAsync(Guid walletId, TransactionSource[] sources, CancellationToken ct = default);
    Task<int> GetCreditCountSinceAsync(Guid walletId, DateTime since, TransactionSource source, CancellationToken ct = default);
}
