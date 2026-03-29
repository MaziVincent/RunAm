using RunAm.Shared.DTOs.Vendors;

namespace RunAm.Application.Common.Interfaces;

public interface IVendorAnalyticsService
{
    Task<VendorAnalyticsDto> GetAnalyticsAsync(Guid vendorId, CancellationToken ct = default);
}
