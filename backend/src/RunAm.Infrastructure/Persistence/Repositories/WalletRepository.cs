using Microsoft.EntityFrameworkCore;
using RunAm.Domain.Entities;
using RunAm.Domain.Enums;
using RunAm.Domain.Interfaces;

namespace RunAm.Infrastructure.Persistence.Repositories;

public class WalletRepository : IWalletRepository
{
    private readonly AppDbContext _db;

    public WalletRepository(AppDbContext db) => _db = db;

    public async Task<Wallet?> GetByUserIdAsync(Guid userId, CancellationToken ct = default)
        => await _db.Wallets
            .FirstOrDefaultAsync(w => w.UserId == userId, ct);

    public async Task AddAsync(Wallet wallet, CancellationToken ct = default)
        => await _db.Wallets.AddAsync(wallet, ct);

    public async Task AddTransactionAsync(WalletTransaction transaction, CancellationToken ct = default)
        => await _db.WalletTransactions.AddAsync(transaction, ct);

    public async Task<WalletTransaction?> GetTransactionByExternalReferenceAsync(string externalReference, CancellationToken ct = default)
        => await _db.WalletTransactions
            .FirstOrDefaultAsync(t => t.ExternalReference == externalReference, ct);

    public async Task<IReadOnlyList<WalletTransaction>> GetTransactionsAsync(Guid walletId, int page, int pageSize, CancellationToken ct = default)
        => await _db.WalletTransactions
            .Where(t => t.WalletId == walletId)
            .OrderByDescending(t => t.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

    public async Task<int> GetTransactionCountAsync(Guid walletId, CancellationToken ct = default)
        => await _db.WalletTransactions.CountAsync(t => t.WalletId == walletId, ct);

    public Task UpdateAsync(Wallet wallet, CancellationToken ct = default)
    {
        _db.Wallets.Update(wallet);
        return Task.CompletedTask;
    }

    public async Task<IReadOnlyList<WalletTransaction>> GetCreditTransactionsSinceAsync(
        Guid walletId, DateTime since, TransactionSource[] sources, CancellationToken ct = default)
        => await _db.WalletTransactions
            .Where(t => t.WalletId == walletId
                && t.Type == TransactionType.Credit
                && t.CreatedAt >= since
                && sources.Contains(t.Source))
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync(ct);

    public async Task<decimal> GetTotalCreditAmountAsync(
        Guid walletId, TransactionSource[] sources, CancellationToken ct = default)
        => await _db.WalletTransactions
            .Where(t => t.WalletId == walletId
                && t.Type == TransactionType.Credit
                && sources.Contains(t.Source))
            .SumAsync(t => t.Amount, ct);

    public async Task<int> GetCreditCountSinceAsync(
        Guid walletId, DateTime since, TransactionSource source, CancellationToken ct = default)
        => await _db.WalletTransactions
            .CountAsync(t => t.WalletId == walletId
                && t.Type == TransactionType.Credit
                && t.Source == source
                && t.CreatedAt >= since, ct);
}
