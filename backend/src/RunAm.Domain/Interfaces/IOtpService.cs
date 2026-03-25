using RunAm.Domain.Entities;

namespace RunAm.Domain.Interfaces;

/// <summary>
/// Generates, stores, and validates OTP codes.
/// </summary>
public interface IOtpService
{
    /// <summary>Generate and store a new OTP for the given user/target.</summary>
    Task<string> GenerateAsync(Guid userId, string target, VerificationCodeType type, CancellationToken ct = default);

    /// <summary>Validate the OTP code. Returns true and marks as used if valid.</summary>
    Task<bool> ValidateAsync(Guid userId, string code, VerificationCodeType type, CancellationToken ct = default);
}
