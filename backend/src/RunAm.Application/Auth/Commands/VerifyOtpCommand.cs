using MediatR;
using Microsoft.AspNetCore.Identity;
using RunAm.Domain.Entities;
using RunAm.Domain.Enums;
using RunAm.Domain.Interfaces;
using RunAm.Shared.Constants;
using RunAm.Shared.DTOs;
using RunAm.Shared.DTOs.Auth;

namespace RunAm.Application.Auth.Commands;

// ── Verify OTP ──────────────────────────────────────────

public record VerifyOtpCommand(VerifyOtpRequest Request) : IRequest<AuthResponse>;

public class VerifyOtpCommandHandler : IRequestHandler<VerifyOtpCommand, AuthResponse>
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IOtpService _otpService;
    private readonly IJwtTokenService _jwtTokenService;

    public VerifyOtpCommandHandler(
        UserManager<ApplicationUser> userManager,
        IOtpService otpService,
        IJwtTokenService jwtTokenService)
    {
        _userManager = userManager;
        _otpService = otpService;
        _jwtTokenService = jwtTokenService;
    }

    public async Task<AuthResponse> Handle(VerifyOtpCommand command, CancellationToken cancellationToken)
    {
        var request = command.Request;
        var normalizedPhoneNumber = PhoneNumberNormalizer.Normalize(request.PhoneNumber);

        var user = _userManager.Users.FirstOrDefault(u => u.PhoneNumber == normalizedPhoneNumber)
            ?? throw new InvalidOperationException("User not found.");

        var isValid = await _otpService.ValidateAsync(
            user.Id, request.Code, VerificationCodeType.PhoneVerification, cancellationToken);

        if (!isValid)
            throw new InvalidOperationException("Invalid or expired verification code.");

        // Mark phone as verified and activate user
        user.IsPhoneVerified = true;
        if (user.Status == UserStatus.PendingVerification)
            user.Status = UserStatus.Active;

        // Generate tokens
        var accessToken = _jwtTokenService.GenerateAccessToken(user);
        var refreshToken = _jwtTokenService.GenerateRefreshToken();

        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(AppConstants.Auth.RefreshTokenExpirationDays);
        await _userManager.UpdateAsync(user);

        return new AuthResponse(
            AccessToken: accessToken,
            RefreshToken: refreshToken,
            ExpiresAt: DateTime.UtcNow.AddMinutes(AppConstants.Auth.AccessTokenExpirationMinutes),
            User: new UserDto(
                user.Id, user.Email!, user.PhoneNumber ?? "", user.FirstName, user.LastName,
                user.ProfileImageUrl, user.Role, user.Status, user.IsPhoneVerified, user.IsEmailVerified,
                user.CreatedAt
            )
        );
    }
}

// ── Resend OTP ──────────────────────────────────────────

public record ResendOtpCommand(ResendOtpRequest Request) : IRequest<RegisterResponse>;

public class ResendOtpCommandHandler : IRequestHandler<ResendOtpCommand, RegisterResponse>
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IOtpService _otpService;
    private readonly ISmsService _smsService;

    public ResendOtpCommandHandler(
        UserManager<ApplicationUser> userManager,
        IOtpService otpService,
        ISmsService smsService)
    {
        _userManager = userManager;
        _otpService = otpService;
        _smsService = smsService;
    }

    public async Task<RegisterResponse> Handle(ResendOtpCommand command, CancellationToken cancellationToken)
    {
        var normalizedPhoneNumber = PhoneNumberNormalizer.Normalize(command.Request.PhoneNumber);

        var user = _userManager.Users.FirstOrDefault(u => u.PhoneNumber == normalizedPhoneNumber)
            ?? throw new InvalidOperationException("User not found.");

        if (user.IsPhoneVerified)
            throw new InvalidOperationException("Phone number is already verified.");

        var otp = await _otpService.GenerateAsync(
            user.Id, user.PhoneNumber!, VerificationCodeType.PhoneVerification, cancellationToken);

        await _smsService.SendAsync(
            user.PhoneNumber!,
            $"Your RunAm verification code is: {otp}. It expires in 10 minutes.",
            cancellationToken);

        return new RegisterResponse(
            Message: "A new verification code has been sent to your phone.",
            PhoneNumber: user.PhoneNumber!,
            RequiresVerification: true
        );
    }
}
