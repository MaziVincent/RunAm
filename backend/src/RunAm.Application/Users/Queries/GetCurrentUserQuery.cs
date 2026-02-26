using MediatR;
using Microsoft.AspNetCore.Identity;
using RunAm.Domain.Entities;
using RunAm.Domain.Exceptions;
using RunAm.Shared.DTOs;

namespace RunAm.Application.Users.Queries;

public record GetCurrentUserQuery(Guid UserId) : IRequest<UserDto>;

public class GetCurrentUserQueryHandler : IRequestHandler<GetCurrentUserQuery, UserDto>
{
    private readonly UserManager<ApplicationUser> _userManager;

    public GetCurrentUserQueryHandler(UserManager<ApplicationUser> userManager)
    {
        _userManager = userManager;
    }

    public async Task<UserDto> Handle(GetCurrentUserQuery query, CancellationToken cancellationToken)
    {
        var user = await _userManager.FindByIdAsync(query.UserId.ToString())
            ?? throw new NotFoundException("User", query.UserId);

        return new UserDto(
            user.Id, user.Email!, user.PhoneNumber ?? "", user.FirstName, user.LastName,
            user.ProfileImageUrl, user.Role, user.Status, user.IsPhoneVerified, user.IsEmailVerified,
            user.CreatedAt
        );
    }
}
