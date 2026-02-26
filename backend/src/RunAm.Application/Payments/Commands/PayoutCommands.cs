using MediatR;
using RunAm.Domain.Entities;
using RunAm.Domain.Enums;
using RunAm.Domain.Exceptions;
using RunAm.Domain.Interfaces;
using RunAm.Shared.Constants;
using RunAm.Shared.DTOs.Payments;

namespace RunAm.Application.Payments.Commands;

// ── Create Rider Payout ─────────────────────────

public record CreateRiderPayoutCommand(Guid RiderId, DateTime PeriodStart, DateTime PeriodEnd) : IRequest<RiderPayoutDto>;

public class CreateRiderPayoutCommandHandler : IRequestHandler<CreateRiderPayoutCommand, RiderPayoutDto>
{
    private readonly IRiderPayoutRepository _payoutRepo;
    private readonly IWalletRepository _walletRepo;
    private readonly IUnitOfWork _uow;

    public CreateRiderPayoutCommandHandler(
        IRiderPayoutRepository payoutRepo,
        IWalletRepository walletRepo,
        IUnitOfWork uow)
    {
        _payoutRepo = payoutRepo;
        _walletRepo = walletRepo;
        _uow = uow;
    }

    public async Task<RiderPayoutDto> Handle(CreateRiderPayoutCommand command, CancellationToken ct)
    {
        var wallet = await _walletRepo.GetByUserIdAsync(command.RiderId, ct)
            ?? throw new NotFoundException("Wallet", command.RiderId);

        if (wallet.Balance <= 0)
            throw new InvalidOperationException("No available balance for payout.");

        var payout = new RiderPayout
        {
            RiderId = command.RiderId,
            Amount = wallet.Balance,
            PeriodStart = command.PeriodStart,
            PeriodEnd = command.PeriodEnd,
            Status = PayoutStatus.Pending,
            ErrandCount = 0 // Would be calculated from completed errands in period
        };

        await _payoutRepo.AddAsync(payout, ct);
        await _uow.SaveChangesAsync(ct);

        return MapToDto(payout);
    }

    private static RiderPayoutDto MapToDto(RiderPayout p) => new(
        p.Id, p.Amount, p.Currency, p.Status, p.PaymentReference,
        p.FailureReason, p.ProcessedAt, p.PeriodStart, p.PeriodEnd,
        p.ErrandCount, p.CreatedAt
    );
}

// ── Process Payout (Admin) ──────────────────────

public record ProcessPayoutCommand(Guid PayoutId) : IRequest<RiderPayoutDto>;

public class ProcessPayoutCommandHandler : IRequestHandler<ProcessPayoutCommand, RiderPayoutDto>
{
    private readonly IRiderPayoutRepository _payoutRepo;
    private readonly IWalletRepository _walletRepo;
    private readonly IUnitOfWork _uow;

    public ProcessPayoutCommandHandler(
        IRiderPayoutRepository payoutRepo,
        IWalletRepository walletRepo,
        IUnitOfWork uow)
    {
        _payoutRepo = payoutRepo;
        _walletRepo = walletRepo;
        _uow = uow;
    }

    public async Task<RiderPayoutDto> Handle(ProcessPayoutCommand command, CancellationToken ct)
    {
        var pending = await _payoutRepo.GetPendingAsync(ct);
        var payout = pending.FirstOrDefault(p => p.Id == command.PayoutId)
            ?? throw new NotFoundException("Payout", command.PayoutId);

        // Debit rider wallet
        var wallet = await _walletRepo.GetByUserIdAsync(payout.RiderId, ct)
            ?? throw new NotFoundException("Wallet", payout.RiderId);

        wallet.Debit(payout.Amount);
        await _walletRepo.UpdateAsync(wallet, ct);

        await _walletRepo.AddTransactionAsync(new WalletTransaction
        {
            WalletId = wallet.Id,
            Type = TransactionType.Debit,
            Amount = payout.Amount,
            BalanceAfter = wallet.Balance,
            Source = TransactionSource.Withdrawal,
            ReferenceId = payout.Id,
            Description = $"Payout #{payout.Id.ToString()[..8]} processed"
        }, ct);

        payout.Status = PayoutStatus.Completed;
        payout.ProcessedAt = DateTime.UtcNow;
        await _payoutRepo.UpdateAsync(payout, ct);
        await _uow.SaveChangesAsync(ct);

        return new RiderPayoutDto(
            payout.Id, payout.Amount, payout.Currency, payout.Status,
            payout.PaymentReference, payout.FailureReason, payout.ProcessedAt,
            payout.PeriodStart, payout.PeriodEnd, payout.ErrandCount, payout.CreatedAt
        );
    }
}

// ── Get Rider Payouts ───────────────────────────

public record GetRiderPayoutsQuery(Guid RiderId, int Page = 1, int PageSize = 20) : IRequest<IReadOnlyList<RiderPayoutDto>>;

public class GetRiderPayoutsQueryHandler : IRequestHandler<GetRiderPayoutsQuery, IReadOnlyList<RiderPayoutDto>>
{
    private readonly IRiderPayoutRepository _payoutRepo;

    public GetRiderPayoutsQueryHandler(IRiderPayoutRepository payoutRepo) => _payoutRepo = payoutRepo;

    public async Task<IReadOnlyList<RiderPayoutDto>> Handle(GetRiderPayoutsQuery query, CancellationToken ct)
    {
        var payouts = await _payoutRepo.GetByRiderIdAsync(query.RiderId, query.Page, query.PageSize, ct);

        return payouts.Select(p => new RiderPayoutDto(
            p.Id, p.Amount, p.Currency, p.Status, p.PaymentReference,
            p.FailureReason, p.ProcessedAt, p.PeriodStart, p.PeriodEnd,
            p.ErrandCount, p.CreatedAt
        )).ToList();
    }
}
