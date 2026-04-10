using Microsoft.Extensions.Logging;
using RunAm.Domain.Entities;
using RunAm.Domain.Enums;
using RunAm.Domain.Exceptions;
using RunAm.Domain.Interfaces;

namespace RunAm.Infrastructure.Services;

public class RiderPayoutProcessingService : IRiderPayoutProcessingService
{
    private readonly IRiderPayoutRepository _payoutRepo;
    private readonly IWalletRepository _walletRepo;
    private readonly IMonnifyService _monnify;
    private readonly IUnitOfWork _uow;
    private readonly ILogger<RiderPayoutProcessingService> _logger;

    public RiderPayoutProcessingService(
        IRiderPayoutRepository payoutRepo,
        IWalletRepository walletRepo,
        IMonnifyService monnify,
        IUnitOfWork uow,
        ILogger<RiderPayoutProcessingService> logger)
    {
        _payoutRepo = payoutRepo;
        _walletRepo = walletRepo;
        _monnify = monnify;
        _uow = uow;
        _logger = logger;
    }

    public async Task<int> ProcessOutstandingAsync(CancellationToken ct = default)
    {
        var payouts = await _payoutRepo.GetOutstandingAsync(ct);
        var processedCount = 0;

        foreach (var payout in payouts)
        {
            await ProcessAsync(payout, ct);
            processedCount++;
        }

        return processedCount;
    }

    public async Task<RiderPayout> ProcessAsync(RiderPayout payout, CancellationToken ct = default)
    {
        if (payout.Status == PayoutStatus.Completed || payout.Status == PayoutStatus.Failed && payout.WalletRefunded)
        {
            return payout;
        }

        if (payout.Status == PayoutStatus.Pending)
        {
            var transfer = await _monnify.InitiateTransferAsync(
                payout.Amount,
                payout.DestinationBankCode,
                payout.DestinationAccountNumber,
                payout.DestinationAccountName,
                payout.PaymentReference ?? $"PAYOUT-{payout.Id:N}",
                ct);

            if (!transfer.Success || string.IsNullOrWhiteSpace(transfer.Reference))
            {
                await RefundFailedPayoutAsync(payout, transfer.Message ?? "Failed to initiate transfer.", ct);
                return payout;
            }

            payout.PaymentReference = transfer.Reference;
            payout.Status = transfer.Status == "SUCCESS" ? PayoutStatus.Completed : PayoutStatus.Processing;
            payout.ProcessedAt = payout.Status == PayoutStatus.Completed ? DateTime.UtcNow : null;
            payout.LastCheckedAt = DateTime.UtcNow;
            payout.FailureReason = transfer.Status == "PENDING_AUTHORIZATION"
                ? "Monnify transfer is awaiting OTP authorization on the merchant account."
                : null;

            await _payoutRepo.UpdateAsync(payout, ct);
            await _uow.SaveChangesAsync(ct);

            _logger.LogInformation("Processed payout {PayoutId} with status {Status}", payout.Id, payout.Status);
            return payout;
        }

        if (string.IsNullOrWhiteSpace(payout.PaymentReference))
        {
            await RefundFailedPayoutAsync(payout, "Missing payout reference for reconciliation.", ct);
            return payout;
        }

        var transferStatus = await _monnify.GetTransferStatusAsync(payout.PaymentReference, ct);
        payout.LastCheckedAt = DateTime.UtcNow;

        if (!transferStatus.Found)
        {
            await _payoutRepo.UpdateAsync(payout, ct);
            await _uow.SaveChangesAsync(ct);
            return payout;
        }

        switch (transferStatus.Status)
        {
            case "SUCCESS":
                payout.Status = PayoutStatus.Completed;
                payout.ProcessedAt ??= DateTime.UtcNow;
                payout.FailureReason = null;
                break;

            case "FAILED":
            case "REVERSED":
            case "OTP_EMAIL_DISPATCH_FAILED":
                await RefundFailedPayoutAsync(payout, transferStatus.Message ?? transferStatus.Status ?? "Payout failed.", ct);
                return payout;

            default:
                payout.Status = PayoutStatus.Processing;
                break;
        }

        await _payoutRepo.UpdateAsync(payout, ct);
        await _uow.SaveChangesAsync(ct);
        return payout;
    }

    private async Task RefundFailedPayoutAsync(RiderPayout payout, string reason, CancellationToken ct)
    {
        payout.Status = PayoutStatus.Failed;
        payout.FailureReason = reason;
        payout.LastCheckedAt = DateTime.UtcNow;

        if (!payout.WalletRefunded)
        {
            var wallet = await _walletRepo.GetByUserIdAsync(payout.RiderId, ct)
                ?? throw new NotFoundException("Wallet", payout.RiderId);

            wallet.Credit(payout.Amount);
            await _walletRepo.UpdateAsync(wallet, ct);

            await _walletRepo.AddTransactionAsync(new WalletTransaction
            {
                WalletId = wallet.Id,
                Type = TransactionType.Credit,
                Amount = payout.Amount,
                BalanceAfter = wallet.Balance,
                Source = TransactionSource.Refund,
                ReferenceId = payout.Id,
                ExternalReference = payout.PaymentReference,
                Description = $"Refund for failed payout #{payout.Id.ToString()[..8]}"
            }, ct);

            payout.WalletRefunded = true;
        }

        await _payoutRepo.UpdateAsync(payout, ct);
        await _uow.SaveChangesAsync(ct);

        _logger.LogWarning("Payout {PayoutId} failed and was refunded: {Reason}", payout.Id, reason);
    }
}