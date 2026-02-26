using MediatR;
using RunAm.Domain.Enums;
using RunAm.Domain.Interfaces;
using RunAm.Shared.DTOs.Vendors;

namespace RunAm.Application.Vendors.Commands;

// ─── Confirm Vendor Order ───────────────────────────────────

public record ConfirmVendorOrderCommand(Guid UserId, Guid ErrandId) : IRequest<VendorOrderDto>;

public class ConfirmVendorOrderCommandHandler : IRequestHandler<ConfirmVendorOrderCommand, VendorOrderDto>
{
    private readonly IVendorRepository _vendorRepo;
    private readonly IErrandRepository _errandRepo;
    private readonly IOrderItemRepository _orderItemRepo;
    private readonly IUnitOfWork _uow;

    public ConfirmVendorOrderCommandHandler(IVendorRepository vendorRepo, IErrandRepository errandRepo, IOrderItemRepository orderItemRepo, IUnitOfWork uow)
    {
        _vendorRepo = vendorRepo;
        _errandRepo = errandRepo;
        _orderItemRepo = orderItemRepo;
        _uow = uow;
    }

    public async Task<VendorOrderDto> Handle(ConfirmVendorOrderCommand command, CancellationToken ct)
    {
        var vendor = await _vendorRepo.GetByUserIdAsync(command.UserId, ct)
            ?? throw new KeyNotFoundException("Vendor profile not found.");

        var errand = await _errandRepo.GetByIdWithDetailsAsync(command.ErrandId, ct)
            ?? throw new KeyNotFoundException($"Errand {command.ErrandId} not found.");

        if (errand.VendorId != vendor.Id)
            throw new UnauthorizedAccessException("This order doesn't belong to your vendor.");

        if (errand.VendorOrderStatus != VendorOrderStatus.Received)
            throw new InvalidOperationException($"Cannot confirm order in status {errand.VendorOrderStatus}.");

        errand.VendorOrderStatus = VendorOrderStatus.Confirmed;
        await _errandRepo.UpdateAsync(errand, ct);
        await _uow.SaveChangesAsync(ct);

        var items = await _orderItemRepo.GetByErrandIdAsync(errand.Id, ct);
        return new VendorOrderDto(
            errand.Id, errand.Customer?.FullName, errand.DropoffAddress,
            errand.VendorOrderStatus?.ToString(), errand.TotalAmount,
            items.Select(oi => new OrderItemDto(
                oi.Id, oi.ProductId, oi.Product?.Name ?? "", oi.Quantity,
                oi.UnitPrice, oi.TotalPrice, oi.Notes,
                oi.SelectedVariantJson, oi.SelectedExtrasJson,
                oi.Status.ToString()
            )).ToList(),
            errand.CreatedAt
        );
    }
}

// ─── Mark Vendor Order Ready for Pickup ─────────────────────

public record MarkOrderReadyCommand(Guid UserId, Guid ErrandId) : IRequest<VendorOrderDto>;

public class MarkOrderReadyCommandHandler : IRequestHandler<MarkOrderReadyCommand, VendorOrderDto>
{
    private readonly IVendorRepository _vendorRepo;
    private readonly IErrandRepository _errandRepo;
    private readonly IOrderItemRepository _orderItemRepo;
    private readonly IUnitOfWork _uow;

    public MarkOrderReadyCommandHandler(IVendorRepository vendorRepo, IErrandRepository errandRepo, IOrderItemRepository orderItemRepo, IUnitOfWork uow)
    {
        _vendorRepo = vendorRepo;
        _errandRepo = errandRepo;
        _orderItemRepo = orderItemRepo;
        _uow = uow;
    }

    public async Task<VendorOrderDto> Handle(MarkOrderReadyCommand command, CancellationToken ct)
    {
        var vendor = await _vendorRepo.GetByUserIdAsync(command.UserId, ct)
            ?? throw new KeyNotFoundException("Vendor profile not found.");

        var errand = await _errandRepo.GetByIdWithDetailsAsync(command.ErrandId, ct)
            ?? throw new KeyNotFoundException($"Errand {command.ErrandId} not found.");

        if (errand.VendorId != vendor.Id)
            throw new UnauthorizedAccessException("This order doesn't belong to your vendor.");

        if (errand.VendorOrderStatus is not (VendorOrderStatus.Confirmed or VendorOrderStatus.Preparing))
            throw new InvalidOperationException($"Cannot mark order as ready in status {errand.VendorOrderStatus}.");

        errand.VendorOrderStatus = VendorOrderStatus.ReadyForPickup;
        await _errandRepo.UpdateAsync(errand, ct);
        await _uow.SaveChangesAsync(ct);

        var items = await _orderItemRepo.GetByErrandIdAsync(errand.Id, ct);
        return new VendorOrderDto(
            errand.Id, errand.Customer?.FullName, errand.DropoffAddress,
            errand.VendorOrderStatus?.ToString(), errand.TotalAmount,
            items.Select(oi => new OrderItemDto(
                oi.Id, oi.ProductId, oi.Product?.Name ?? "", oi.Quantity,
                oi.UnitPrice, oi.TotalPrice, oi.Notes,
                oi.SelectedVariantJson, oi.SelectedExtrasJson,
                oi.Status.ToString()
            )).ToList(),
            errand.CreatedAt
        );
    }
}
