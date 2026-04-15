using MediatR;
using RunAm.Domain.Entities;
using RunAm.Domain.Enums;
using RunAm.Domain.Exceptions;
using RunAm.Domain.Interfaces;
using RunAm.Shared.DTOs.Errands;

namespace RunAm.Application.Errands.Commands;

public record UpdateErrandStatusCommand(Guid ErrandId, Guid UserId, UpdateErrandStatusRequest Request) : IRequest<ErrandDto>;

public class UpdateErrandStatusCommandHandler : IRequestHandler<UpdateErrandStatusCommand, ErrandDto>
{
    private readonly IErrandRepository _errandRepo;
    private readonly IWalletRepository _walletRepo;
    private readonly IPaymentRepository _paymentRepo;
    private readonly IUnitOfWork _uow;

    public UpdateErrandStatusCommandHandler(
        IErrandRepository errandRepo,
        IWalletRepository walletRepo,
        IPaymentRepository paymentRepo,
        IUnitOfWork uow)
    {
        _errandRepo = errandRepo;
        _walletRepo = walletRepo;
        _paymentRepo = paymentRepo;
        _uow = uow;
    }

    public async Task<ErrandDto> Handle(UpdateErrandStatusCommand command, CancellationToken cancellationToken)
    {
        var errand = await _errandRepo.GetByIdWithDetailsAsync(command.ErrandId, cancellationToken)
            ?? throw new NotFoundException("Errand", command.ErrandId);

        var req = command.Request;
        errand.TransitionTo(req.Status, req.Latitude, req.Longitude, req.Notes, req.ImageUrl);

        if (req.Status == ErrandStatus.Delivered)
            await HandleDeliveryPaymentAsync(errand, cancellationToken);

        await _errandRepo.UpdateAsync(errand, cancellationToken);
        await _uow.SaveChangesAsync(cancellationToken);

        return MapToDto(errand);
    }

    private async Task HandleDeliveryPaymentAsync(Errand errand, CancellationToken ct)
    {
        // Mark cash payments as completed on delivery
        var payment = await _paymentRepo.GetByErrandIdAsync(errand.Id, ct);
        if (payment is not null && payment.Status == PaymentStatus.Pending && payment.PaymentMethod == PaymentMethod.Cash)
        {
            payment.Status = PaymentStatus.Completed;
            await _paymentRepo.UpdateAsync(payment, ct);
        }

        // Credit rider wallet with earnings (total minus commission)
        if (!errand.RiderId.HasValue) return;

        var riderWallet = await _walletRepo.GetByUserIdAsync(errand.RiderId.Value, ct);
        if (riderWallet is null || !riderWallet.IsActive) return;

        var riderEarnings = errand.TotalAmount - errand.CommissionAmount;
        if (riderEarnings <= 0) return;

        riderWallet.Credit(riderEarnings);
        await _walletRepo.UpdateAsync(riderWallet, ct);

        await _walletRepo.AddTransactionAsync(new WalletTransaction
        {
            WalletId = riderWallet.Id,
            Type = TransactionType.Credit,
            Amount = riderEarnings,
            BalanceAfter = riderWallet.Balance,
            Source = TransactionSource.ErrandEarning,
            ReferenceId = errand.Id,
            Description = $"Earning for errand #{errand.Id.ToString()[..8]}"
        }, ct);

        // Record platform commission as a separate transaction for audit trail
        if (errand.CommissionAmount > 0)
        {
            await _walletRepo.AddTransactionAsync(new WalletTransaction
            {
                WalletId = riderWallet.Id,
                Type = TransactionType.Debit,
                Amount = errand.CommissionAmount,
                BalanceAfter = riderWallet.Balance,
                Source = TransactionSource.Commission,
                ReferenceId = errand.Id,
                Description = $"Platform commission for errand #{errand.Id.ToString()[..8]}"
            }, ct);
        }
    }

    private static ErrandDto MapToDto(Domain.Entities.Errand e) => new(
        e.Id, e.CustomerId, e.Customer?.FullName ?? "", e.RiderId, e.Rider?.FullName, e.Category, e.Status,
        e.Description, e.SpecialInstructions, e.Priority, e.ScheduledAt,
        e.PickupAddress, e.PickupLatitude, e.PickupLongitude,
        e.DropoffAddress, e.DropoffLatitude, e.DropoffLongitude,
        e.EstimatedDistance, e.EstimatedDuration, e.PackageSize, e.PackageWeight,
        e.IsFragile, e.RequiresPhotoProof, e.RecipientName, e.RecipientPhone,
        e.TotalAmount, e.AcceptedAt, e.PickedUpAt, e.DeliveredAt, e.CancelledAt,
        e.CancellationReason, e.CreatedAt,
        e.StatusHistory.Select(s => new ErrandStatusHistoryDto(s.Id, s.Status, s.Latitude, s.Longitude, s.Notes, s.ImageUrl, s.CreatedAt)).ToList(),
        e.Stops.Select(s => new ErrandStopDto(s.Id, s.StopOrder, s.Address, s.Latitude, s.Longitude, s.ContactName, s.ContactPhone, s.Instructions, s.Status, s.ArrivedAt, s.CompletedAt)).ToList(),
        e.VendorId, e.Vendor?.BusinessName, e.VendorOrderStatus != null ? (int)e.VendorOrderStatus : null
    );
}
