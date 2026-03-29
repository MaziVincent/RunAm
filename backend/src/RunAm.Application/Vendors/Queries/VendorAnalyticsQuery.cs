using MediatR;
using RunAm.Application.Common.Interfaces;
using RunAm.Domain.Interfaces;
using RunAm.Shared.DTOs.Vendors;

namespace RunAm.Application.Vendors.Queries;

public record GetVendorAnalyticsQuery(Guid UserId) : IRequest<VendorAnalyticsDto>;

public class GetVendorAnalyticsQueryHandler : IRequestHandler<GetVendorAnalyticsQuery, VendorAnalyticsDto>
{
    private readonly IVendorRepository _vendorRepo;
    private readonly IVendorAnalyticsService _analyticsService;

    public GetVendorAnalyticsQueryHandler(IVendorRepository vendorRepo, IVendorAnalyticsService analyticsService)
    {
        _vendorRepo = vendorRepo;
        _analyticsService = analyticsService;
    }

    public async Task<VendorAnalyticsDto> Handle(GetVendorAnalyticsQuery query, CancellationToken ct)
    {
        var vendor = await _vendorRepo.GetByUserIdAsync(query.UserId, ct)
            ?? throw new KeyNotFoundException("Vendor profile not found.");

        return await _analyticsService.GetAnalyticsAsync(vendor.Id, ct);
    }
}
