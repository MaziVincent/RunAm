using MediatR;
using Microsoft.AspNetCore.Identity;
using RunAm.Domain.Entities;
using RunAm.Domain.Exceptions;
using RunAm.Application.Auth;
using RunAm.Shared.DTOs;

namespace RunAm.Application.Users.Commands;

public record UpdateProfileCommand(Guid UserId, UpdateProfileRequest Request) : IRequest<UserDto>;

public class UpdateProfileCommandHandler : IRequestHandler<UpdateProfileCommand, UserDto>
{
    private readonly UserManager<ApplicationUser> _userManager;

    public UpdateProfileCommandHandler(UserManager<ApplicationUser> userManager)
    {
        _userManager = userManager;
    }

    public async Task<UserDto> Handle(UpdateProfileCommand command, CancellationToken cancellationToken)
    {
        var user = await _userManager.FindByIdAsync(command.UserId.ToString())
            ?? throw new NotFoundException("User", command.UserId);

        var request = command.Request;

        if (!string.IsNullOrWhiteSpace(request.FirstName))
            user.FirstName = request.FirstName;

        if (!string.IsNullOrWhiteSpace(request.LastName))
            user.LastName = request.LastName;

        if (!string.IsNullOrWhiteSpace(request.PhoneNumber))
        {
            var normalizedPhoneNumber = PhoneNumberNormalizer.Normalize(request.PhoneNumber);
            var existingPhoneUser = _userManager.Users.FirstOrDefault(u =>
                u.PhoneNumber == normalizedPhoneNumber && u.Id != user.Id);

            if (existingPhoneUser is not null)
                throw new InvalidOperationException("A user with this phone number already exists.");

            user.PhoneNumber = normalizedPhoneNumber;
        }

        user.UpdatedAt = DateTime.UtcNow;
        await _userManager.UpdateAsync(user);

        return new UserDto(
            user.Id, user.Email!, user.PhoneNumber ?? "", user.FirstName, user.LastName,
            user.ProfileImageUrl, user.Role, user.Status, user.IsPhoneVerified, user.IsEmailVerified,
            user.CreatedAt
        );
    }
}
