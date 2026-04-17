using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using RunAm.Domain.Interfaces;

namespace RunAm.Infrastructure.Services;

public class RiderPayoutReconciliationWorker : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<RiderPayoutReconciliationWorker> _logger;

    public RiderPayoutReconciliationWorker(
        IServiceScopeFactory scopeFactory,
        ILogger<RiderPayoutReconciliationWorker> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromMinutes(5));

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var processor = scope.ServiceProvider.GetRequiredService<IRiderPayoutProcessingService>();
                var processed = await processor.ProcessOutstandingAsync(stoppingToken);

                if (processed > 0)
                {
                    _logger.LogInformation("Rider payout reconciliation processed {Count} payout(s)", processed);
                }
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Rider payout reconciliation cycle failed");
            }

            await timer.WaitForNextTickAsync(stoppingToken);
        }
    }
}