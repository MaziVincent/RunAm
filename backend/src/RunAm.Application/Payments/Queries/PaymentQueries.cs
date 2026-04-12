using MediatR;
using RunAm.Domain.Enums;
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

        var earningSources = new[] { TransactionSource.ErrandEarning, TransactionSource.Tip };
        var now = DateTime.UtcNow;
        var today = now.Date;
        var weekStart = today.AddDays(-(int)today.DayOfWeek);
        var monthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var chartStart = today.AddDays(-13);

        // Use DB-level aggregation instead of loading all transactions
        var totalEarnings = await _walletRepo.GetTotalCreditAmountAsync(wallet.Id, earningSources, ct);

        var monthCredits = await _walletRepo.GetCreditTransactionsSinceAsync(wallet.Id, monthStart, earningSources, ct);
        var monthEarnings = monthCredits.Sum(t => t.Amount);
        var weekEarnings = monthCredits.Where(t => t.CreatedAt >= weekStart).Sum(t => t.Amount);
        var todayEarnings = monthCredits.Where(t => t.CreatedAt >= today).Sum(t => t.Amount);

        var todayTrips = monthCredits.Count(t => t.CreatedAt >= today && t.Source == TransactionSource.ErrandEarning);
        var weekTrips = monthCredits.Count(t => t.CreatedAt >= weekStart && t.Source == TransactionSource.ErrandEarning);

        var pendingPayouts = (await _payoutRepo.GetOutstandingAsync(ct))
            .Where(p => p.RiderId == query.RiderId)
            .Sum(p => p.Amount);

        var dailyEarnings = monthCredits
            .Where(t => t.CreatedAt >= chartStart)
            .GroupBy(t => t.CreatedAt.Date)
            .OrderBy(g => g.Key)
            .Select(g => new DailyEarningsPointDto(
                g.Key,
                g.Sum(t => t.Amount),
                g.Count(t => t.Source == TransactionSource.ErrandEarning)))
            .ToList();

        return new EarningsSummaryDto(
            todayEarnings, weekEarnings, monthEarnings, totalEarnings,
            todayTrips, weekTrips, wallet.Balance, pendingPayouts, dailyEarnings
        );
    }
}

// ── Get Errand Payment Status ───────────────────

public record GetErrandPaymentStatusQuery(Guid UserId, Guid ErrandId) : IRequest<PaymentDto?>;

public class GetErrandPaymentStatusQueryHandler : IRequestHandler<GetErrandPaymentStatusQuery, PaymentDto?>
{
    private readonly IPaymentRepository _paymentRepo;
    private readonly IMonnifyService _monnify;
    private readonly IUnitOfWork _uow;

    public GetErrandPaymentStatusQueryHandler(
        IPaymentRepository paymentRepo,
        IMonnifyService monnify,
        IUnitOfWork uow)
    {
        _paymentRepo = paymentRepo;
        _monnify = monnify;
        _uow = uow;
    }

    public async Task<PaymentDto?> Handle(GetErrandPaymentStatusQuery query, CancellationToken ct)
    {
        var payment = await _paymentRepo.GetByErrandIdAsync(query.ErrandId, ct);
        if (payment is null || payment.PayerId != query.UserId) return null;

        // If still pending and has a gateway ref, verify with Monnify in real-time
        if (payment.Status == PaymentStatus.Pending && !string.IsNullOrEmpty(payment.PaymentGatewayRef))
        {
            var verification = await _monnify.VerifyTransactionAsync(payment.PaymentGatewayRef, ct);
            if (verification.Paid && verification.Amount >= payment.Amount)
            {
                payment.Status = PaymentStatus.Completed;
                payment.PaymentGatewayRef = verification.TransactionReference ?? payment.PaymentGatewayRef;
                await _paymentRepo.UpdateAsync(payment, ct);
                await _uow.SaveChangesAsync(ct);
            }
        }

        return new PaymentDto(
            payment.Id, payment.ErrandId, payment.PayerId,
            payment.Amount, payment.Currency, payment.PaymentMethod,
            payment.PaymentGatewayRef, payment.Status, payment.CreatedAt
        );
    }
}
