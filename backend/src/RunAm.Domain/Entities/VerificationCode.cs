namespace RunAm.Domain.Entities;

/// <summary>
/// Stores OTP codes for email/phone verification.
/// </summary>
public class VerificationCode : BaseEntity
{
    public Guid UserId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Target { get; set; } = string.Empty; // email or phone
    public VerificationCodeType Type { get; set; }
    public DateTime ExpiresAt { get; set; }
    public bool IsUsed { get; set; }
}

public enum VerificationCodeType
{
    EmailVerification = 0,
    PhoneVerification = 1,
    PasswordReset = 2
}
