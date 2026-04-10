using RunAm.Domain.Entities;

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
}
