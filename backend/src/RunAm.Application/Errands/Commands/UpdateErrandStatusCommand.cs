using MediatR;
using RunAm.Domain.Enums;
using RunAm.Domain.Exceptions;
using RunAm.Domain.Interfaces;
using RunAm.Shared.DTOs.Errands;

namespace RunAm.Application.Errands.Commands;

public record UpdateErrandStatusCommand(Guid ErrandId, Guid UserId, UpdateErrandStatusRequest Request) : IRequest<ErrandDto>;

public class UpdateErrandStatusCommandHandler : IRequestHandler<UpdateErrandStatusCommand, ErrandDto>
{
    private readonly IErrandRepository _errandRepo;
    private readonly IUnitOfWork _uow;

    public UpdateErrandStatusCommandHandler(IErrandRepository errandRepo, IUnitOfWork uow)
    {
        _errandRepo = errandRepo;
        _uow = uow;
    }

    public async Task<ErrandDto> Handle(UpdateErrandStatusCommand command, CancellationToken cancellationToken)
    {
        var errand = await _errandRepo.GetByIdWithDetailsAsync(command.ErrandId, cancellationToken)
            ?? throw new NotFoundException("Errand", command.ErrandId);

        var req = command.Request;
        errand.TransitionTo(req.Status, req.Latitude, req.Longitude, req.Notes, req.ImageUrl);

        await _errandRepo.UpdateAsync(errand, cancellationToken);
        await _uow.SaveChangesAsync(cancellationToken);

        return MapToDto(errand);
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
        e.Stops.Select(s => new ErrandStopDto(s.Id, s.StopOrder, s.Address, s.Latitude, s.Longitude, s.ContactName, s.ContactPhone, s.Instructions, s.Status, s.ArrivedAt, s.CompletedAt)).ToList()
    );
}
