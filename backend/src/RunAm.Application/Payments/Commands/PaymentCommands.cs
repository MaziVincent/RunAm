using MediatR;
using Microsoft.AspNetCore.Identity;
using RunAm.Domain.Entities;
using RunAm.Domain.Enums;
using RunAm.Domain.Exceptions;
using RunAm.Domain.Interfaces;
using RunAm.Shared.DTOs.Payments;

namespace RunAm.Application.Payments.Commands;

// ── Create Wallet ──────────────────────────────

public record CreateWalletCommand(Guid UserId, CreateWalletRequest Request) : IRequest<WalletDto>;

public class CreateWalletCommandHandler : IRequestHandler<CreateWalletCommand, WalletDto>
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IWalletRepository _walletRepo;
    private readonly IMonnifyService _monnify;
    private readonly IUnitOfWork _uow;

    public CreateWalletCommandHandler(
        UserManager<ApplicationUser> userManager,
        IWalletRepository walletRepo,
        IMonnifyService monnify,
        IUnitOfWork uow)
    {
        _userManager = userManager;
        _walletRepo = walletRepo;
        _monnify = monnify;
        _uow = uow;
    }

    public async Task<WalletDto> Handle(CreateWalletCommand command, CancellationToken ct)
    {
        var user = await _userManager.FindByIdAsync(command.UserId.ToString())
            ?? throw new NotFoundException("User", command.UserId);

        if (string.IsNullOrWhiteSpace(user.Email))
            throw new InvalidOperationException("A verified email is required to create a wallet.");

        var wallet = await _walletRepo.GetByUserIdAsync(command.UserId, ct);
        if (wallet?.IsActive == true)
            return PaymentMappings.MapWallet(wallet);

        var isNewWallet = wallet is null;

        var normalizedNin = NormalizeNin(command.Request.Nin);
        user.Nin = normalizedNin;

        var identityResult = await _userManager.UpdateAsync(user);
        if (!identityResult.Succeeded)
        {
            var errors = string.Join(" ", identityResult.Errors.Select(e => e.Description));
            throw new InvalidOperationException(errors);
        }

        var reservedAccount = await _monnify.ReserveAccountAsync(
            user.Id,
            user.FullName,
            user.Email,
            normalizedNin,
            ct);

        wallet ??= new Wallet { UserId = user.Id };
        wallet.Activate(
            reservedAccount.AccountReference,
            reservedAccount.AccountNumber,
            reservedAccount.AccountName,
            reservedAccount.BankName,
            reservedAccount.BankCode);

        if (isNewWallet)
            await _walletRepo.AddAsync(wallet, ct);
        else
            await _walletRepo.UpdateAsync(wallet, ct);

        await _uow.SaveChangesAsync(ct);
        return PaymentMappings.MapWallet(wallet);
    }

    private static string NormalizeNin(string nin)
    {
        var digits = new string((nin ?? string.Empty).Where(char.IsDigit).ToArray());
        if (digits.Length != 11)
            throw new InvalidOperationException("NIN must be exactly 11 digits.");

        return digits;
    }
}

// ── Top Up Wallet ───────────────────────────────

public record TopUpWalletCommand(Guid UserId, TopUpWalletRequest Request) : IRequest<WalletDto>;

public record VerifyMonnifyWebhookFundingCommand(
    Guid UserId,
    string AccountReference,
    string TransactionReference,
    string? PaymentReference,
    decimal Amount) : IRequest<VerifiedWebhookFundingResult>;

public record VerifiedWebhookFundingResult(
    bool ShouldCreditWallet,
    decimal Amount,
    string PaymentReference);

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
        var wallet = await _walletRepo.GetByUserIdAsync(command.UserId, ct)
            ?? throw new NotFoundException("Wallet", command.UserId);

        if (!wallet.IsActive)
            throw new InvalidOperationException("Create your Monnify wallet before funding it.");

        if (string.IsNullOrWhiteSpace(command.Request.PaymentReference))
            throw new InvalidOperationException("Wallet funding is completed by bank transfer into your reserved account.");

        var existingTransaction = await _walletRepo.GetTransactionByExternalReferenceAsync(command.Request.PaymentReference, ct);
        if (existingTransaction is not null)
            return PaymentMappings.MapWallet(wallet);

        wallet.Credit(command.Request.Amount);
        await _walletRepo.UpdateAsync(wallet, ct);

        var transaction = new WalletTransaction
        {
            WalletId = wallet.Id,
            Type = TransactionType.Credit,
            Amount = command.Request.Amount,
            BalanceAfter = wallet.Balance,
            Source = TransactionSource.TopUp,
            ExternalReference = command.Request.PaymentReference,
            Description = $"Wallet top-up via {command.Request.PaymentMethod}",
            ReferenceId = null
        };

        await _walletRepo.AddTransactionAsync(transaction, ct);
        await _uow.SaveChangesAsync(ct);

        return PaymentMappings.MapWallet(wallet);
    }
}

public class VerifyMonnifyWebhookFundingCommandHandler : IRequestHandler<VerifyMonnifyWebhookFundingCommand, VerifiedWebhookFundingResult>
{
    private readonly IMonnifyService _monnify;

    public VerifyMonnifyWebhookFundingCommandHandler(IMonnifyService monnify)
    {
        _monnify = monnify;
    }

    public async Task<VerifiedWebhookFundingResult> Handle(VerifyMonnifyWebhookFundingCommand command, CancellationToken ct)
    {
        var verification = await _monnify.VerifyTransactionAsync(command.TransactionReference, ct);
        var paymentReference = verification.PaymentReference ?? command.PaymentReference ?? command.TransactionReference;
        var amount = verification.Amount > 0 ? verification.Amount : command.Amount;

        var shouldCreditWallet = verification.Paid
            && !string.IsNullOrWhiteSpace(paymentReference)
            && string.Equals(verification.TransactionReference ?? command.TransactionReference, command.TransactionReference, StringComparison.OrdinalIgnoreCase)
            && string.Equals(verification.AccountReference, command.AccountReference, StringComparison.OrdinalIgnoreCase)
            && amount > 0;

        return new VerifiedWebhookFundingResult(shouldCreditWallet, amount, paymentReference);
    }
}

// ── Process Payment ─────────────────────────────

public record ProcessPaymentCommand(Guid PayerId, ProcessPaymentRequest Request) : IRequest<PaymentDto>;

public class ProcessPaymentCommandHandler : IRequestHandler<ProcessPaymentCommand, PaymentDto>
{
    private readonly IPaymentRepository _paymentRepo;
    private readonly IWalletRepository _walletRepo;
    private readonly IErrandRepository _errandRepo;
    private readonly IMonnifyService _monnify;
    private readonly IUnitOfWork _uow;

    public ProcessPaymentCommandHandler(
        IPaymentRepository paymentRepo,
        IWalletRepository walletRepo,
        IErrandRepository errandRepo,
        IMonnifyService monnify,
        IUnitOfWork uow)
    {
        _paymentRepo = paymentRepo;
        _walletRepo = walletRepo;
        _errandRepo = errandRepo;
        _monnify = monnify;
        _uow = uow;
    }

    public async Task<PaymentDto> Handle(ProcessPaymentCommand command, CancellationToken ct)
    {
        var errand = await _errandRepo.GetByIdAsync(command.Request.ErrandId, ct)
            ?? throw new NotFoundException("Errand", command.Request.ErrandId);

        var existingErrandPayment = await _paymentRepo.GetByErrandIdAsync(errand.Id, ct);
        if (existingErrandPayment?.Status == PaymentStatus.Completed)
            throw new InvalidOperationException("This errand has already been paid.");

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

            if (!wallet.IsActive)
                throw new InvalidOperationException("Create your Monnify wallet before paying with wallet.");

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
                ExternalReference = payment.PaymentGatewayRef,
                Description = $"Payment for errand #{errand.Id.ToString()[..8]}"
            }, ct);

            payment.Status = PaymentStatus.Completed;
        }
        else
        {
            if (string.IsNullOrWhiteSpace(command.Request.PaymentReference))
            {
                payment.Status = PaymentStatus.Pending;
            }
            else
            {
                var existingGatewayPayment = await _paymentRepo.GetByPaymentGatewayRefAsync(command.Request.PaymentReference, ct);
                if (existingGatewayPayment is not null && existingGatewayPayment.ErrandId != errand.Id)
                    throw new InvalidOperationException("This payment reference has already been used.");

                var verification = await _monnify.VerifyTransactionAsync(command.Request.PaymentReference, ct);
                if (!verification.Paid || verification.Amount < errand.TotalAmount)
                    throw new InvalidOperationException("Payment reference could not be verified.");

                payment.Status = PaymentStatus.Completed;
                payment.PaymentGatewayRef = verification.PaymentReference ?? command.Request.PaymentReference;
            }
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

        if (errand.Status != ErrandStatus.Delivered)
            throw new InvalidOperationException("Tips can only be added after the errand is delivered.");

        if (!errand.RiderId.HasValue)
            throw new InvalidOperationException("Cannot tip — no rider assigned.");

        // Debit tipper's wallet
        var tipperWallet = await _walletRepo.GetByUserIdAsync(command.UserId, ct)
            ?? throw new NotFoundException("Wallet", command.UserId);

        if (!tipperWallet.IsActive)
            throw new InvalidOperationException("Create your wallet before sending a tip.");

        tipperWallet.Debit(command.Amount);
        await _walletRepo.UpdateAsync(tipperWallet, ct);

        await _walletRepo.AddTransactionAsync(new WalletTransaction
        {
            WalletId = tipperWallet.Id,
            Type = TransactionType.Debit,
            Amount = command.Amount,
            BalanceAfter = tipperWallet.Balance,
            Source = TransactionSource.Tip,
            ReferenceId = errand.Id,
            Description = $"Tip sent for errand #{errand.Id.ToString()[..8]}"
        }, ct);

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
        var riderWallet = await _walletRepo.GetByUserIdAsync(errand.RiderId.Value, ct)
            ?? throw new NotFoundException("Wallet", errand.RiderId.Value);
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
            ExternalReference = tipPayment.Id.ToString(),
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

// ── Confirm Order Payment (via webhook) ─────────

public record ConfirmOrderPaymentCommand(
    string TransactionReference,
    string PaymentReference,
    decimal AmountPaid) : IRequest<bool>;

public class ConfirmOrderPaymentCommandHandler : IRequestHandler<ConfirmOrderPaymentCommand, bool>
{
    private readonly IPaymentRepository _paymentRepo;
    private readonly IMonnifyService _monnify;
    private readonly IUnitOfWork _uow;

    public ConfirmOrderPaymentCommandHandler(
        IPaymentRepository paymentRepo,
        IMonnifyService monnify,
        IUnitOfWork uow)
    {
        _paymentRepo = paymentRepo;
        _monnify = monnify;
        _uow = uow;
    }

    public async Task<bool> Handle(ConfirmOrderPaymentCommand command, CancellationToken ct)
    {
        // Find the payment by the gateway ref (transactionReference stored at init)
        var payment = await _paymentRepo.GetByPaymentGatewayRefAsync(command.TransactionReference, ct);
        if (payment is null || payment.Status == PaymentStatus.Completed)
            return false; // Already processed or not found

        // Server-side verify with Monnify
        var verification = await _monnify.VerifyTransactionAsync(command.TransactionReference, ct);
        if (!verification.Paid || verification.Amount < payment.Amount)
            return false;

        payment.Status = PaymentStatus.Completed;
        payment.PaymentGatewayRef = verification.TransactionReference ?? command.TransactionReference;
        await _paymentRepo.UpdateAsync(payment, ct);
        await _uow.SaveChangesAsync(ct);

        return true;
    }
}

internal static class PaymentMappings
{
    public static WalletDto MapWallet(Wallet wallet) => new(
        wallet.Id,
        wallet.Balance,
        wallet.Currency,
        wallet.IsActive,
        wallet.MonnifyAccountReference,
        wallet.MonnifyAccountNumber,
        wallet.MonnifyAccountName,
        wallet.MonnifyBankName,
        wallet.MonnifyBankCode,
        wallet.ActivatedAt
    );
}
