using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RunAm.Application.Users.Commands;
using RunAm.Application.Users.Queries;
using RunAm.Shared.DTOs;

namespace RunAm.Api.Controllers;

[Route("api/v1/users")]
[Authorize]
public class UsersController : BaseApiController
{
    private readonly IMediator _mediator;

    public UsersController(IMediator mediator) => _mediator = mediator;

    /// <summary>Get current user profile</summary>
    [HttpGet("me")]
    [ProducesResponseType(typeof(ApiResponse<UserDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMe()
    {
        var result = await _mediator.Send(new GetCurrentUserQuery(GetUserId()));
        return Ok(ApiResponse<UserDto>.Ok(result));
    }

    /// <summary>Update current user profile</summary>
    [HttpPut("me")]
    [ProducesResponseType(typeof(ApiResponse<UserDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
    {
        var result = await _mediator.Send(new UpdateProfileCommand(GetUserId(), request));
        return Ok(ApiResponse<UserDto>.Ok(result));
    }

    /// <summary>Get user's saved addresses</summary>
    [HttpGet("me/addresses")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<UserAddressDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAddresses()
    {
        var result = await _mediator.Send(new GetAddressesQuery(GetUserId()));
        return Ok(ApiResponse<IReadOnlyList<UserAddressDto>>.Ok(result));
    }

    /// <summary>Add a new saved address</summary>
    [HttpPost("me/addresses")]
    [ProducesResponseType(typeof(ApiResponse<UserAddressDto>), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateAddress([FromBody] CreateAddressRequest request)
    {
        var result = await _mediator.Send(new CreateAddressCommand(GetUserId(), request));
        return Created("", ApiResponse<UserAddressDto>.Ok(result));
    }
}
