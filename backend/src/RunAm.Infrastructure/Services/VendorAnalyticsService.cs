using Microsoft.EntityFrameworkCore;
using RunAm.Application.Common.Interfaces;
using RunAm.Infrastructure.Persistence;
using RunAm.Shared.DTOs.Vendors;

namespace RunAm.Infrastructure.Services;

public class VendorAnalyticsService : IVendorAnalyticsService
{
    private readonly AppDbContext _db;

    public VendorAnalyticsService(AppDbContext db) => _db = db;

    public async Task<VendorAnalyticsDto> GetAnalyticsAsync(Guid vendorId, CancellationToken ct = default)
    {
        var today = DateTime.UtcNow.Date;
        var weekAgo = today.AddDays(-6);

        var vendorErrands = _db.Errands.Where(e => e.VendorId == vendorId);

        // Today's orders and revenue
        var todayErrands = vendorErrands.Where(e => e.CreatedAt >= today);
        var todayOrders = await todayErrands.CountAsync(ct);
        var todayRevenue = await todayErrands.SumAsync(e => (decimal?)e.TotalAmount, ct) ?? 0m;

        // Pending orders
        var pendingOrders = await vendorErrands
            .Where(e => e.VendorOrderStatus == Domain.Enums.VendorOrderStatus.Received
                     || e.VendorOrderStatus == Domain.Enums.VendorOrderStatus.Confirmed
                     || e.VendorOrderStatus == Domain.Enums.VendorOrderStatus.Preparing)
            .CountAsync(ct);

        // Weekly revenue (last 7 days) – use DateOnly-safe approach for PostgreSQL
        var weeklyRaw = await vendorErrands
            .Where(e => e.CreatedAt >= weekAgo)
            .Select(e => new { e.CreatedAt, e.TotalAmount })
            .ToListAsync(ct);

        var weeklyGrouped = weeklyRaw
            .GroupBy(e => e.CreatedAt.Date)
            .ToDictionary(g => g.Key, g => new { Revenue = g.Sum(e => e.TotalAmount), Orders = g.Count() });

        var weeklyRevenue = Enumerable.Range(0, 7)
            .Select(i => weekAgo.AddDays(i))
            .Select(date =>
            {
                weeklyGrouped.TryGetValue(date, out var day);
                return new DailyRevenueDto(date.ToString("yyyy-MM-dd"), day?.Revenue ?? 0, day?.Orders ?? 0);
            })
            .ToList();

        // Top products (by order count in last 30 days)
        var monthAgo = today.AddDays(-30);
        var topRaw = await _db.OrderItems
            .Where(oi => oi.Errand.VendorId == vendorId && oi.Errand.CreatedAt >= monthAgo)
            .Select(oi => new { oi.ProductId, ProductName = oi.Product.Name, oi.Quantity, oi.TotalPrice })
            .ToListAsync(ct);

        var topProducts = topRaw
            .GroupBy(oi => new { oi.ProductId, oi.ProductName })
            .Select(g => new TopProductDto(
                g.Key.ProductName,
                g.Sum(oi => oi.Quantity),
                g.Sum(oi => oi.TotalPrice)
            ))
            .OrderByDescending(tp => tp.OrderCount)
            .Take(5)
            .ToList();

        return new VendorAnalyticsDto(todayOrders, todayRevenue, weeklyRevenue, topProducts, pendingOrders);
    }
}
