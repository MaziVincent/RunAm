namespace RunAm.Shared.DTOs.Vendors;

// ─── Service Categories ─────────────────────────────────────

public record ServiceCategoryDto(
    Guid Id,
    string Name,
    string Slug,
    string? Description,
    string? IconUrl,
    int SortOrder,
    bool IsActive,
    bool RequiresVendor,
    int VendorCount
);

public record CreateServiceCategoryRequest(
    string Name,
    string? Description,
    string? IconUrl,
    int SortOrder,
    bool RequiresVendor
);

public record UpdateServiceCategoryRequest(
    string Name,
    string? Description,
    string? IconUrl,
    int SortOrder,
    bool IsActive,
    bool RequiresVendor
);

// ─── Vendors ────────────────────────────────────────────────

public record VendorDto(
    Guid Id,
    Guid UserId,
    string BusinessName,
    string? Description,
    string? LogoUrl,
    string? BannerUrl,
    string? PhoneNumber,
    string Address,
    double Latitude,
    double Longitude,
    string? OperatingHours,
    bool IsOpen,
    bool IsActive,
    decimal MinimumOrderAmount,
    decimal DeliveryFee,
    int EstimatedPrepTimeMinutes,
    double Rating,
    int TotalReviews,
    int TotalOrders,
    string Status,
    List<ServiceCategorySlimDto> ServiceCategories,
    DateTime CreatedAt
);

public record VendorDetailDto(
    Guid Id,
    Guid UserId,
    string BusinessName,
    string? Description,
    string? LogoUrl,
    string? BannerUrl,
    string? PhoneNumber,
    string Address,
    double Latitude,
    double Longitude,
    string? OperatingHours,
    bool IsOpen,
    bool IsActive,
    decimal MinimumOrderAmount,
    decimal DeliveryFee,
    int EstimatedPrepTimeMinutes,
    double Rating,
    int TotalReviews,
    int TotalOrders,
    string Status,
    List<ServiceCategorySlimDto> ServiceCategories,
    List<ProductCategoryWithProductsDto> ProductCategories,
    DateTime CreatedAt
);

public record ServiceCategorySlimDto(Guid Id, string Name, string Slug);

public record CreateVendorRequest(
    string BusinessName,
    string? BusinessDescription,
    string? LogoUrl,
    string Address,
    double Latitude,
    double Longitude,
    string? OperatingHours,
    decimal MinimumOrderAmount,
    decimal DeliveryFee,
    int EstimatedPrepTimeMinutes,
    List<Guid> ServiceCategoryIds
);

public record UpdateVendorRequest(
    string? BusinessName = null,
    string? Description = null,
    string? PhoneNumber = null,
    string? Address = null,
    double? Latitude = null,
    double? Longitude = null,
    string? OperatingHours = null,
    decimal? MinimumOrderAmount = null,
    decimal? DeliveryFee = null,
    int? EstimatedPrepTimeMinutes = null,
    string? LogoUrl = null,
    string? BannerUrl = null,
    List<Guid>? ServiceCategoryIds = null
);

public record UpdateVendorStatusRequest(bool IsOpen);

// ─── Product Categories ─────────────────────────────────────

public record ProductCategoryDto(
    Guid Id,
    Guid VendorId,
    string Name,
    string? Description,
    string? ImageUrl,
    int SortOrder,
    bool IsActive
);

public record ProductCategoryWithProductsDto(
    Guid Id,
    string Name,
    string? Description,
    string? ImageUrl,
    int SortOrder,
    List<ProductDto> Products
);

public record CreateProductCategoryRequest(
    string Name,
    string? Description,
    string? ImageUrl,
    int SortOrder
);

public record UpdateProductCategoryRequest(
    string Name,
    string? Description,
    string? ImageUrl,
    int SortOrder,
    bool IsActive
);

// ─── Products ───────────────────────────────────────────────

public record ProductDto(
    Guid Id,
    Guid VendorId,
    Guid ProductCategoryId,
    string ProductCategoryName,
    string Name,
    string? Description,
    decimal Price,
    decimal? CompareAtPrice,
    string? ImageUrl,
    bool IsAvailable,
    bool IsActive,
    int SortOrder,
    string? VariantsJson,
    string? ExtrasJson
);

public record CreateProductRequest(
    Guid ProductCategoryId,
    string Name,
    string? Description,
    decimal Price,
    decimal? CompareAtPrice,
    string? ImageUrl,
    int SortOrder,
    string? VariantsJson,
    string? ExtrasJson
);

public record UpdateProductRequest(
    Guid ProductCategoryId,
    string Name,
    string? Description,
    decimal Price,
    decimal? CompareAtPrice,
    string? ImageUrl,
    int SortOrder,
    bool IsAvailable,
    string? VariantsJson,
    string? ExtrasJson
);

public record ToggleProductAvailabilityRequest(bool IsAvailable);

public record ToggleProductActiveRequest(bool IsActive);

public record UpdateVendorCategoriesRequest(List<Guid> ServiceCategoryIds);

// ─── Order Items ────────────────────────────────────────────

public record OrderItemDto(
    Guid Id,
    Guid ProductId,
    string ProductName,
    int Quantity,
    decimal UnitPrice,
    decimal TotalPrice,
    string? Notes,
    string? SelectedVariantJson,
    string? SelectedExtrasJson,
    string Status
);

public record CreateOrderItemRequest(
    Guid ProductId,
    int Quantity,
    string? Notes,
    string? SelectedVariantJson,
    string? SelectedExtrasJson
);

// ─── Vendor Orders ──────────────────────────────────────────

public record VendorOrderDto(
    Guid ErrandId,
    string? CustomerName,
    string DropoffAddress,
    string? VendorOrderStatus,
    decimal TotalAmount,
    List<OrderItemDto> Items,
    DateTime CreatedAt
);

public record ConfirmVendorOrderRequest(string? Notes);

// ─── Vendor Analytics ───────────────────────────────────────

public record VendorAnalyticsDto(
    int TodayOrders,
    decimal TodayRevenue,
    List<DailyRevenueDto> WeeklyRevenue,
    List<TopProductDto> TopProducts,
    int PendingOrders
);

public record DailyRevenueDto(string Date, decimal Revenue, int Orders);
public record TopProductDto(string ProductName, int OrderCount, decimal Revenue);
