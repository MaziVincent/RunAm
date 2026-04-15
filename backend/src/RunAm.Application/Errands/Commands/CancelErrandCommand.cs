using MediatR;
using RunAm.Domain.Enums;
using RunAm.Domain.Exceptions;
using RunAm.Domain.Interfaces;
using RunAm.Shared.DTOs.Errands;

namespace RunAm.Application.Errands.Commands;

public record CancelErrandCommand(Guid ErrandId, Guid UserId, string Reason) : IRequest<ErrandDto>;

public class CancelErrandCommandHandler : IRequestHandler<CancelErrandCommand, ErrandDto>
{
    private readonly IErrandRepository _errandRepo;
    private readonly IUnitOfWork _uow;

    public CancelErrandCommandHandler(IErrandRepository errandRepo, IUnitOfWork uow)
    {
        _errandRepo = errandRepo;
        _uow = uow;
    }

    public async Task<ErrandDto> Handle(CancelErrandCommand command, CancellationToken cancellationToken)
    {
        var errand = await _errandRepo.GetByIdWithDetailsAsync(command.ErrandId, cancellationToken)
            ?? throw new NotFoundException("Errand", command.ErrandId);

        // Verify the user is the customer or an admin
        if (errand.CustomerId != command.UserId)
            throw new UnauthorizedAccessException("You can only cancel your own errands.");

        errand.TransitionTo(ErrandStatus.Cancelled, notes: command.Reason);

        await _errandRepo.UpdateAsync(errand, cancellationToken);
        await _uow.SaveChangesAsync(cancellationToken);

        return new ErrandDto(
            errand.Id, errand.CustomerId, errand.Customer?.FullName ?? "", errand.RiderId, errand.Rider?.FullName,
            errand.Category, errand.Status, errand.Description, errand.SpecialInstructions,
            errand.Priority, errand.ScheduledAt, errand.PickupAddress, errand.PickupLatitude, errand.PickupLongitude,
            errand.DropoffAddress, errand.DropoffLatitude, errand.DropoffLongitude,
            errand.EstimatedDistance, errand.EstimatedDuration, errand.PackageSize, errand.PackageWeight,
            errand.IsFragile, errand.RequiresPhotoProof, errand.RecipientName, errand.RecipientPhone,
            errand.TotalAmount, errand.AcceptedAt, errand.PickedUpAt, errand.DeliveredAt, errand.CancelledAt,
            errand.CancellationReason, errand.CreatedAt, null, null,
            errand.VendorId, errand.Vendor?.BusinessName,
            errand.VendorOrderStatus != null ? (int)errand.VendorOrderStatus : null
        );
    }
}
