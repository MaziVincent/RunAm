using MediatR;
using RunAm.Domain.Entities;
using RunAm.Domain.Enums;
using RunAm.Domain.Exceptions;
using RunAm.Domain.Interfaces;
using RunAm.Shared.DTOs.Payments;

namespace RunAm.Application.Payments.Commands;

// ── Top Up Wallet ───────────────────────────────

public record TopUpWalletCommand(Guid UserId, TopUpWalletRequest Request) : IRequest<WalletDto>;

public class TopUpWalletCommandHandler : IRequestHandler<TopUpWalletCommand, WalletDto>
{
    private readonly IWalletRepository _walletRepo;
    private readonly IUnitOfWork _uow;

    public TopUpWalletCommandHandler(IWalletRepository walletRepo, IUnitOfWork uow)
    {
        _walletRepo = walletRepo;
        _uow = uow;
    }

    public async Task<WalletDto> Handle(TopUpWalletCommand command, CancellationToken ct)
    {
        var wallet = await _walletRepo.GetOrCreateAsync(command.UserId, ct);

        wallet.Credit(command.Request.Amount);
        await _walletRepo.UpdateAsync(wallet, ct);

        var transaction = new WalletTransaction
        {
            WalletId = wallet.Id,
            Type = TransactionType.Credit,
            Amount = command.Request.Amount,
            BalanceAfter = wallet.Balance,
            Source = TransactionSource.TopUp,
            Description = $"Wallet top-up via {command.Request.PaymentMethod}",
            ReferenceId = null
        };

        await _walletRepo.AddTransactionAsync(transaction, ct);
        await _uow.SaveChangesAsync(ct);

        return new WalletDto(wallet.Id, wallet.Balance, wallet.Currency);
    }
}

// ── Withdraw ────────────────────────────────────

public record WithdrawCommand(Guid UserId, WithdrawRequest Request) : IRequest<WalletDto>;

public class WithdrawCommandHandler : IRequestHandler<WithdrawCommand, WalletDto>
{
    private readonly IWalletRepository _walletRepo;
    private readonly IMonnifyService _monnify;
    private readonly IUnitOfWork _uow;

    public WithdrawCommandHandler(IWalletRepository walletRepo, IMonnifyService monnify, IUnitOfWork uow)
    {
        _walletRepo = walletRepo;
        _monnify = monnify;
        _uow = uow;
    }

    public async Task<WalletDto> Handle(WithdrawCommand command, CancellationToken ct)
    {
        var wallet = await _walletRepo.GetByUserIdAsync(command.UserId, ct)
            ?? throw new NotFoundException("Wallet", command.UserId);

        if (wallet.Balance < command.Request.Amount)
            throw new InvalidOperationException("Insufficient wallet balance.");

        // Initiate bank transfer via Monnify FIRST — only debit wallet on success
        var reference = $"WD-{Guid.NewGuid():N}";
        var transfer = await _monnify.InitiateTransferAsync(
            command.Request.Amount,
            command.Request.BankCode,
            command.Request.AccountNumber,
            command.Request.AccountName,
            reference,
            ct);

        if (!transfer.Success)
            throw new InvalidOperationException($"Bank transfer failed: {transfer.Message}");

        wallet.Debit(command.Request.Amount);
        await _walletRepo.UpdateAsync(wallet, ct);

        var transaction = new WalletTransaction
        {
            WalletId = wallet.Id,
            Type = TransactionType.Debit,
            Amount = command.Request.Amount,
            BalanceAfter = wallet.Balance,
            Source = TransactionSource.Withdrawal,
            Description = $"Withdrawal to {command.Request.BankCode} - {command.Request.AccountNumber} (ref: {transfer.Reference})"
        };

        await _walletRepo.AddTransactionAsync(transaction, ct);
        await _uow.SaveChangesAsync(ct);

        return new WalletDto(wallet.Id, wallet.Balance, wallet.Currency);
    }
}

// ── Process Payment ─────────────────────────────

public record ProcessPaymentCommand(Guid PayerId, ProcessPaymentRequest Request) : IRequest<PaymentDto>;

public class ProcessPaymentCommandHandler : IRequestHandler<ProcessPaymentCommand, PaymentDto>
{
    private readonly IPaymentRepository _paymentRepo;
    private readonly IWalletRepository _walletRepo;
    private readonly IErrandRepository _errandRepo;
    private readonly IUnitOfWork _uow;

    public ProcessPaymentCommandHandler(
        IPaymentRepository paymentRepo,
        IWalletRepository walletRepo,
        IErrandRepository errandRepo,
        IUnitOfWork uow)
    {
        _paymentRepo = paymentRepo;
        _walletRepo = walletRepo;
        _errandRepo = errandRepo;
        _uow = uow;
    }

    public async Task<PaymentDto> Handle(ProcessPaymentCommand command, CancellationToken ct)
    {
        var errand = await _errandRepo.GetByIdAsync(command.Request.ErrandId, ct)
            ?? throw new NotFoundException("Errand", command.Request.ErrandId);

        var payment = new Payment
        {
            ErrandId = errand.Id,
            PayerId = command.PayerId,
            Amount = errand.TotalAmount,
            PaymentMethod = command.Request.PaymentMethod,
            PaymentGatewayRef = command.Request.PaymentReference
        };

        // If paying with wallet, debit immediately
        if (command.Request.PaymentMethod == PaymentMethod.Wallet)
        {
            var wallet = await _walletRepo.GetByUserIdAsync(command.PayerId, ct)
                ?? throw new NotFoundException("Wallet", command.PayerId);

            wallet.Debit(errand.TotalAmount);
            await _walletRepo.UpdateAsync(wallet, ct);

            await _walletRepo.AddTransactionAsync(new WalletTransaction
            {
                WalletId = wallet.Id,
                Type = TransactionType.Debit,
                Amount = errand.TotalAmount,
                BalanceAfter = wallet.Balance,
                Source = TransactionSource.ErrandPayment,
                ReferenceId = errand.Id,
                Description = $"Payment for errand #{errand.Id.ToString()[..8]}"
            }, ct);

            payment.Status = PaymentStatus.Completed;
        }
        else
        {
            // For external payment methods (card, mobile money), mark as pending
            // Real integration would verify with payment gateway
            payment.Status = command.Request.PaymentReference != null
                ? PaymentStatus.Completed
                : PaymentStatus.Pending;
        }

        await _paymentRepo.AddAsync(payment, ct);
        await _uow.SaveChangesAsync(ct);

        return new PaymentDto(
            payment.Id, payment.ErrandId, payment.PayerId,
            payment.Amount, payment.Currency, payment.PaymentMethod,
            payment.PaymentGatewayRef, payment.Status, payment.CreatedAt
        );
    }
}

// ── Add Tip ─────────────────────────────────────

public record AddTipCommand(Guid UserId, Guid ErrandId, decimal Amount) : IRequest<PaymentDto>;

public class AddTipCommandHandler : IRequestHandler<AddTipCommand, PaymentDto>
{
    private readonly IPaymentRepository _paymentRepo;
    private readonly IWalletRepository _walletRepo;
    private readonly IErrandRepository _errandRepo;
    private readonly IUnitOfWork _uow;

    public AddTipCommandHandler(
        IPaymentRepository paymentRepo,
        IWalletRepository walletRepo,
        IErrandRepository errandRepo,
        IUnitOfWork uow)
    {
        _paymentRepo = paymentRepo;
        _walletRepo = walletRepo;
        _errandRepo = errandRepo;
        _uow = uow;
    }

    public async Task<PaymentDto> Handle(AddTipCommand command, CancellationToken ct)
    {
        var errand = await _errandRepo.GetByIdAsync(command.ErrandId, ct)
            ?? throw new NotFoundException("Errand", command.ErrandId);

        if (!errand.RiderId.HasValue)
            throw new InvalidOperationException("Cannot tip — no rider assigned.");

        // Create a payment record for the tip
        var tipPayment = new Payment
        {
            ErrandId = errand.Id,
            PayerId = command.UserId,
            Amount = command.Amount,
            PaymentMethod = PaymentMethod.Wallet,
            Status = PaymentStatus.Completed
        };

        // Credit rider wallet
        var riderWallet = await _walletRepo.GetOrCreateAsync(errand.RiderId.Value, ct);
        riderWallet.Credit(command.Amount);
        await _walletRepo.UpdateAsync(riderWallet, ct);

        await _walletRepo.AddTransactionAsync(new WalletTransaction
        {
            WalletId = riderWallet.Id,
            Type = TransactionType.Credit,
            Amount = command.Amount,
            BalanceAfter = riderWallet.Balance,
            Source = TransactionSource.Tip,
            ReferenceId = errand.Id,
            Description = $"Tip for errand #{errand.Id.ToString()[..8]}"
        }, ct);

        await _paymentRepo.AddAsync(tipPayment, ct);
        await _uow.SaveChangesAsync(ct);

        return new PaymentDto(
            tipPayment.Id, tipPayment.ErrandId, tipPayment.PayerId,
            tipPayment.Amount, tipPayment.Currency, tipPayment.PaymentMethod,
            null, tipPayment.Status, tipPayment.CreatedAt
        );
    }
}
