using RunAm.Domain.Enums;

namespace RunAm.Shared.DTOs.Payments;

// ── Wallet ──────────────────────────────────────

public record WalletDto(
    Guid Id,
    decimal Balance,
    string Currency
);

public record WalletTransactionDto(
    Guid Id,
    TransactionType Type,
    decimal Amount,
    decimal BalanceAfter,
    TransactionSource Source,
    Guid? ReferenceId,
    string? Description,
    DateTime CreatedAt
);

public record TopUpWalletRequest(
    decimal Amount,
    PaymentMethod PaymentMethod,
    string? PaymentReference
);

public record WithdrawRequest(
    decimal Amount,
    string BankCode,
    string AccountNumber,
    string AccountName
);

// ── Payment ─────────────────────────────────────

public record PaymentDto(
    Guid Id,
    Guid ErrandId,
    Guid PayerId,
    decimal Amount,
    string Currency,
    PaymentMethod PaymentMethod,
    string? PaymentGatewayRef,
    PaymentStatus Status,
    DateTime CreatedAt
);

public record ProcessPaymentRequest(
    Guid ErrandId,
    PaymentMethod PaymentMethod,
    string? PaymentReference
);

// ── Promo Code ──────────────────────────────────

public record PromoCodeDto(
    Guid Id,
    string Code,
    DiscountType DiscountType,
    decimal DiscountValue,
    decimal? MaxDiscount,
    decimal? MinOrderAmount,
    int UsageLimit,
    int UsedCount,
    DateTime? ExpiresAt,
    bool IsActive,
    DateTime CreatedAt
);

public record CreatePromoCodeRequest(
    string Code,
    DiscountType DiscountType,
    decimal DiscountValue,
    decimal? MaxDiscount,
    decimal? MinOrderAmount,
    int UsageLimit,
    DateTime? ExpiresAt
);

public record ValidatePromoCodeRequest(
    string Code,
    decimal OrderAmount
);

public record PromoCodeValidationResult(
    bool IsValid,
    string? Message,
    decimal DiscountAmount,
    PromoCodeDto? PromoCode
);

// ── Rider Earnings ──────────────────────────────

public record EarningsSummaryDto(
    decimal TodayEarnings,
    decimal WeekEarnings,
    decimal MonthEarnings,
    decimal TotalEarnings,
    int TodayTrips,
    int WeekTrips,
    decimal AvailableBalance
);

public record RiderPayoutDto(
    Guid Id,
    decimal Amount,
    string Currency,
    PayoutStatus Status,
    string? PaymentReference,
    string? FailureReason,
    DateTime? ProcessedAt,
    DateTime PeriodStart,
    DateTime PeriodEnd,
    int ErrandCount,
    DateTime CreatedAt
);

// ── Tip ─────────────────────────────────────────

public record TipRequest(decimal Amount);

// ── Monnify ─────────────────────────────────────

public record ReserveAccountRequest(string AccountName, string Email);

// ── Finance Dashboard ───────────────────────────

public record FinanceOverviewDto(
    decimal TotalRevenue,
    decimal TotalCommission,
    decimal TotalPayouts,
    decimal PendingPayouts,
    int TotalTransactions,
    int TodayTransactions,
    List<DailyRevenueDto> RevenueChart
);

public record DailyRevenueDto(
    DateTime Date,
    decimal Revenue,
    decimal Commission,
    int ErrandCount
);
