using MediatR;
using Microsoft.AspNetCore.Identity;
using RunAm.Domain.Entities;
using RunAm.Domain.Interfaces;
using RunAm.Shared.Constants;
using RunAm.Shared.DTOs;
using RunAm.Shared.DTOs.Auth;

namespace RunAm.Application.Auth.Commands;

public record RefreshTokenCommand(RefreshTokenRequest Request) : IRequest<AuthResponse>;

public class RefreshTokenCommandHandler : IRequestHandler<RefreshTokenCommand, AuthResponse>
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IJwtTokenService _jwtTokenService;

    public RefreshTokenCommandHandler(UserManager<ApplicationUser> userManager, IJwtTokenService jwtTokenService)
    {
        _userManager = userManager;
        _jwtTokenService = jwtTokenService;
    }

    public async Task<AuthResponse> Handle(RefreshTokenCommand command, CancellationToken cancellationToken)
    {
        var request = command.Request;

        if (string.IsNullOrWhiteSpace(request.RefreshToken))
            throw new UnauthorizedAccessException("Invalid or expired refresh token.");

        ApplicationUser? user;

        if (!string.IsNullOrWhiteSpace(request.AccessToken))
        {
            var (isValid, userId) = _jwtTokenService.ValidateAccessToken(request.AccessToken);
            if (!isValid)
                throw new UnauthorizedAccessException("Invalid access token.");

            user = await _userManager.FindByIdAsync(userId.ToString());
        }
        else
        {
            user = _userManager.Users
                .SingleOrDefault(u => u.RefreshToken == request.RefreshToken);
        }

        if (user == null || user.RefreshToken != request.RefreshToken || user.RefreshTokenExpiryTime <= DateTime.UtcNow)
            throw new UnauthorizedAccessException("Invalid or expired refresh token.");

        var newAccessToken = _jwtTokenService.GenerateAccessToken(user);
        var newRefreshToken = _jwtTokenService.GenerateRefreshToken();

        user.RefreshToken = newRefreshToken;
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(AppConstants.Auth.RefreshTokenExpirationDays);
        await _userManager.UpdateAsync(user);

        return new AuthResponse(
            AccessToken: newAccessToken,
            RefreshToken: newRefreshToken,
            ExpiresAt: DateTime.UtcNow.AddMinutes(AppConstants.Auth.AccessTokenExpirationMinutes),
            User: new UserDto(
                user.Id, user.Email!, user.PhoneNumber ?? "", user.FirstName, user.LastName,
                user.ProfileImageUrl, user.Role, user.Status, user.IsPhoneVerified, user.IsEmailVerified,
                user.CreatedAt
            )
        );
    }
}
