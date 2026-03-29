using System.Text.Json;
using System.Text.Json.Serialization;
using MediatR;
using RunAm.Domain.Entities;
using RunAm.Domain.Enums;
using RunAm.Domain.Exceptions;
using RunAm.Domain.Interfaces;
using RunAm.Shared.Constants;
using RunAm.Shared.DTOs.Errands;

namespace RunAm.Application.Errands.Commands;

public record CreateMarketplaceOrderCommand(Guid CustomerId, CreateMarketplaceOrderRequest Request) : IRequest<ErrandDto>;

public class CreateMarketplaceOrderCommandHandler : IRequestHandler<CreateMarketplaceOrderCommand, ErrandDto>
{
    private readonly IErrandRepository _errandRepo;
    private readonly IVendorRepository _vendorRepo;
    private readonly IProductRepository _productRepo;
    private readonly IOrderItemRepository _orderItemRepo;
    private readonly IUnitOfWork _uow;

    public CreateMarketplaceOrderCommandHandler(
        IErrandRepository errandRepo,
        IVendorRepository vendorRepo,
        IProductRepository productRepo,
        IOrderItemRepository orderItemRepo,
        IUnitOfWork uow)
    {
        _errandRepo = errandRepo;
        _vendorRepo = vendorRepo;
        _productRepo = productRepo;
        _orderItemRepo = orderItemRepo;
        _uow = uow;
    }

    public async Task<ErrandDto> Handle(CreateMarketplaceOrderCommand command, CancellationToken cancellationToken)
    {
        var req = command.Request;

        var vendor = await _vendorRepo.GetByIdAsync(req.VendorId, cancellationToken)
            ?? throw new NotFoundException("Vendor", req.VendorId);

        if (!vendor.IsOpen)
            throw new DomainException("This vendor is currently closed.");

        if (req.Items == null || req.Items.Count == 0)
            throw new DomainException("At least one item is required.");

        // Build order items and calculate totals
        var orderItems = new List<OrderItem>();
        decimal itemsTotal = 0;

        foreach (var item in req.Items)
        {
            var product = await _productRepo.GetByIdAsync(item.ProductId, cancellationToken)
                ?? throw new NotFoundException("Product", item.ProductId);

            if (product.VendorId != vendor.Id)
                throw new DomainException($"Product '{product.Name}' does not belong to this vendor.");

            if (!product.IsAvailable || !product.IsActive)
                throw new DomainException($"Product '{product.Name}' is currently unavailable.");

            if (item.Quantity <= 0)
                throw new DomainException("Item quantity must be at least 1.");

            var unitPrice = product.Price;

            // Apply variant price adjustments (frontend sends array of selected variants)
            if (!string.IsNullOrEmpty(item.SelectedVariantJson))
            {
                try
                {
                    var variants = JsonSerializer.Deserialize<List<SelectedVariantData>>(item.SelectedVariantJson, _jsonOptions);
                    if (variants != null)
                    {
                        foreach (var variant in variants)
                        {
                            if (variant?.Option != null)
                                unitPrice += variant.Option.PriceAdjustment;
                        }
                    }
                }
                catch { /* ignore malformed variant JSON */ }
            }

            // Apply extras price adjustments
            if (!string.IsNullOrEmpty(item.SelectedExtrasJson))
            {
                try
                {
                    var extras = JsonSerializer.Deserialize<List<SelectedExtraData>>(item.SelectedExtrasJson, _jsonOptions);
                    if (extras != null)
                    {
                        foreach (var extra in extras)
                        {
                            if (extra?.Extra != null && extra.Quantity > 0)
                                unitPrice += extra.Extra.Price * extra.Quantity;
                        }
                    }
                }
                catch { /* ignore malformed extras JSON */ }
            }

            var totalPrice = unitPrice * item.Quantity;
            itemsTotal += totalPrice;

            orderItems.Add(new OrderItem
            {
                ProductId = product.Id,
                Quantity = item.Quantity,
                UnitPrice = unitPrice,
                TotalPrice = totalPrice,
                Notes = item.Notes,
                SelectedVariantJson = item.SelectedVariantJson,
                SelectedExtrasJson = item.SelectedExtrasJson,
                Status = OrderItemStatus.Pending
            });
        }

        if (itemsTotal < vendor.MinimumOrderAmount)
            throw new DomainException($"Minimum order amount is ₦{vendor.MinimumOrderAmount:N0}.");

        // Calculate delivery fee based on distance
        var distanceKm = CalculateDistance(
            vendor.Latitude, vendor.Longitude,
            req.DropoffLatitude, req.DropoffLongitude);
        var deliveryFee = vendor.DeliveryFee > 0 ? vendor.DeliveryFee : (decimal)distanceKm * AppConstants.Pricing.PerKmRate + AppConstants.Pricing.BaseFare;
        var totalAmount = itemsTotal + deliveryFee;
        var commission = totalAmount * AppConstants.Pricing.CommissionRate;

        var errand = new Errand
        {
            CustomerId = command.CustomerId,
            VendorId = vendor.Id,
            Category = ErrandCategory.FoodDelivery, // Default for marketplace
            Status = ErrandStatus.Pending,
            VendorOrderStatus = VendorOrderStatus.Received,
            Description = $"Order from {vendor.BusinessName}",
            SpecialInstructions = req.SpecialInstructions,
            Priority = ErrandPriority.Standard,
            PickupAddress = vendor.Address,
            PickupLatitude = vendor.Latitude,
            PickupLongitude = vendor.Longitude,
            DropoffAddress = req.DropoffAddress,
            DropoffLatitude = req.DropoffLatitude,
            DropoffLongitude = req.DropoffLongitude,
            RecipientName = req.RecipientName,
            RecipientPhone = req.RecipientPhone,
            EstimatedDistance = distanceKm * 1000,
            EstimatedDuration = (int)Math.Ceiling(distanceKm * 3) * 60,
            TotalAmount = totalAmount,
            CommissionAmount = commission,
        };

        errand.StatusHistory.Add(new ErrandStatusHistory
        {
            ErrandId = errand.Id,
            Status = ErrandStatus.Pending,
            Notes = "Marketplace order placed"
        });

        // Link order items to errand
        foreach (var oi in orderItems)
            oi.ErrandId = errand.Id;

        await _errandRepo.AddAsync(errand, cancellationToken);
        await _orderItemRepo.AddRangeAsync(orderItems, cancellationToken);
        await _uow.SaveChangesAsync(cancellationToken);

        return MapToDto(errand);
    }

    private static ErrandDto MapToDto(Errand e) => new(
        e.Id, e.CustomerId, "", e.RiderId, null, e.Category, e.Status,
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

    private static double CalculateDistance(double lat1, double lon1, double lat2, double lon2)
    {
        const double R = 6371;
        var dLat = (lat2 - lat1) * Math.PI / 180;
        var dLon = (lon2 - lon1) * Math.PI / 180;
        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(lat1 * Math.PI / 180) * Math.Cos(lat2 * Math.PI / 180) *
                Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        return R * c;
    }

    private static readonly JsonSerializerOptions _jsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    // Models for deserializing frontend variant/extras JSON
    private record SelectedVariantData(string Name, SelectedVariantOptionData? Option);
    private record SelectedVariantOptionData(string Label, decimal PriceAdjustment);
    private record SelectedExtraData(SelectedExtraInfo? Extra, int Quantity);
    private record SelectedExtraInfo(string Name, decimal Price);
}
