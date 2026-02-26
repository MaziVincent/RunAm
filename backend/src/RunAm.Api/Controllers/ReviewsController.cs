using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RunAm.Application.Reviews.Commands;
using RunAm.Application.Reviews.Queries;
using RunAm.Shared.DTOs;
using RunAm.Shared.DTOs.Reviews;

namespace RunAm.Api.Controllers;

[Route("api/v1/reviews")]
[Authorize]
public class ReviewsController : BaseApiController
{
    private readonly IMediator _mediator;

    public ReviewsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>Submit a review for a delivered errand</summary>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<ReviewDto>), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateReview([FromBody] CreateReviewRequest request)
    {
        var result = await _mediator.Send(new CreateReviewCommand(GetUserId(), request));
        return Created("", ApiResponse<ReviewDto>.Ok(result));
    }

    /// <summary>Get reviews for a specific user</summary>
    [HttpGet("user/{userId:guid}")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<ReviewDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUserReviews(Guid userId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var result = await _mediator.Send(new GetUserReviewsQuery(userId, page, pageSize));
        return Ok(ApiResponse<IReadOnlyList<ReviewDto>>.Ok(result));
    }

    /// <summary>Get my reviews</summary>
    [HttpGet("me")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<ReviewDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyReviews([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var result = await _mediator.Send(new GetUserReviewsQuery(GetUserId(), page, pageSize));
        return Ok(ApiResponse<IReadOnlyList<ReviewDto>>.Ok(result));
    }

    /// <summary>Get rating summary for a user</summary>
    [HttpGet("user/{userId:guid}/summary")]
    [ProducesResponseType(typeof(ApiResponse<ReviewSummaryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetRatingSummary(Guid userId)
    {
        var result = await _mediator.Send(new GetRatingSummaryQuery(userId));
        return Ok(ApiResponse<ReviewSummaryDto>.Ok(result));
    }

    /// <summary>Get my rating summary</summary>
    [HttpGet("me/summary")]
    [ProducesResponseType(typeof(ApiResponse<ReviewSummaryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyRatingSummary()
    {
        var result = await _mediator.Send(new GetRatingSummaryQuery(GetUserId()));
        return Ok(ApiResponse<ReviewSummaryDto>.Ok(result));
    }

    /// <summary>Get reviews for an errand</summary>
    [HttpGet("errand/{errandId:guid}")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<ReviewDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetErrandReviews(Guid errandId)
    {
        var result = await _mediator.Send(new GetErrandReviewsQuery(errandId));
        return Ok(ApiResponse<IReadOnlyList<ReviewDto>>.Ok(result));
    }

    /// <summary>Flag a review as inappropriate</summary>
    [HttpPost("{id:guid}/flag")]
    [ProducesResponseType(typeof(ApiResponse<ReviewDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> FlagReview(Guid id, [FromBody] FlagReviewRequest request)
    {
        var result = await _mediator.Send(new FlagReviewCommand(id, request.Reason));
        return Ok(ApiResponse<ReviewDto>.Ok(result));
    }
}
