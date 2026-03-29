using MediatR;
using RunAm.Domain.Entities;
using RunAm.Domain.Enums;
using RunAm.Domain.Interfaces;
using RunAm.Shared.DTOs.Vendors;

namespace RunAm.Application.Vendors.Queries;

// ─── Get Vendor Orders (Merchant) ───────────────────────────

public record GetVendorOrdersQuery(Guid UserId, int Page = 1, int PageSize = 20) : IRequest<(IReadOnlyList<VendorOrderDto> Orders, int TotalCount)>;

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

        var errands = await _errandRepo.GetByVendorIdAsync(vendor.Id, query.Page, query.PageSize, ct);
        var totalCount = await _errandRepo.GetCountByVendorIdAsync(vendor.Id, ct);

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
