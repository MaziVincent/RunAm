using MediatR;
using RunAm.Domain.Interfaces;
using RunAm.Shared.DTOs;
using RunAm.Shared.DTOs.Errands;

namespace RunAm.Application.Errands.Queries;

public record GetMyErrandsQuery(Guid CustomerId, int Page = 1, int PageSize = 20) : IRequest<(IReadOnlyList<ErrandDto> Errands, int TotalCount)>;

public class GetMyErrandsQueryHandler : IRequestHandler<GetMyErrandsQuery, (IReadOnlyList<ErrandDto> Errands, int TotalCount)>
{
    private readonly IErrandRepository _errandRepo;

    public GetMyErrandsQueryHandler(IErrandRepository errandRepo) => _errandRepo = errandRepo;

    public async Task<(IReadOnlyList<ErrandDto> Errands, int TotalCount)> Handle(GetMyErrandsQuery query, CancellationToken cancellationToken)
    {
        var errands = await _errandRepo.GetByCustomerIdAsync(query.CustomerId, query.Page, query.PageSize, cancellationToken);
        var totalCount = await _errandRepo.GetCountByCustomerIdAsync(query.CustomerId, cancellationToken);

        var dtos = errands.Select(e => new ErrandDto(
            e.Id, e.CustomerId, "", e.RiderId, e.Rider?.FullName,
            e.Category, e.Status, e.Description, e.SpecialInstructions,
            e.Priority, e.ScheduledAt, e.PickupAddress, e.PickupLatitude, e.PickupLongitude,
            e.DropoffAddress, e.DropoffLatitude, e.DropoffLongitude,
            e.EstimatedDistance, e.EstimatedDuration, e.PackageSize, e.PackageWeight,
            e.IsFragile, e.RequiresPhotoProof, e.RecipientName, e.RecipientPhone,
            e.TotalAmount, e.AcceptedAt, e.PickedUpAt, e.DeliveredAt, e.CancelledAt,
            e.CancellationReason, e.CreatedAt, null, null
        )).ToList();

        return (dtos, totalCount);
    }
}
