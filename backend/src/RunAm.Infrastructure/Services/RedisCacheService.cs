using System.Text.Json;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;
using RunAm.Application.Common.Interfaces;

namespace RunAm.Infrastructure.Services;

public class RedisCacheService : IAppCache
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private static readonly string[] LoggedKeyPrefixes = ["service-categories:", "vendors:"];

    private readonly IDistributedCache _cache;
    private readonly ILogger<RedisCacheService> _logger;

    public RedisCacheService(IDistributedCache cache, ILogger<RedisCacheService> logger)
    {
        _cache = cache;
        _logger = logger;

        _logger.LogInformation("Using distributed cache implementation {CacheImplementation}", _cache.GetType().FullName);
    }

    public async Task<T?> GetAsync<T>(string key, CancellationToken ct = default)
    {
        var payload = await _cache.GetStringAsync(key, ct);
        if (string.IsNullOrWhiteSpace(payload))
        {
            LogCacheEvent("miss", key);
            return default;
        }

        LogCacheEvent("hit", key);

        try
        {
            return JsonSerializer.Deserialize<T>(payload, JsonOptions);
        }
        catch (JsonException ex)
        {
            _logger.LogWarning(ex, "Invalid cached payload for key {CacheKey}; evicting entry", key);
            await _cache.RemoveAsync(key, ct);
            return default;
        }
    }

    public Task SetAsync<T>(string key, T value, TimeSpan ttl, CancellationToken ct = default)
    {
        var payload = JsonSerializer.Serialize(value, JsonOptions);

        LogCacheEvent("set", key, ttl);

        return _cache.SetStringAsync(
            key,
            payload,
            new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = ttl
            },
            ct);
    }

    public Task RemoveAsync(string key, CancellationToken ct = default)
    {
        LogCacheEvent("remove", key);
        return _cache.RemoveAsync(key, ct);
    }

    private void LogCacheEvent(string action, string key, TimeSpan? ttl = null)
    {
        if (!LoggedKeyPrefixes.Any(prefix => key.StartsWith(prefix, StringComparison.Ordinal)))
            return;

        if (ttl.HasValue)
        {
            _logger.LogInformation("Cache {Action} for {CacheKey} (ttl: {CacheTtl})", action, key, ttl.Value);
            return;
        }

        _logger.LogInformation("Cache {Action} for {CacheKey}", action, key);
    }
}