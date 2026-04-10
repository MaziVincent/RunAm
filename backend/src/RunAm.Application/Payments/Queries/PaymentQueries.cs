using MediatR;
using RunAm.Domain.Exceptions;
using RunAm.Domain.Interfaces;
using RunAm.Shared.DTOs.Payments;

namespace RunAm.Application.Payments.Queries;

// ── Get Wallet ──────────────────────────────────

public record GetWalletQuery(Guid UserId) : IRequest<WalletDto?>;

public class GetWalletQueryHandler : IRequestHandler<GetWalletQuery, WalletDto?>
{
    private readonly IWalletRepository _walletRepo;

    public GetWalletQueryHandler(IWalletRepository walletRepo) => _walletRepo = walletRepo;

    public async Task<WalletDto?> Handle(GetWalletQuery query, CancellationToken ct)
    {
        var wallet = await _walletRepo.GetByUserIdAsync(query.UserId, ct);
        return wallet is null
            ? null
            : new WalletDto(
                wallet.Id,
                wallet.Balance,
                wallet.Currency,
                wallet.IsActive,
                wallet.MonnifyAccountReference,
                wallet.MonnifyAccountNumber,
                wallet.MonnifyAccountName,
                wallet.MonnifyBankName,
                wallet.MonnifyBankCode,
                wallet.ActivatedAt);
    }
}

// ── Get Wallet Transactions ─────────────────────

public record GetWalletTransactionsQuery(Guid UserId, int Page = 1, int PageSize = 20) : IRequest<(IReadOnlyList<WalletTransactionDto> Transactions, int TotalCount)>;

public class GetWalletTransactionsQueryHandler : IRequestHandler<GetWalletTransactionsQuery, (IReadOnlyList<WalletTransactionDto> Transactions, int TotalCount)>
{
    private readonly IWalletRepository _walletRepo;

    public GetWalletTransactionsQueryHandler(IWalletRepository walletRepo) => _walletRepo = walletRepo;

    public async Task<(IReadOnlyList<WalletTransactionDto> Transactions, int TotalCount)> Handle(GetWalletTransactionsQuery query, CancellationToken ct)
    {
        var wallet = await _walletRepo.GetByUserIdAsync(query.UserId, ct)
            ?? throw new NotFoundException("Wallet", query.UserId);

        var transactions = await _walletRepo.GetTransactionsAsync(wallet.Id, query.Page, query.PageSize, ct);
        var totalCount = await _walletRepo.GetTransactionCountAsync(wallet.Id, ct);

        var dtos = transactions.Select(t => new WalletTransactionDto(
            t.Id, t.Type, t.Amount, t.BalanceAfter, t.Source,
            t.ReferenceId, t.ExternalReference, t.Description, t.CreatedAt
        )).ToList();

        return (dtos, totalCount);
    }
}

// ── Get Rider Earnings ──────────────────────────

public record GetRiderEarningsQuery(Guid RiderId) : IRequest<EarningsSummaryDto>;

public class GetRiderEarningsQueryHandler : IRequestHandler<GetRiderEarningsQuery, EarningsSummaryDto>
{
    private readonly IWalletRepository _walletRepo;
    private readonly IRiderPayoutRepository _payoutRepo;

    public GetRiderEarningsQueryHandler(IWalletRepository walletRepo, IRiderPayoutRepository payoutRepo)
    {
        _walletRepo = walletRepo;
        _payoutRepo = payoutRepo;
    }

    public async Task<EarningsSummaryDto> Handle(GetRiderEarningsQuery query, CancellationToken ct)
    {
        var wallet = await _walletRepo.GetByUserIdAsync(query.RiderId, ct);
        if (wallet is null)
        {
            return new EarningsSummaryDto(0, 0, 0, 0, 0, 0, 0, 0, new List<DailyEarningsPointDto>());
        }

        var allTransactions = await _walletRepo.GetTransactionsAsync(wallet.Id, 1, int.MaxValue, ct);

        var credits = allTransactions.Where(t => t.Type == Domain.Enums.TransactionType.Credit).ToList();
        var now = DateTime.UtcNow;
        var today = now.Date;
        var weekStart = today.AddDays(-(int)today.DayOfWeek);
        var monthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);

        var todayEarnings = credits.Where(t => t.CreatedAt >= today).Sum(t => t.Amount);
        var weekEarnings = credits.Where(t => t.CreatedAt >= weekStart).Sum(t => t.Amount);
        var monthEarnings = credits.Where(t => t.CreatedAt >= monthStart).Sum(t => t.Amount);
        var totalEarnings = credits.Sum(t => t.Amount);

        var errandCredits = credits.Where(t =>
            t.Source == Domain.Enums.TransactionSource.ErrandEarning ||
            t.Source == Domain.Enums.TransactionSource.Tip).ToList();

        var todayTrips = errandCredits.Count(t => t.CreatedAt >= today && t.Source == Domain.Enums.TransactionSource.ErrandEarning);
        var weekTrips = errandCredits.Count(t => t.CreatedAt >= weekStart && t.Source == Domain.Enums.TransactionSource.ErrandEarning);
        var pendingPayouts = (await _payoutRepo.GetOutstandingAsync(ct))
            .Where(p => p.RiderId == query.RiderId)
            .Sum(p => p.Amount);

        var dailyEarnings = errandCredits
            .Where(t => t.CreatedAt >= today.AddDays(-13))
            .GroupBy(t => t.CreatedAt.Date)
            .OrderBy(g => g.Key)
            .Select(g => new DailyEarningsPointDto(
                g.Key,
                g.Sum(t => t.Amount),
                g.Count(t => t.Source == Domain.Enums.TransactionSource.ErrandEarning)))
            .ToList();

        return new EarningsSummaryDto(
            todayEarnings, weekEarnings, monthEarnings, totalEarnings,
            todayTrips, weekTrips, wallet.Balance, pendingPayouts, dailyEarnings
        );
    }
}
