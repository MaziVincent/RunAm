using RunAm.Domain.Enums;

namespace RunAm.Shared.DTOs.Auth;

public record RegisterRequest(
    string Email,
    string PhoneNumber,
    string Password,
    string FirstName,
    string LastName,
    UserRole Role = UserRole.Customer
);

public record LoginRequest(
    string Email,
    string Password
);

public record RefreshTokenRequest(
    string AccessToken,
    string RefreshToken
);

public record AuthResponse(
    string AccessToken,
    string RefreshToken,
    DateTime ExpiresAt,
    UserDto User
);

public record ForgotPasswordRequest(string Email);

public record ResetPasswordRequest(
    string Email,
    string Token,
    string NewPassword
);

public record VerifyOtpRequest(
    string PhoneNumber,
    string Code
);

public record ResendOtpRequest(
    string PhoneNumber
);

public record RegisterResponse(
    string Message,
    string PhoneNumber,
    bool RequiresVerification
);
