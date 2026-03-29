using MediatR;
using Microsoft.AspNetCore.Identity;
using RunAm.Domain.Entities;
using RunAm.Shared.DTOs.Auth;

namespace RunAm.Application.Auth.Commands;

public record ChangePasswordCommand(Guid UserId, ChangePasswordRequest Request) : IRequest;

public class ChangePasswordCommandHandler : IRequestHandler<ChangePasswordCommand>
{
    private readonly UserManager<ApplicationUser> _userManager;

    public ChangePasswordCommandHandler(UserManager<ApplicationUser> userManager)
    {
        _userManager = userManager;
    }

    public async Task Handle(ChangePasswordCommand command, CancellationToken cancellationToken)
    {
        var user = await _userManager.FindByIdAsync(command.UserId.ToString())
            ?? throw new UnauthorizedAccessException("User not found.");

        var result = await _userManager.ChangePasswordAsync(
            user,
            command.Request.CurrentPassword,
            command.Request.NewPassword);

        if (!result.Succeeded)
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            throw new InvalidOperationException(errors);
        }
    }
}
