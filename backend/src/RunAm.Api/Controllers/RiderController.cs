using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RunAm.Application.Matching.Commands;
using RunAm.Application.Errands.Commands;
using RunAm.Application.Errands.Queries;
using RunAm.Application.Payments.Queries;
using RunAm.Application.Riders.Commands;
using RunAm.Application.Riders.Queries;
using RunAm.Domain.Interfaces;
using RunAm.Shared.DTOs;
using RunAm.Shared.DTOs.Errands;
using RunAm.Shared.DTOs.Payments;
using RunAm.Shared.DTOs.Riders;

namespace RunAm.Api.Controllers;

[Route("api/v1/rider")]
[Authorize(Roles = "Rider")]
public class RiderController : BaseApiController
{
    private readonly IMediator _mediator;
    private readonly IMonnifyService _monnify;
    private readonly IFileStorageService _fileStorage;

    public RiderController(IMediator mediator, IMonnifyService monnify, IFileStorageService fileStorage)
    {
        _mediator = mediator;
        _monnify = monnify;
        _fileStorage = fileStorage;
    }

    // ── Profile ─────────────────────────────────────

    /// <summary>Get rider profile</summary>
    [HttpGet("profile")]
    [ProducesResponseType(typeof(ApiResponse<RiderProfileDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetProfile()
    {
        var result = await _mediator.Send(new GetRiderProfileQuery(GetUserId()));
        return Ok(ApiResponse<RiderProfileDto?>.Ok(result));
    }

    /// <summary>Create rider profile (onboarding)</summary>
    [HttpPost("profile")]
    [ProducesResponseType(typeof(ApiResponse<RiderProfileDto>), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateProfile([FromBody] CreateRiderProfileRequest request)
    {
        var result = await _mediator.Send(new CreateRiderProfileCommand(GetUserId(), request));
        return Created("", ApiResponse<RiderProfileDto>.Ok(result));
    }

    /// <summary>Update rider online/offline status</summary>
    [HttpPut("status")]
    [ProducesResponseType(typeof(ApiResponse<RiderProfileDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> UpdateStatus([FromBody] RiderStatusRequest request)
    {
        var result = await _mediator.Send(new UpdateRiderStatusCommand(GetUserId(), request.IsOnline));
        return Ok(ApiResponse<RiderProfileDto>.Ok(result));
    }

    // ── Tasks ───────────────────────────────────────

    /// <summary>Get available (pending) tasks</summary>
    [HttpGet("tasks/available")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<ErrandDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAvailableTasks()
    {
        var result = await _mediator.Send(new GetAvailableTasksQuery(GetUserId()));
        return Ok(ApiResponse<IReadOnlyList<ErrandDto>>.Ok(result));
    }

    /// <summary>Get rider's active (in-progress) tasks</summary>
    [HttpGet("tasks/active")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<ErrandDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetActiveTasks()
    {
        var result = await _mediator.Send(new GetActiveRiderTasksQuery(GetUserId()));
        return Ok(ApiResponse<IReadOnlyList<ErrandDto>>.Ok(result));
    }

    /// <summary>Get rider's task history (completed/cancelled)</summary>
    [HttpGet("tasks/history")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<ErrandDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTaskHistory([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var result = await _mediator.Send(new GetRiderTaskHistoryQuery(GetUserId(), page, pageSize));
        return Ok(ApiResponse<IReadOnlyList<ErrandDto>>.Ok(result));
    }

    /// <summary>Get task detail by ID</summary>
    [HttpGet("tasks/{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<ErrandDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTaskDetail(Guid id)
    {
        var result = await _mediator.Send(new GetErrandByIdQuery(id, GetUserId()));
        return Ok(ApiResponse<ErrandDto>.Ok(result));
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

    // ── Earnings & Performance ──────────────────────

    /// <summary>Get rider earnings summary</summary>
    [HttpGet("earnings")]
    [ProducesResponseType(typeof(ApiResponse<EarningsSummaryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetEarnings()
    {
        var result = await _mediator.Send(new GetRiderEarningsQuery(GetUserId()));
        return Ok(ApiResponse<EarningsSummaryDto>.Ok(result));
    }

    /// <summary>Get rider performance metrics</summary>
    [HttpGet("performance")]
    [ProducesResponseType(typeof(ApiResponse<RiderPerformanceDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPerformance()
    {
        var result = await _mediator.Send(new GetRiderPerformanceQuery(GetUserId()));
        return Ok(ApiResponse<RiderPerformanceDto>.Ok(result));
    }

    // ── Location ────────────────────────────────────

    /// <summary>Batch update rider location</summary>
    [HttpPost("location")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> UpdateLocation([FromBody] BatchLocationUpdate request)
    {
        await _mediator.Send(new UpdateRiderLocationCommand(GetUserId(), request));
        return NoContent();
    }

    // ── Onboarding helpers ──────────────────────────

    /// <summary>Validate a bank account via Monnify and return the resolved account name</summary>
    [HttpPost("validate-bank")]
    [ProducesResponseType(typeof(ApiResponse<ValidateBankAccountResult>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ValidateBankAccount([FromBody] ValidateBankAccountRequest request)
    {
        var info = await _monnify.ValidateBankAccountAsync(request.BankCode, request.AccountNumber);
        var result = new ValidateBankAccountResult(info.Success, info.AccountName, info.Success ? null : "Could not verify this account. Check the bank code and account number.");
        return Ok(ApiResponse<ValidateBankAccountResult>.Ok(result));
    }

    /// <summary>Upload a selfie photo for onboarding</summary>
    [HttpPost("upload-selfie")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status200OK)]
    [RequestSizeLimit(5 * 1024 * 1024)] // 5 MB max
    public async Task<IActionResult> UploadSelfie([FromForm] IFormFile file)
    {
        if (file.Length == 0)
            return BadRequest(ApiResponse<string>.Fail("EMPTY_FILE", "No file uploaded."));

        var allowedTypes = new[] { "image/jpeg", "image/png", "image/webp" };
        if (!allowedTypes.Contains(file.ContentType))
            return BadRequest(ApiResponse<string>.Fail("INVALID_TYPE", "Only JPEG, PNG, and WebP images are allowed."));

        await using var stream = file.OpenReadStream();
        var url = await _fileStorage.UploadAsync(stream, file.FileName, "rider-selfies");
        return Ok(ApiResponse<string>.Ok(url));
    }
}
