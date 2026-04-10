using Microsoft.EntityFrameworkCore;
using RunAm.Domain.Entities;
using RunAm.Domain.Enums;
using RunAm.Domain.Interfaces;

namespace RunAm.Infrastructure.Persistence.Repositories;

public class PaymentRepository : IPaymentRepository
{
    private readonly AppDbContext _db;

    public PaymentRepository(AppDbContext db) => _db = db;

    public async Task<Payment?> GetByIdAsync(Guid id, CancellationToken ct = default)
        => await _db.Payments.FirstOrDefaultAsync(p => p.Id == id, ct);

    public async Task<Payment?> GetByErrandIdAsync(Guid errandId, CancellationToken ct = default)
        => await _db.Payments
            .Where(p => p.ErrandId == errandId)
            .OrderByDescending(p => p.CreatedAt)
            .FirstOrDefaultAsync(ct);

    public async Task<Payment?> GetByPaymentGatewayRefAsync(string paymentGatewayRef, CancellationToken ct = default)
        => await _db.Payments
            .FirstOrDefaultAsync(p => p.PaymentGatewayRef == paymentGatewayRef, ct);

    public async Task AddAsync(Payment payment, CancellationToken ct = default)
        => await _db.Payments.AddAsync(payment, ct);

    public Task UpdateAsync(Payment payment, CancellationToken ct = default)
    {
        _db.Payments.Update(payment);
        return Task.CompletedTask;
    }
}

public class PromoCodeRepository : IPromoCodeRepository
{
    private readonly AppDbContext _db;

    public PromoCodeRepository(AppDbContext db) => _db = db;

    public async Task<PromoCode?> GetByCodeAsync(string code, CancellationToken ct = default)
        => await _db.PromoCodes.FirstOrDefaultAsync(p => p.Code == code.ToUpperInvariant(), ct);

    public async Task<PromoCode?> GetByIdAsync(Guid id, CancellationToken ct = default)
        => await _db.PromoCodes.FirstOrDefaultAsync(p => p.Id == id, ct);

    public async Task<IReadOnlyList<PromoCode>> GetAllAsync(int page, int pageSize, CancellationToken ct = default)
        => await _db.PromoCodes
            .OrderByDescending(p => p.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

    public async Task<IReadOnlyList<PromoCode>> GetActiveAsync(CancellationToken ct = default)
        => await _db.PromoCodes
            .Where(p => p.IsActive && (p.ExpiresAt == null || p.ExpiresAt > DateTime.UtcNow))
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync(ct);

    public async Task AddAsync(PromoCode promoCode, CancellationToken ct = default)
        => await _db.PromoCodes.AddAsync(promoCode, ct);

    public Task UpdateAsync(PromoCode promoCode, CancellationToken ct = default)
    {
        _db.PromoCodes.Update(promoCode);
        return Task.CompletedTask;
    }
}

public class RiderPayoutRepository : IRiderPayoutRepository
{
    private readonly AppDbContext _db;

    public RiderPayoutRepository(AppDbContext db) => _db = db;

    public async Task<RiderPayout?> GetByIdAsync(Guid payoutId, CancellationToken ct = default)
        => await _db.RiderPayouts
            .Include(p => p.Rider)
            .ThenInclude(r => r.RiderProfile)
            .FirstOrDefaultAsync(p => p.Id == payoutId, ct);

    public async Task<IReadOnlyList<RiderPayout>> GetByRiderIdAsync(Guid riderId, int page, int pageSize, CancellationToken ct = default)
        => await _db.RiderPayouts
            .Where(p => p.RiderId == riderId)
            .OrderByDescending(p => p.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

    public async Task<int> GetCountByRiderIdAsync(Guid riderId, CancellationToken ct = default)
        => await _db.RiderPayouts.CountAsync(p => p.RiderId == riderId, ct);

    public async Task<IReadOnlyList<RiderPayout>> GetPendingAsync(CancellationToken ct = default)
        => await _db.RiderPayouts
            .Include(p => p.Rider)
            .ThenInclude(r => r.RiderProfile)
            .Where(p => p.Status == PayoutStatus.Pending)
            .OrderBy(p => p.CreatedAt)
            .ToListAsync(ct);

    public async Task<IReadOnlyList<RiderPayout>> GetOutstandingAsync(CancellationToken ct = default)
        => await _db.RiderPayouts
            .Include(p => p.Rider)
            .ThenInclude(r => r.RiderProfile)
            .Where(p => p.Status == PayoutStatus.Pending || p.Status == PayoutStatus.Processing)
            .OrderBy(p => p.CreatedAt)
            .ToListAsync(ct);

    public async Task AddAsync(RiderPayout payout, CancellationToken ct = default)
        => await _db.RiderPayouts.AddAsync(payout, ct);

    public Task UpdateAsync(RiderPayout payout, CancellationToken ct = default)
    {
        _db.RiderPayouts.Update(payout);
        return Task.CompletedTask;
    }
}
