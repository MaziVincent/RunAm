using MediatR;
using RunAm.Domain.Entities;
using RunAm.Domain.Enums;
using RunAm.Domain.Exceptions;
using RunAm.Domain.Interfaces;
using RunAm.Shared.DTOs.Payments;

namespace RunAm.Application.Payments.Commands;

// ── Create Rider Payout ─────────────────────────

public record CreateRiderPayoutCommand(Guid RiderId, CreateRiderPayoutRequest Request) : IRequest<RiderPayoutDto>;

public class CreateRiderPayoutCommandHandler : IRequestHandler<CreateRiderPayoutCommand, RiderPayoutDto>
{
    private readonly IRiderPayoutRepository _payoutRepo;
    private readonly IRiderRepository _riderRepo;
    private readonly IWalletRepository _walletRepo;
    private readonly IUnitOfWork _uow;

    public CreateRiderPayoutCommandHandler(
        IRiderPayoutRepository payoutRepo,
        IRiderRepository riderRepo,
        IWalletRepository walletRepo,
        IUnitOfWork uow)
    {
        _payoutRepo = payoutRepo;
        _riderRepo = riderRepo;
        _walletRepo = walletRepo;
        _uow = uow;
    }

    public async Task<RiderPayoutDto> Handle(CreateRiderPayoutCommand command, CancellationToken ct)
    {
        var outstanding = await _payoutRepo.GetOutstandingAsync(ct);
        if (outstanding.Any(p => p.RiderId == command.RiderId))
            throw new InvalidOperationException("You already have a payout in progress.");

        var wallet = await _walletRepo.GetByUserIdAsync(command.RiderId, ct)
            ?? throw new NotFoundException("Wallet", command.RiderId);

        var riderProfile = await _riderRepo.GetByUserIdAsync(command.RiderId, ct)
            ?? throw new NotFoundException("RiderProfile", command.RiderId);

        if (command.Request.Amount <= 0)
            throw new InvalidOperationException("Payout amount must be greater than zero.");

        if (wallet.Balance < command.Request.Amount)
            throw new InvalidOperationException("Insufficient wallet balance.");

        // Calculate meaningful period: from last completed payout to now
        var lastPayouts = await _payoutRepo.GetByRiderIdAsync(command.RiderId, 1, 1, ct);
        var lastCompleted = lastPayouts.FirstOrDefault(p => p.Status == PayoutStatus.Completed);
        var periodStart = lastCompleted?.PeriodEnd ?? wallet.CreatedAt;
        var periodEnd = DateTime.UtcNow;

        // Count errands delivered in this period
        var errandCount = await _walletRepo.GetCreditCountSinceAsync(
            wallet.Id, periodStart, TransactionSource.ErrandEarning, ct);

        var payout = new RiderPayout
        {
            RiderId = command.RiderId,
            Amount = command.Request.Amount,
            PaymentReference = $"PAYOUT-{Guid.NewGuid():N}",
            DestinationBankCode = riderProfile.SettlementBankCode,
            DestinationBankName = riderProfile.SettlementBankName,
            DestinationAccountNumber = riderProfile.SettlementAccountNumber,
            DestinationAccountName = riderProfile.SettlementAccountName,
            PeriodStart = periodStart,
            PeriodEnd = periodEnd,
            Status = PayoutStatus.Pending,
            ErrandCount = errandCount
        };

        wallet.Debit(command.Request.Amount);
        await _walletRepo.UpdateAsync(wallet, ct);

        await _payoutRepo.AddAsync(payout, ct);

        await _walletRepo.AddTransactionAsync(new Domain.Entities.WalletTransaction
        {
            WalletId = wallet.Id,
            Type = TransactionType.Debit,
            Amount = payout.Amount,
            BalanceAfter = wallet.Balance,
            Source = TransactionSource.Withdrawal,
            ReferenceId = payout.Id,
            ExternalReference = payout.PaymentReference,
            Description = $"Rider payout request #{payout.Id.ToString()[..8]}"
        }, ct);

        await _uow.SaveChangesAsync(ct);

        return MapToDto(payout);
    }

    private static RiderPayoutDto MapToDto(RiderPayout p) => new(
        p.Id, p.Amount, p.Currency, p.Status, p.PaymentReference,
        p.DestinationBankName, p.DestinationAccountNumber, p.FailureReason, p.ProcessedAt, p.PeriodStart, p.PeriodEnd,
        p.ErrandCount, p.CreatedAt
    );
}

// ── Process Payout (Admin) ──────────────────────

public record ProcessPayoutCommand(Guid PayoutId) : IRequest<RiderPayoutDto>;

public class ProcessPayoutCommandHandler : IRequestHandler<ProcessPayoutCommand, RiderPayoutDto>
{
    private readonly IRiderPayoutRepository _payoutRepo;
    private readonly IRiderPayoutProcessingService _payoutProcessor;

    public ProcessPayoutCommandHandler(
        IRiderPayoutRepository payoutRepo,
        IRiderPayoutProcessingService payoutProcessor)
    {
        _payoutRepo = payoutRepo;
        _payoutProcessor = payoutProcessor;
    }

    public async Task<RiderPayoutDto> Handle(ProcessPayoutCommand command, CancellationToken ct)
    {
        var payout = await _payoutRepo.GetByIdAsync(command.PayoutId, ct)
            ?? throw new NotFoundException("Payout", command.PayoutId);

        payout = await _payoutProcessor.ProcessAsync(payout, ct);

        return new RiderPayoutDto(
            payout.Id, payout.Amount, payout.Currency, payout.Status,
            payout.PaymentReference, payout.DestinationBankName, payout.DestinationAccountNumber, payout.FailureReason, payout.ProcessedAt,
            payout.PeriodStart, payout.PeriodEnd, payout.ErrandCount, payout.CreatedAt
        );
    }
}

// ── Get Rider Payouts ───────────────────────────

public record GetRiderPayoutsQuery(Guid RiderId, int Page = 1, int PageSize = 20) : IRequest<(IReadOnlyList<RiderPayoutDto> Payouts, int TotalCount)>;

public class GetRiderPayoutsQueryHandler : IRequestHandler<GetRiderPayoutsQuery, (IReadOnlyList<RiderPayoutDto> Payouts, int TotalCount)>
{
    private readonly IRiderPayoutRepository _payoutRepo;

    public GetRiderPayoutsQueryHandler(IRiderPayoutRepository payoutRepo) => _payoutRepo = payoutRepo;

    public async Task<(IReadOnlyList<RiderPayoutDto> Payouts, int TotalCount)> Handle(GetRiderPayoutsQuery query, CancellationToken ct)
    {
        var payouts = await _payoutRepo.GetByRiderIdAsync(query.RiderId, query.Page, query.PageSize, ct);
        var totalCount = await _payoutRepo.GetCountByRiderIdAsync(query.RiderId, ct);

        var dtos = payouts.Select(p => new RiderPayoutDto(
            p.Id, p.Amount, p.Currency, p.Status, p.PaymentReference,
            p.DestinationBankName, p.DestinationAccountNumber, p.FailureReason, p.ProcessedAt, p.PeriodStart, p.PeriodEnd,
            p.ErrandCount, p.CreatedAt
        )).ToList();

        return (dtos, totalCount);
    }
}
