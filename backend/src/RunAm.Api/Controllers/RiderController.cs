using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RunAm.Application.Matching.Commands;
using RunAm.Application.Errands.Commands;
using RunAm.Application.Riders.Commands;
using RunAm.Shared.DTOs;
using RunAm.Shared.DTOs.Errands;
using RunAm.Shared.DTOs.Riders;

namespace RunAm.Api.Controllers;

[Route("api/v1/rider")]
[Authorize(Roles = "Rider")]
public class RiderController : BaseApiController
{
    private readonly IMediator _mediator;

    public RiderController(IMediator mediator) => _mediator = mediator;

    /// <summary>Update rider online/offline status</summary>
    [HttpPut("status")]
    [ProducesResponseType(typeof(ApiResponse<RiderProfileDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> UpdateStatus([FromBody] RiderStatusRequest request)
    {
        var result = await _mediator.Send(new UpdateRiderStatusCommand(GetUserId(), request.IsOnline));
        return Ok(ApiResponse<RiderProfileDto>.Ok(result));
    }

    /// <summary>Accept an errand task</summary>
    [HttpPost("tasks/{id:guid}/accept")]
    [ProducesResponseType(typeof(ApiResponse<ErrandDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> AcceptTask(Guid id)
    {
        var result = await _mediator.Send(new AcceptErrandCommand(id, GetUserId()));
        return Ok(ApiResponse<ErrandDto>.Ok(result));
    }

    /// <summary>Update errand task status</summary>
    [HttpPatch("tasks/{id:guid}/status")]
    [ProducesResponseType(typeof(ApiResponse<ErrandDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> UpdateTaskStatus(Guid id, [FromBody] UpdateErrandStatusRequest request)
    {
        var result = await _mediator.Send(new UpdateErrandStatusCommand(id, GetUserId(), request));
        return Ok(ApiResponse<ErrandDto>.Ok(result));
    }

    /// <summary>Batch update rider location</summary>
    [HttpPost("location")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> UpdateLocation([FromBody] BatchLocationUpdate request)
    {
        await _mediator.Send(new UpdateRiderLocationCommand(GetUserId(), request));
        return NoContent();
    }

    /// <summary>Create rider profile (onboarding)</summary>
    [HttpPost("profile")]
    [ProducesResponseType(typeof(ApiResponse<RiderProfileDto>), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateProfile([FromBody] CreateRiderProfileRequest request)
    {
        var result = await _mediator.Send(new CreateRiderProfileCommand(GetUserId(), request));
        return Created("", ApiResponse<RiderProfileDto>.Ok(result));
    }
}
