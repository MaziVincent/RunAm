using MediatR;
using RunAm.Domain.Exceptions;
using RunAm.Domain.Interfaces;
using RunAm.Shared.DTOs;
using RunAm.Shared.DTOs.Errands;

namespace RunAm.Application.Errands.Queries;

public record GetErrandByIdQuery(Guid ErrandId, Guid RequestingUserId) : IRequest<ErrandDto>;

public class GetErrandByIdQueryHandler : IRequestHandler<GetErrandByIdQuery, ErrandDto>
{
    private readonly IErrandRepository _errandRepo;

    public GetErrandByIdQueryHandler(IErrandRepository errandRepo) => _errandRepo = errandRepo;

    public async Task<ErrandDto> Handle(GetErrandByIdQuery query, CancellationToken cancellationToken)
    {
        var errand = await _errandRepo.GetByIdWithDetailsAsync(query.ErrandId, cancellationToken)
            ?? throw new NotFoundException("Errand", query.ErrandId);

        // Ownership check: only the customer or assigned rider may view
        if (errand.CustomerId != query.RequestingUserId && errand.RiderId != query.RequestingUserId)
            throw new UnauthorizedAccessException("You do not have access to this errand.");

        return new ErrandDto(
            errand.Id, errand.CustomerId, errand.Customer?.FullName ?? "", errand.RiderId, errand.Rider?.FullName,
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
