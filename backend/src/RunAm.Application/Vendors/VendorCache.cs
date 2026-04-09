using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using RunAm.Application.Common.Interfaces;
using RunAm.Application.Vendors.Queries;

namespace RunAm.Application.Vendors;

internal static class VendorCache
{
    private const string CatalogVersionKey = "vendors:catalog:version";
    private static readonly TimeSpan VersionTtl = TimeSpan.FromDays(30);

    public static async Task<string> GetCatalogVersionAsync(IAppCache cache, CancellationToken ct)
    {
        var version = await cache.GetAsync<string>(CatalogVersionKey, ct);
        if (!string.IsNullOrWhiteSpace(version))
            return version;

        version = DateTime.UtcNow.Ticks.ToString(CultureInfo.InvariantCulture);
        await cache.SetAsync(CatalogVersionKey, version, VersionTtl, ct);
        return version;
    }

    public static Task BumpCatalogVersionAsync(IAppCache cache, CancellationToken ct)
        => cache.SetAsync(CatalogVersionKey, DateTime.UtcNow.Ticks.ToString(CultureInfo.InvariantCulture), VersionTtl, ct);

    public static string SearchKey(GetVendorsQuery query, string version)
    {
        var payload = string.Join('|',
            query.Search?.Trim().ToLowerInvariant() ?? string.Empty,
            query.CategoryId?.ToString("N") ?? string.Empty,
            query.Latitude?.ToString(CultureInfo.InvariantCulture) ?? string.Empty,
            query.Longitude?.ToString(CultureInfo.InvariantCulture) ?? string.Empty,
            query.RadiusKm?.ToString(CultureInfo.InvariantCulture) ?? string.Empty,
            query.Status?.ToString(CultureInfo.InvariantCulture) ?? string.Empty,
            query.Page.ToString(CultureInfo.InvariantCulture),
            query.PageSize.ToString(CultureInfo.InvariantCulture));

        return $"vendors:search:{version}:{Hash(payload)}";
    }

    public static string DetailKey(Guid vendorId, string version)
        => $"vendors:detail:{version}:{vendorId:N}";

    public static string ProductCatalogKey(Guid vendorId, string version)
        => $"vendors:catalog:{version}:{vendorId:N}";

    public static string MyVendorKey(Guid userId, string version)
        => $"vendors:mine:{version}:{userId:N}";

    private static string Hash(string value)
        => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(value))).ToLowerInvariant();
}