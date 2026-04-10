using RunAm.Domain.Entities;

namespace RunAm.Domain.Interfaces;

public interface IRiderPayoutProcessingService
{
    Task<RiderPayout> ProcessAsync(RiderPayout payout, CancellationToken ct = default);
    Task<int> ProcessOutstandingAsync(CancellationToken ct = default);
}