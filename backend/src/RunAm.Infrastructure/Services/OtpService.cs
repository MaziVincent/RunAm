using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using RunAm.Domain.Entities;
using RunAm.Domain.Interfaces;
using RunAm.Infrastructure.Persistence;

namespace RunAm.Infrastructure.Services;

/// <summary>
/// OTP service that supports a configurable mock code for development/testing.
/// When MOCK_OTP_CODE is set, that code is always accepted (in addition to DB-stored codes).
/// In production, leave MOCK_OTP_CODE empty so only real codes work.
/// </summary>
public class OtpService : IOtpService
{
    private readonly AppDbContext _db;
    private readonly ILogger<OtpService> _logger;
    private readonly string? _mockCode;
    private readonly int _expiryMinutes;

    public OtpService(AppDbContext db, IConfiguration configuration, ILogger<OtpService> logger)
    {
        _db = db;
        _logger = logger;

        var section = configuration.GetSection("Otp");
        _mockCode = section["MockCode"];
        _expiryMinutes = int.TryParse(section["ExpiryMinutes"], out var m) ? m : 10;
    }

    public async Task<string> GenerateAsync(Guid userId, string target, VerificationCodeType type, CancellationToken ct = default)
    {
        // Invalidate any previous unused codes for this user + type
        var existing = await _db.VerificationCodes
            .Where(v => v.UserId == userId && v.Type == type && !v.IsUsed)
            .ToListAsync(ct);

        foreach (var old in existing)
            old.IsUsed = true;

        // If mock mode, use the mock code; otherwise generate a random 6-digit code
        var code = !string.IsNullOrEmpty(_mockCode)
            ? _mockCode
            : Random.Shared.Next(100000, 999999).ToString();

        var entity = new VerificationCode
        {
            UserId = userId,
            Code = code,
            Target = target,
            Type = type,
            ExpiresAt = DateTime.UtcNow.AddMinutes(_expiryMinutes)
        };

        _db.VerificationCodes.Add(entity);
        await _db.SaveChangesAsync(ct);

        _logger.LogInformation("OTP generated for user {UserId}, type {Type}, target {Target}", userId, type, target);

        return code;
    }

    public async Task<bool> ValidateAsync(Guid userId, string code, VerificationCodeType type, CancellationToken ct = default)
    {
        // Always accept mock code in development
        if (!string.IsNullOrEmpty(_mockCode) && code == _mockCode)
        {
            _logger.LogInformation("Mock OTP accepted for user {UserId}", userId);
            return true;
        }

        var entity = await _db.VerificationCodes
            .Where(v => v.UserId == userId && v.Type == type && !v.IsUsed && v.Code == code)
            .OrderByDescending(v => v.CreatedAt)
            .FirstOrDefaultAsync(ct);

        if (entity == null)
            return false;

        if (entity.ExpiresAt < DateTime.UtcNow)
        {
            _logger.LogWarning("Expired OTP used by user {UserId}", userId);
            return false;
        }

        entity.IsUsed = true;
        await _db.SaveChangesAsync(ct);

        _logger.LogInformation("OTP validated for user {UserId}, type {Type}", userId, type);
        return true;
    }
}
