using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RunAm.Application.Admin.Commands;
using RunAm.Application.Matching.Queries;
using RunAm.Application.Notifications.Commands;
using RunAm.Application.Payments.Commands;
using RunAm.Application.Products.Commands;
using RunAm.Application.Reviews.Commands;
using RunAm.Application.Reviews.Queries;
using RunAm.Application.Vendors.Queries;
using RunAm.Domain.Interfaces;
using RunAm.Shared.DTOs;
using RunAm.Shared.DTOs.Errands;
using RunAm.Shared.DTOs.Payments;
using RunAm.Shared.DTOs.Reviews;
using RunAm.Shared.DTOs.Riders;
using RunAm.Shared.DTOs.Vendors;

namespace RunAm.Api.Controllers;

[Route("api/v1/admin")]
[Authorize(Roles = "Admin")]
public class AdminController : BaseApiController
{
    private readonly IMediator _mediator;
    private readonly IRiderRepository _riderRepo;
    private readonly IErrandRepository _errandRepo;

    public AdminController(IMediator mediator, IRiderRepository riderRepo, IErrandRepository errandRepo)
    {
        _mediator = mediator;
        _riderRepo = riderRepo;
        _errandRepo = errandRepo;
    }

    /// <summary>Get pending rider approvals</summary>
    [HttpGet("riders/pending")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<RiderProfileDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPendingRiders()
    {
        var riders = await _riderRepo.GetPendingApprovalAsync();
        var dtos = riders.Select(r => new RiderProfileDto(
            r.Id, r.UserId, r.User?.FullName ?? "", r.VehicleType, r.LicensePlate,
            r.ApprovalStatus, r.Rating, r.TotalCompletedTasks, r.IsOnline,
            r.CurrentLatitude, r.CurrentLongitude, r.LastLocationUpdate, r.CreatedAt
        )).ToList();
        return Ok(ApiResponse<IReadOnlyList<RiderProfileDto>>.Ok(dtos));
    }

    /// <summary>Approve or reject a rider</summary>
    [HttpPatch("riders/{id:guid}/approve")]
    [ProducesResponseType(typeof(ApiResponse<RiderProfileDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ApproveRider(Guid id, [FromBody] ApproveRiderRequest request)
    {
        var result = await _mediator.Send(new ApproveRiderCommand(id, request));
        return Ok(ApiResponse<RiderProfileDto>.Ok(result));
    }

    /// <summary>Get all pending errands</summary>
    [HttpGet("errands")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<ErrandDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetErrands()
    {
        var errands = await _errandRepo.GetPendingErrandsAsync();
        var dtos = errands.Select(e => new ErrandDto(
            e.Id, e.CustomerId, e.Customer?.FullName ?? "", e.RiderId, null,
            e.Category, e.Status, e.Description, e.SpecialInstructions,
            e.Priority, e.ScheduledAt, e.PickupAddress, e.PickupLatitude, e.PickupLongitude,
            e.DropoffAddress, e.DropoffLatitude, e.DropoffLongitude,
            e.EstimatedDistance, e.EstimatedDuration, e.PackageSize, e.PackageWeight,
            e.IsFragile, e.RequiresPhotoProof, e.RecipientName, e.RecipientPhone,
            e.TotalAmount, e.AcceptedAt, e.PickedUpAt, e.DeliveredAt, e.CancelledAt,
            e.CancellationReason, e.CreatedAt, null, null
        )).ToList();
        return Ok(ApiResponse<IReadOnlyList<ErrandDto>>.Ok(dtos));
    }

    // ── Finance Endpoints ───────────────────────

    /// <summary>Get all promo codes</summary>
    [HttpGet("promo-codes")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<PromoCodeDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPromoCodes([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var result = await _mediator.Send(new GetPromoCodesQuery(page, pageSize));
        return Ok(ApiResponse<IReadOnlyList<PromoCodeDto>>.Ok(result));
    }

    /// <summary>Create a promo code</summary>
    [HttpPost("promo-codes")]
    [ProducesResponseType(typeof(ApiResponse<PromoCodeDto>), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreatePromoCode([FromBody] CreatePromoCodeRequest request)
    {
        var result = await _mediator.Send(new CreatePromoCodeCommand(request));
        return Created("", ApiResponse<PromoCodeDto>.Ok(result));
    }

    /// <summary>Get pending payouts</summary>
    [HttpGet("payouts/pending")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<RiderPayoutDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPendingPayouts()
    {
        // Workaround: get payouts for all riders via pending list
        var (payouts, totalCount) = await _mediator.Send(new GetRiderPayoutsQuery(Guid.Empty, 1, 100));
        return Ok(ApiResponse<IReadOnlyList<RiderPayoutDto>>.Ok(payouts, new PaginationMeta
        {
            Page = 1,
            PageSize = 100,
            TotalCount = totalCount
        }));
    }

    /// <summary>Process a payout</summary>
    [HttpPost("payouts/{id:guid}/process")]
    [ProducesResponseType(typeof(ApiResponse<RiderPayoutDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ProcessPayout(Guid id)
    {
        var result = await _mediator.Send(new ProcessPayoutCommand(id));
        return Ok(ApiResponse<RiderPayoutDto>.Ok(result));
    }

    // ── Review Moderation ───────────────────────

    /// <summary>Get flagged reviews</summary>
    [HttpGet("reviews/flagged")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<ReviewDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetFlaggedReviews([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var result = await _mediator.Send(new GetFlaggedReviewsQuery(page, pageSize));
        return Ok(ApiResponse<IReadOnlyList<ReviewDto>>.Ok(result));
    }

    /// <summary>Approve or reject a flagged review</summary>
    [HttpPost("reviews/{id:guid}/moderate")]
    [ProducesResponseType(typeof(ApiResponse<ReviewDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ModerateReview(Guid id, [FromQuery] bool approve = true)
    {
        var result = await _mediator.Send(new ModerateReviewCommand(id, approve));
        return Ok(ApiResponse<ReviewDto>.Ok(result));
    }

    // ── Notification Broadcasting ───────────────

    /// <summary>Get notification templates</summary>
    [HttpGet("notification-templates")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<NotificationTemplateDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetNotificationTemplates([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var result = await _mediator.Send(new GetNotificationTemplatesQuery(page, pageSize));
        return Ok(ApiResponse<IReadOnlyList<NotificationTemplateDto>>.Ok(result));
    }

    /// <summary>Create a notification template</summary>
    [HttpPost("notification-templates")]
    [ProducesResponseType(typeof(ApiResponse<NotificationTemplateDto>), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateNotificationTemplate([FromBody] CreateNotificationTemplateRequest request)
    {
        var result = await _mediator.Send(new CreateNotificationTemplateCommand(request));
        return Created("", ApiResponse<NotificationTemplateDto>.Ok(result));
    }

    /// <summary>Delete a notification template</summary>
    [HttpDelete("notification-templates/{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> DeleteNotificationTemplate(Guid id)
    {
        await _mediator.Send(new DeleteNotificationTemplateCommand(id));
        return NoContent();
    }

    /// <summary>Broadcast a notification to user segments</summary>
    [HttpPost("notifications/broadcast")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> BroadcastNotification([FromBody] BroadcastNotificationRequest request)
    {
        await _mediator.Send(new BroadcastNotificationCommand(request));
        return NoContent();
    }

    /// <summary>Activate or deactivate a product (admin only)</summary>
    [HttpPatch("products/{id:guid}/active")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> ToggleProductActive(Guid id, [FromBody] ToggleProductActiveRequest request)
    {
        var result = await _mediator.Send(new ToggleProductActiveCommand(id, request.IsActive));
        return Ok(ApiResponse<ProductDto>.Ok(result));
    }

    /// <summary>Update vendor service categories (admin)</summary>
    [HttpPut("vendors/{id:guid}/categories")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> UpdateVendorCategories(Guid id, [FromBody] UpdateVendorCategoriesRequest request)
    {
        var result = await _mediator.Send(new Application.Vendors.Commands.UpdateVendorCategoriesCommand(id, request.ServiceCategoryIds));
        return Ok(ApiResponse<VendorDto>.Ok(result));
    }

    /// <summary>Get vendor details with ALL products (including inactive)</summary>
    [HttpGet("vendors/{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetVendorDetail(Guid id)
    {
        var result = await _mediator.Send(new GetVendorByIdAdminQuery(id));
        if (result is null) return NotFound();
        return Ok(ApiResponse<VendorDetailDto>.Ok(result));
    }
}
