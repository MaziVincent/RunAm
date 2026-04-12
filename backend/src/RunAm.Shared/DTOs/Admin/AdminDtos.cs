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
    decimal CommissionEarned
);

public record AssignRiderRequest(Guid RiderId);
