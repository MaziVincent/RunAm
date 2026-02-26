using MediatR;
using RunAm.Domain.Enums;
using RunAm.Domain.Exceptions;
using RunAm.Domain.Interfaces;
using RunAm.Shared.DTOs.Errands;

namespace RunAm.Application.Matching.Commands;

public record AcceptErrandCommand(Guid ErrandId, Guid RiderId) : IRequest<ErrandDto>;

public class AcceptErrandCommandHandler : IRequestHandler<AcceptErrandCommand, ErrandDto>
{
    private readonly IErrandRepository _errandRepo;
    private readonly IRiderRepository _riderRepo;
    private readonly IUnitOfWork _uow;

    public AcceptErrandCommandHandler(IErrandRepository errandRepo, IRiderRepository riderRepo, IUnitOfWork uow)
    {
        _errandRepo = errandRepo;
        _riderRepo = riderRepo;
        _uow = uow;
    }

    public async Task<ErrandDto> Handle(AcceptErrandCommand command, CancellationToken cancellationToken)
    {
        var errand = await _errandRepo.GetByIdWithDetailsAsync(command.ErrandId, cancellationToken)
            ?? throw new NotFoundException("Errand", command.ErrandId);

        if (errand.Status != ErrandStatus.Pending)
            throw new InvalidOperationException("This errand is no longer available.");

        var rider = await _riderRepo.GetByUserIdAsync(command.RiderId, cancellationToken)
            ?? throw new NotFoundException("RiderProfile", command.RiderId);

        if (!rider.IsOnline || rider.ApprovalStatus != Domain.Enums.ApprovalStatus.Approved)
            throw new InvalidOperationException("Rider is not available.");

        errand.RiderId = command.RiderId;
        errand.TransitionTo(ErrandStatus.Accepted);

        await _errandRepo.UpdateAsync(errand, cancellationToken);
        await _uow.SaveChangesAsync(cancellationToken);

        return new ErrandDto(
            errand.Id, errand.CustomerId, errand.Customer?.FullName ?? "", errand.RiderId, rider.User?.FullName,
            errand.Category, errand.Status, errand.Description, errand.SpecialInstructions,
            errand.Priority, errand.ScheduledAt, errand.PickupAddress, errand.PickupLatitude, errand.PickupLongitude,
            errand.DropoffAddress, errand.DropoffLatitude, errand.DropoffLongitude,
            errand.EstimatedDistance, errand.EstimatedDuration, errand.PackageSize, errand.PackageWeight,
            errand.IsFragile, errand.RequiresPhotoProof, errand.RecipientName, errand.RecipientPhone,
            errand.TotalAmount, errand.AcceptedAt, errand.PickedUpAt, errand.DeliveredAt, errand.CancelledAt,
            errand.CancellationReason, errand.CreatedAt,
            errand.StatusHistory.Select(s => new ErrandStatusHistoryDto(s.Id, s.Status, s.Latitude, s.Longitude, s.Notes, s.ImageUrl, s.CreatedAt)).ToList(),
            errand.Stops.Select(s => new ErrandStopDto(s.Id, s.StopOrder, s.Address, s.Latitude, s.Longitude, s.ContactName, s.ContactPhone, s.Instructions, s.Status, s.ArrivedAt, s.CompletedAt)).ToList()
        );
    }
}
