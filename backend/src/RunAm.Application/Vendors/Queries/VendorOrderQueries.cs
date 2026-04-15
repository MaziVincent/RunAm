using MediatR;
using RunAm.Domain.Entities;
using RunAm.Domain.Enums;
using RunAm.Domain.Exceptions;
using RunAm.Domain.Interfaces;
using RunAm.Shared.DTOs.Errands;
using RunAm.Shared.DTOs.Vendors;

namespace RunAm.Application.Vendors.Queries;

// ─── Get Vendor Orders (Merchant) ───────────────────────────

public record GetVendorOrdersQuery(Guid UserId, int Page = 1, int PageSize = 20, string? Status = null) : IRequest<(IReadOnlyList<VendorOrderDto> Orders, int TotalCount)>;

public class GetVendorOrdersQueryHandler : IRequestHandler<GetVendorOrdersQuery, (IReadOnlyList<VendorOrderDto> Orders, int TotalCount)>
{
    private readonly IVendorRepository _vendorRepo;
    private readonly IErrandRepository _errandRepo;
    private readonly IOrderItemRepository _orderItemRepo;

    public GetVendorOrdersQueryHandler(IVendorRepository vendorRepo, IErrandRepository errandRepo, IOrderItemRepository orderItemRepo)
    {
        _vendorRepo = vendorRepo;
        _errandRepo = errandRepo;
        _orderItemRepo = orderItemRepo;
    }

    public async Task<(IReadOnlyList<VendorOrderDto> Orders, int TotalCount)> Handle(GetVendorOrdersQuery query, CancellationToken ct)
    {
        var vendor = await _vendorRepo.GetByUserIdAsync(query.UserId, ct)
            ?? throw new KeyNotFoundException("Vendor profile not found.");

        var errands = await _errandRepo.GetByVendorIdAsync(vendor.Id, query.Page, query.PageSize, query.Status, ct);
        var totalCount = await _errandRepo.GetCountByVendorIdAsync(vendor.Id, query.Status, ct);

        var dtos = new List<VendorOrderDto>();
        foreach (var errand in errands)
        {
            var items = await _orderItemRepo.GetByErrandIdAsync(errand.Id, ct);
            dtos.Add(new VendorOrderDto(
                errand.Id,
                errand.Customer?.FullName,
                errand.DropoffAddress,
                errand.VendorOrderStatus?.ToString(),
                errand.TotalAmount,
                items.Select(oi => new OrderItemDto(
                    oi.Id, oi.ProductId, oi.Product?.Name ?? "", oi.Quantity,
                    oi.UnitPrice, oi.TotalPrice, oi.Notes,
                    oi.SelectedVariantJson, oi.SelectedExtrasJson,
                    oi.Status.ToString()
                )).ToList(),
                errand.CreatedAt
            ));
        }

        return (dtos, totalCount);
    }
}

public record GetVendorOrderDetailQuery(Guid UserId, Guid ErrandId) : IRequest<ErrandDto>;

public class GetVendorOrderDetailQueryHandler : IRequestHandler<GetVendorOrderDetailQuery, ErrandDto>
{
    private readonly IVendorRepository _vendorRepo;
    private readonly IErrandRepository _errandRepo;

    public GetVendorOrderDetailQueryHandler(IVendorRepository vendorRepo, IErrandRepository errandRepo)
    {
        _vendorRepo = vendorRepo;
        _errandRepo = errandRepo;
    }

    public async Task<ErrandDto> Handle(GetVendorOrderDetailQuery query, CancellationToken ct)
    {
        var vendor = await _vendorRepo.GetByUserIdAsync(query.UserId, ct)
            ?? throw new KeyNotFoundException("Vendor profile not found.");

        var errand = await _errandRepo.GetByIdWithDetailsAsync(query.ErrandId, ct)
            ?? throw new NotFoundException("Errand", query.ErrandId);

        if (errand.VendorId != vendor.Id)
            throw new UnauthorizedAccessException("This order doesn't belong to your vendor.");

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
            errand.Stops.Select(s => new ErrandStopDto(s.Id, s.StopOrder, s.Address, s.Latitude, s.Longitude, s.ContactName, s.ContactPhone, s.Instructions, s.Status, s.ArrivedAt, s.CompletedAt)).ToList(),
            errand.VendorId, errand.Vendor?.BusinessName, errand.VendorOrderStatus != null ? (int)errand.VendorOrderStatus : null
        );
    }
}
