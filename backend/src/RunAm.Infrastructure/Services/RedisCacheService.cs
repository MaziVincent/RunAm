using System.Text.Json;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;
using RunAm.Application.Common.Interfaces;
using StackExchange.Redis;

namespace RunAm.Infrastructure.Services;

public class RedisCacheService : IAppCache
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private static readonly string[] LoggedKeyPrefixes = ["service-categories:", "vendors:"];
    private static readonly TimeSpan FailureCooldown = TimeSpan.FromMinutes(1);

    private readonly IDistributedCache _cache;
    private readonly ILogger<RedisCacheService> _logger;
    private DateTimeOffset? _disabledUntilUtc;

    public RedisCacheService(IDistributedCache cache, ILogger<RedisCacheService> logger)
    {
        _cache = cache;
        _logger = logger;

        _logger.LogInformation("Using distributed cache implementation {CacheImplementation}", _cache.GetType().FullName);
    }

    public async Task<T?> GetAsync<T>(string key, CancellationToken ct = default)
    {
        if (IsTemporarilyDisabled())
        {
            LogCacheEvent("bypass", key);
            return default;
        }

        string? payload;
        try
        {
            payload = await _cache.GetStringAsync(key, ct);
        }
        catch (Exception ex) when (IsCacheUnavailable(ex))
        {
            DisableTemporarily(ex);
            return default;
        }

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

            try
            {
                await _cache.RemoveAsync(key, ct);
            }
            catch (Exception removeEx) when (IsCacheUnavailable(removeEx))
            {
                DisableTemporarily(removeEx);
            }

            return default;
        }
    }

    public async Task SetAsync<T>(string key, T value, TimeSpan ttl, CancellationToken ct = default)
    {
        if (IsTemporarilyDisabled())
        {
            LogCacheEvent("skip-set", key, ttl);
            return;
        }

        var payload = JsonSerializer.Serialize(value, JsonOptions);

        LogCacheEvent("set", key, ttl);

        try
        {
            await _cache.SetStringAsync(
                key,
                payload,
                new DistributedCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = ttl
                },
                ct);
        }
        catch (Exception ex) when (IsCacheUnavailable(ex))
        {
            DisableTemporarily(ex);
        }
    }

    public async Task RemoveAsync(string key, CancellationToken ct = default)
    {
        if (IsTemporarilyDisabled())
        {
            LogCacheEvent("skip-remove", key);
            return;
        }

        LogCacheEvent("remove", key);

        try
        {
            await _cache.RemoveAsync(key, ct);
        }
        catch (Exception ex) when (IsCacheUnavailable(ex))
        {
            DisableTemporarily(ex);
        }
    }

    private bool IsTemporarilyDisabled()
        => _disabledUntilUtc.HasValue && _disabledUntilUtc.Value > DateTimeOffset.UtcNow;

    private void DisableTemporarily(Exception ex)
    {
        var nextRetryAt = DateTimeOffset.UtcNow.Add(FailureCooldown);
        _disabledUntilUtc = nextRetryAt;

        _logger.LogWarning(
            ex,
            "Distributed cache unavailable. Bypassing Redis cache until {RetryAtUtc}.",
            nextRetryAt);
    }

    private static bool IsCacheUnavailable(Exception ex)
        => ex is RedisConnectionException
            || ex is RedisTimeoutException
            || ex.InnerException is RedisConnectionException
            || ex.InnerException is RedisTimeoutException;

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