using RunAm.Domain.Entities;

namespace RunAm.Domain.Interfaces;

public interface IPaymentRepository
{
    Task<Payment?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<Payment?> GetByErrandIdAsync(Guid errandId, CancellationToken ct = default);
    Task AddAsync(Payment payment, CancellationToken ct = default);
    Task UpdateAsync(Payment payment, CancellationToken ct = default);
}

public interface IPromoCodeRepository
{
    Task<PromoCode?> GetByCodeAsync(string code, CancellationToken ct = default);
    Task<PromoCode?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<PromoCode>> GetAllAsync(int page, int pageSize, CancellationToken ct = default);
    Task<IReadOnlyList<PromoCode>> GetActiveAsync(CancellationToken ct = default);
    Task AddAsync(PromoCode promoCode, CancellationToken ct = default);
    Task UpdateAsync(PromoCode promoCode, CancellationToken ct = default);
}

public interface IRiderPayoutRepository
{
    Task<IReadOnlyList<RiderPayout>> GetByRiderIdAsync(Guid riderId, int page, int pageSize, CancellationToken ct = default);
    Task<IReadOnlyList<RiderPayout>> GetPendingAsync(CancellationToken ct = default);
    Task AddAsync(RiderPayout payout, CancellationToken ct = default);
    Task UpdateAsync(RiderPayout payout, CancellationToken ct = default);
}
