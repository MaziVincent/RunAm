using System.Text.Json;
using System.Text.Json.Serialization;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using RunAm.Domain.Entities;
using RunAm.Domain.Enums;
using RunAm.Domain.Exceptions;
using RunAm.Domain.Interfaces;
using RunAm.Shared.Constants;
using RunAm.Shared.DTOs.Errands;

namespace RunAm.Application.Errands.Commands;

public record CreateMarketplaceOrderCommand(Guid CustomerId, CreateMarketplaceOrderRequest Request) : IRequest<MarketplaceOrderResult>;

public class CreateMarketplaceOrderCommandHandler : IRequestHandler<CreateMarketplaceOrderCommand, MarketplaceOrderResult>
{
    private readonly IErrandRepository _errandRepo;
    private readonly IVendorRepository _vendorRepo;
    private readonly IProductRepository _productRepo;
    private readonly IOrderItemRepository _orderItemRepo;
    private readonly IPromoCodeRepository _promoRepo;
    private readonly IWalletRepository _walletRepo;
    private readonly IPaymentRepository _paymentRepo;
    private readonly IMonnifyService _monnify;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IConfiguration _config;
    private readonly IUnitOfWork _uow;

    public CreateMarketplaceOrderCommandHandler(
        IErrandRepository errandRepo,
        IVendorRepository vendorRepo,
        IProductRepository productRepo,
        IOrderItemRepository orderItemRepo,
        IPromoCodeRepository promoRepo,
        IWalletRepository walletRepo,
        IPaymentRepository paymentRepo,
        IMonnifyService monnify,
        UserManager<ApplicationUser> userManager,
        IConfiguration config,
        IUnitOfWork uow)
    {
        _errandRepo = errandRepo;
        _vendorRepo = vendorRepo;
        _productRepo = productRepo;
        _orderItemRepo = orderItemRepo;
        _promoRepo = promoRepo;
        _walletRepo = walletRepo;
        _paymentRepo = paymentRepo;
        _monnify = monnify;
        _userManager = userManager;
        _config = config;
        _uow = uow;
    }

    public async Task<MarketplaceOrderResult> Handle(CreateMarketplaceOrderCommand command, CancellationToken cancellationToken)
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
        var preDiscountTotal = itemsTotal + deliveryFee;
        var discountAmount = 0m;

        PromoCode? promoCode = null;
        if (!string.IsNullOrWhiteSpace(req.PromoCode))
        {
            promoCode = await _promoRepo.GetByCodeAsync(req.PromoCode, cancellationToken)
                ?? throw new DomainException("Promo code not found.");

            if (!promoCode.IsValid())
                throw new DomainException("Promo code is expired or has reached its usage limit.");

            discountAmount = promoCode.CalculateDiscount(preDiscountTotal);
            if (discountAmount <= 0)
                throw new DomainException("Promo code is not valid for this order.");
        }

        var totalAmount = preDiscountTotal - discountAmount;
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
            ScheduledAt = req.ScheduledAt,
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

        string? checkoutUrl = null;

        var payment = new Payment
        {
            ErrandId = errand.Id,
            PayerId = command.CustomerId,
            Amount = totalAmount,
            PaymentMethod = req.PaymentMethod,
            Status = PaymentStatus.Pending
        };

        if (req.PaymentMethod == PaymentMethod.Wallet)
        {
            var wallet = await _walletRepo.GetByUserIdAsync(command.CustomerId, cancellationToken)
                ?? throw new NotFoundException("Wallet", command.CustomerId);

            if (!wallet.IsActive)
                throw new DomainException("Create your wallet from the dashboard before paying with wallet.");

            wallet.Debit(totalAmount);
            await _walletRepo.UpdateAsync(wallet, cancellationToken);

            await _walletRepo.AddTransactionAsync(new WalletTransaction
            {
                WalletId = wallet.Id,
                Type = TransactionType.Debit,
                Amount = totalAmount,
                BalanceAfter = wallet.Balance,
                Source = TransactionSource.ErrandPayment,
                ReferenceId = errand.Id,
                Description = $"Marketplace order payment #{errand.Id.ToString()[..8]}"
            }, cancellationToken);

            payment.Status = PaymentStatus.Completed;
        }
        else if (req.PaymentMethod == PaymentMethod.BankTransfer || req.PaymentMethod == PaymentMethod.Card)
        {
            // Initialize Monnify transaction — payment stays Pending until webhook confirms
            var user = await _userManager.FindByIdAsync(command.CustomerId.ToString())
                ?? throw new NotFoundException("User", command.CustomerId);

            var paymentRef = $"ORDER-{errand.Id.ToString()[..8]}-{Guid.NewGuid().ToString()[..4]}".ToUpperInvariant();
            var frontendBaseUrl = _config["Frontend:BaseUrl"] ?? "http://localhost:3000";
            var redirectUrl = $"{frontendBaseUrl}/shop/payment-callback/{errand.Id}";

            var initResult = await _monnify.InitializeTransactionAsync(
                Math.Round(totalAmount, 2),
                user.FullName,
                user.Email!,
                paymentRef,
                $"Order from {vendor.BusinessName}",
                redirectUrl,
                cancellationToken);

            if (!initResult.Success || string.IsNullOrEmpty(initResult.CheckoutUrl))
                throw new DomainException("Failed to initialize payment gateway. Please try again.");

            payment.PaymentGatewayRef = initResult.TransactionReference;
            checkoutUrl = initResult.CheckoutUrl;
        }
        else
        {
            throw new DomainException("Supported payment methods: Wallet, Bank Transfer, or Card.");
        }

        await _errandRepo.AddAsync(errand, cancellationToken);
        await _orderItemRepo.AddRangeAsync(orderItems, cancellationToken);
        await _paymentRepo.AddAsync(payment, cancellationToken);

        if (promoCode is not null)
        {
            promoCode.UsedCount += 1;
            await _promoRepo.UpdateAsync(promoCode, cancellationToken);
        }

        await _uow.SaveChangesAsync(cancellationToken);

        return new MarketplaceOrderResult(MapToDto(errand), checkoutUrl);
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
