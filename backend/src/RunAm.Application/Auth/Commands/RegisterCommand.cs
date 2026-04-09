using MediatR;
using Microsoft.AspNetCore.Identity;
using RunAm.Domain.Entities;
using RunAm.Domain.Enums;
using RunAm.Domain.Interfaces;
using RunAm.Shared.Constants;
using RunAm.Shared.DTOs;
using RunAm.Shared.DTOs.Auth;

namespace RunAm.Application.Auth.Commands;

public record RegisterCommand(RegisterRequest Request) : IRequest<RegisterResponse>;

public class RegisterCommandHandler : IRequestHandler<RegisterCommand, RegisterResponse>
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IOtpService _otpService;
    private readonly ISmsService _smsService;

    public RegisterCommandHandler(
        UserManager<ApplicationUser> userManager,
        IOtpService otpService,
        ISmsService smsService)
    {
        _userManager = userManager;
        _otpService = otpService;
        _smsService = smsService;
    }

    private static readonly HashSet<UserRole> AllowedRegistrationRoles = new()
    {
        UserRole.Customer,
        UserRole.Rider,
        UserRole.Merchant
    };

    public async Task<RegisterResponse> Handle(RegisterCommand command, CancellationToken cancellationToken)
    {
        var request = command.Request;
        var normalizedPhoneNumber = PhoneNumberNormalizer.Normalize(request.PhoneNumber);

        // Prevent privilege escalation — only allow safe roles via self-registration
        var role = AllowedRegistrationRoles.Contains(request.Role) ? request.Role : UserRole.Customer;

        var existingUser = await _userManager.FindByEmailAsync(request.Email);
        if (existingUser != null)
            throw new InvalidOperationException("A user with this email already exists.");

        var existingPhoneUser = _userManager.Users.FirstOrDefault(u => u.PhoneNumber == normalizedPhoneNumber);
        if (existingPhoneUser != null)
            throw new InvalidOperationException("A user with this phone number already exists.");

        var user = new ApplicationUser
        {
            UserName = request.Email,
            Email = request.Email,
            PhoneNumber = normalizedPhoneNumber,
            FirstName = request.FirstName,
            LastName = request.LastName,
            Role = role,
            Status = UserStatus.PendingVerification,
            IsEmailVerified = false,
            IsPhoneVerified = false
        };

        var result = await _userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            throw new InvalidOperationException($"Registration failed: {errors}");
        }

        await _userManager.AddToRoleAsync(user, role.ToString());

        // Generate and send OTP via SMS
        var otp = await _otpService.GenerateAsync(user.Id, user.PhoneNumber!, VerificationCodeType.PhoneVerification, cancellationToken);

        await _smsService.SendAsync(
            user.PhoneNumber!,
            $"Your RunAm verification code is: {otp}. It expires in 10 minutes.",
            cancellationToken);

        return new RegisterResponse(
            Message: "Registration successful. Please verify your phone number with the OTP sent via SMS.",
            PhoneNumber: normalizedPhoneNumber,
            RequiresVerification: true
        );
    }
}
