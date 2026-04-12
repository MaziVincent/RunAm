namespace RunAm.Shared.DTOs;

public record DashboardStatsDto(
    int TotalUsers,
    int ActiveRiders,
    int TodaysErrands,
    decimal Revenue,
    int TotalVendors,
    int PendingVendors
);

public record FinanceStatsDto(
    decimal TotalRevenue,
    decimal CommissionEarned,
    decimal PendingPayments,
    decimal TodayRevenue,
    int TotalTransactions
);

public record AssignRiderRequest(Guid RiderId);

public record AdminPaymentDto(
    Guid Id,
    Guid ErrandId,
    string PayerName,
    decimal Amount,
    string Currency,
    int PaymentMethod,
    string? PaymentGatewayRef,
    int Status,
    DateTime CreatedAt
);

public record AdminPaymentDetailDto(
    Guid Id,
    Guid ErrandId,
    Guid PayerId,
    string PayerName,
    string PayerEmail,
    decimal Amount,
    string Currency,
    int PaymentMethod,
    string? PaymentGatewayRef,
    int Status,
    DateTime CreatedAt,
    // Errand info
    string? ErrandDescription,
    int ErrandStatus,
    string? PickupAddress,
    string? DropoffAddress,
    string? RiderName,
    decimal? ErrandTotalAmount,
    decimal? CommissionAmount
);
