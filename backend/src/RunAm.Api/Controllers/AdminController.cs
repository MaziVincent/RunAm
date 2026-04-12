using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RunAm.Application.Admin.Commands;
using RunAm.Application.Matching.Queries;
using RunAm.Application.Notifications.Commands;
using RunAm.Application.Payments.Commands;
using RunAm.Application.Products.Commands;
using RunAm.Application.Reviews.Commands;
using RunAm.Application.Reviews.Queries;
using RunAm.Application.Vendors.Queries;
using RunAm.Domain.Entities;
using RunAm.Domain.Enums;
using RunAm.Domain.Interfaces;
using RunAm.Infrastructure.Persistence;
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
    private readonly IRiderPayoutRepository _payoutRepo;
    private readonly AppDbContext _db;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IUnitOfWork _uow;

    public AdminController(
        IMediator mediator,
        IRiderRepository riderRepo,
        IErrandRepository errandRepo,
        IRiderPayoutRepository payoutRepo,
        AppDbContext db,
        UserManager<ApplicationUser> userManager,
        IUnitOfWork uow)
    {
        _mediator = mediator;
        _riderRepo = riderRepo;
        _errandRepo = errandRepo;
        _payoutRepo = payoutRepo;
        _db = db;
        _userManager = userManager;
        _uow = uow;
    }

    /// <summary>Get dashboard stats</summary>
    [HttpGet("dashboard/stats")]
    [ProducesResponseType(typeof(ApiResponse<DashboardStatsDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDashboardStats()
    {
        var today = DateTime.UtcNow.Date;

        var totalUsers = await _userManager.Users.CountAsync();
        var activeRiders = await _db.RiderProfiles.CountAsync(r => r.IsOnline);
        var todaysErrands = await _db.Errands.CountAsync(e => e.CreatedAt >= today);
        var revenue = await _db.Payments
            .Where(p => p.Status == PaymentStatus.Completed)
            .SumAsync(p => (decimal?)p.Amount) ?? 0m;
        var totalVendors = await _db.Vendors.CountAsync();
        var pendingVendors = await _db.Vendors.CountAsync(v => v.Status == VendorStatus.Pending);

        var stats = new DashboardStatsDto(totalUsers, activeRiders, todaysErrands, revenue, totalVendors, pendingVendors);
        return Ok(ApiResponse<DashboardStatsDto>.Ok(stats));
    }

    /// <summary>Get all users (admin, paginated)</summary>
    [HttpGet("users")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<UserDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUsers(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] int? role = null)
    {
        var query = _userManager.Users.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(u =>
                u.FirstName.ToLower().Contains(s) ||
                u.LastName.ToLower().Contains(s) ||
                (u.Email != null && u.Email.ToLower().Contains(s)));
        }

        if (role.HasValue)
            query = query.Where(u => (int)u.Role == role.Value);

        var totalCount = await query.CountAsync();

        var users = await query
            .OrderByDescending(u => u.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new UserDto(
                u.Id, u.Email ?? "", u.PhoneNumber ?? "", u.FirstName, u.LastName,
                u.ProfileImageUrl, u.Role, u.Status, u.IsPhoneVerified, u.IsEmailVerified, u.CreatedAt))
            .ToListAsync();

        return Ok(ApiResponse<IReadOnlyList<UserDto>>.Ok(users, new PaginationMeta
        {
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount
        }));
    }

    /// <summary>Get all riders (admin, paginated)</summary>
    [HttpGet("riders")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<RiderProfileDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetRiders(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] int? approvalStatus = null)
    {
        var query = _db.RiderProfiles.Include(r => r.User).AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(r =>
                r.User.FirstName.ToLower().Contains(s) ||
                r.User.LastName.ToLower().Contains(s));
        }

        if (approvalStatus.HasValue)
            query = query.Where(r => (int)r.ApprovalStatus == approvalStatus.Value);

        var totalCount = await query.CountAsync();

        var riders = await query
            .OrderByDescending(r => r.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(r => new RiderProfileDto(
                r.Id, r.UserId, r.User.FirstName + " " + r.User.LastName,
                r.VehicleType, r.LicensePlate, r.ApprovalStatus, r.Rating,
                r.TotalCompletedTasks, r.IsOnline, r.CurrentLatitude, r.CurrentLongitude,
                r.LastLocationUpdate, r.CreatedAt))
            .ToListAsync();

        return Ok(ApiResponse<IReadOnlyList<RiderProfileDto>>.Ok(riders, new PaginationMeta
        {
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount
        }));
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

    /// <summary>Get errand detail (admin, no ownership check)</summary>
    [HttpGet("errands/{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<ErrandDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetErrandDetail(Guid id)
    {
        var errand = await _errandRepo.GetByIdWithDetailsAsync(id);
        if (errand is null) return NotFound();

        var dto = new ErrandDto(
            errand.Id, errand.CustomerId, errand.Customer?.FullName ?? "", errand.RiderId, errand.Rider?.FullName,
            errand.Category, errand.Status, errand.Description, errand.SpecialInstructions,
            errand.Priority, errand.ScheduledAt, errand.PickupAddress, errand.PickupLatitude, errand.PickupLongitude,
            errand.DropoffAddress, errand.DropoffLatitude, errand.DropoffLongitude,
            errand.EstimatedDistance, errand.EstimatedDuration, errand.PackageSize, errand.PackageWeight,
            errand.IsFragile, errand.RequiresPhotoProof, errand.RecipientName, errand.RecipientPhone,
            errand.TotalAmount, errand.AcceptedAt, errand.PickedUpAt, errand.DeliveredAt, errand.CancelledAt,
            errand.CancellationReason, errand.CreatedAt,
            errand.StatusHistory.Select(s => new ErrandStatusHistoryDto(s.Id, s.Status, s.Latitude, s.Longitude, s.Notes, s.ImageUrl, s.CreatedAt)).ToList(),
            errand.Stops.Select(s => new ErrandStopDto(s.Id, s.StopOrder, s.Address, s.Latitude, s.Longitude, s.ContactName, s.ContactPhone, s.Instructions, s.Status, s.ArrivedAt, s.CompletedAt)).ToList(),
            errand.VendorId, errand.Vendor?.BusinessName, errand.VendorOrderStatus != null ? (int)errand.VendorOrderStatus : null
        );
        return Ok(ApiResponse<ErrandDto>.Ok(dto));
    }

    /// <summary>Assign a rider to an errand</summary>
    [HttpPatch("errands/{id:guid}/assign-rider")]
    [ProducesResponseType(typeof(ApiResponse<ErrandDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> AssignRider(Guid id, [FromBody] AssignRiderRequest request)
    {
        var errand = await _errandRepo.GetByIdWithDetailsAsync(id);
        if (errand is null) return NotFound();

        var rider = await _riderRepo.GetByIdAsync(request.RiderId);
        if (rider is null) return BadRequest(ApiResponse<object>.Fail("Rider not found"));

        errand.RiderId = rider.UserId;
        if (errand.Status == ErrandStatus.Pending)
        {
            errand.TransitionTo(ErrandStatus.Accepted);
        }

        await _errandRepo.UpdateAsync(errand);
        await _uow.SaveChangesAsync();

        // Reload with details
        errand = await _errandRepo.GetByIdWithDetailsAsync(id);
        var dto = new ErrandDto(
            errand!.Id, errand.CustomerId, errand.Customer?.FullName ?? "", errand.RiderId, errand.Rider?.FullName,
            errand.Category, errand.Status, errand.Description, errand.SpecialInstructions,
            errand.Priority, errand.ScheduledAt, errand.PickupAddress, errand.PickupLatitude, errand.PickupLongitude,
            errand.DropoffAddress, errand.DropoffLatitude, errand.DropoffLongitude,
            errand.EstimatedDistance, errand.EstimatedDuration, errand.PackageSize, errand.PackageWeight,
            errand.IsFragile, errand.RequiresPhotoProof, errand.RecipientName, errand.RecipientPhone,
            errand.TotalAmount, errand.AcceptedAt, errand.PickedUpAt, errand.DeliveredAt, errand.CancelledAt,
            errand.CancellationReason, errand.CreatedAt,
            errand.StatusHistory.Select(s => new ErrandStatusHistoryDto(s.Id, s.Status, s.Latitude, s.Longitude, s.Notes, s.ImageUrl, s.CreatedAt)).ToList(),
            errand.Stops.Select(s => new ErrandStopDto(s.Id, s.StopOrder, s.Address, s.Latitude, s.Longitude, s.ContactName, s.ContactPhone, s.Instructions, s.Status, s.ArrivedAt, s.CompletedAt)).ToList(),
            errand.VendorId, errand.Vendor?.BusinessName, errand.VendorOrderStatus != null ? (int)errand.VendorOrderStatus : null
        );
        return Ok(ApiResponse<ErrandDto>.Ok(dto));
    }

    /// <summary>Get available riders for assignment</summary>
    [HttpGet("riders/available")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<RiderProfileDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAvailableRiders()
    {
        var riders = await _db.RiderProfiles
            .Include(r => r.User)
            .Where(r => r.IsOnline && r.ApprovalStatus == ApprovalStatus.Approved)
            .ToListAsync();
        var dtos = riders.Select(r => new RiderProfileDto(
            r.Id, r.UserId, r.User?.FullName ?? "", r.VehicleType, r.LicensePlate,
            r.ApprovalStatus, r.Rating, r.TotalCompletedTasks, r.IsOnline,
            r.CurrentLatitude, r.CurrentLongitude, r.LastLocationUpdate, r.CreatedAt
        )).ToList();
        return Ok(ApiResponse<IReadOnlyList<RiderProfileDto>>.Ok(dtos));
    }

    /// <summary>Get all errands (admin)</summary>
    [HttpGet("errands")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<ErrandDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetErrands([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? search = null, [FromQuery] int? status = null)
    {
        var (errands, totalCount) = await _errandRepo.GetAllAsync(page, pageSize, search, status);
        var dtos = errands.Select(e => new ErrandDto(
            e.Id, e.CustomerId, e.Customer?.FullName ?? "", e.RiderId, e.Rider?.FullName,
            e.Category, e.Status, e.Description, e.SpecialInstructions,
            e.Priority, e.ScheduledAt, e.PickupAddress, e.PickupLatitude, e.PickupLongitude,
            e.DropoffAddress, e.DropoffLatitude, e.DropoffLongitude,
            e.EstimatedDistance, e.EstimatedDuration, e.PackageSize, e.PackageWeight,
            e.IsFragile, e.RequiresPhotoProof, e.RecipientName, e.RecipientPhone,
            e.TotalAmount, e.AcceptedAt, e.PickedUpAt, e.DeliveredAt, e.CancelledAt,
            e.CancellationReason, e.CreatedAt, null, null,
            e.VendorId, e.Vendor?.BusinessName, e.VendorOrderStatus != null ? (int)e.VendorOrderStatus : null
        )).ToList();
        return Ok(ApiResponse<IReadOnlyList<ErrandDto>>.Ok(dtos, new PaginationMeta
        {
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount
        }));
    }

    // ── Finance Endpoints ───────────────────────

    /// <summary>Get finance stats (revenue + commission)</summary>
    [HttpGet("finance/stats")]
    [ProducesResponseType(typeof(ApiResponse<FinanceStatsDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetFinanceStats()
    {
        var today = DateTime.UtcNow.Date;

        var totalRevenue = await _db.Payments
            .Where(p => p.Status == PaymentStatus.Completed)
            .SumAsync(p => (decimal?)p.Amount) ?? 0m;

        var commissionEarned = await _db.Errands
            .Where(e => e.Status == ErrandStatus.Delivered)
            .SumAsync(e => (decimal?)e.CommissionAmount) ?? 0m;

        var pendingPayments = await _db.Payments
            .Where(p => p.Status == PaymentStatus.Pending)
            .SumAsync(p => (decimal?)p.Amount) ?? 0m;

        var todayRevenue = await _db.Payments
            .Where(p => p.Status == PaymentStatus.Completed && p.CreatedAt >= today)
            .SumAsync(p => (decimal?)p.Amount) ?? 0m;

        var totalTransactions = await _db.Payments.CountAsync();

        return Ok(ApiResponse<FinanceStatsDto>.Ok(new FinanceStatsDto(
            totalRevenue, commissionEarned, pendingPayments, todayRevenue, totalTransactions)));
    }

    /// <summary>Get all payments (admin)</summary>
    [HttpGet("payments")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<AdminPaymentDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPayments(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] int? status = null)
    {
        var query = _db.Payments.Include(p => p.Payer).AsQueryable();

        if (status.HasValue)
            query = query.Where(p => (int)p.Status == status.Value);

        var totalCount = await query.CountAsync();

        var payments = await query
            .OrderByDescending(p => p.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(p => new AdminPaymentDto(
                p.Id,
                p.ErrandId,
                p.Payer.FullName,
                p.Amount,
                p.Currency,
                (int)p.PaymentMethod,
                p.PaymentGatewayRef,
                (int)p.Status,
                p.CreatedAt))
            .ToListAsync();

        return Ok(ApiResponse<IReadOnlyList<AdminPaymentDto>>.Ok(payments, new PaginationMeta
        {
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount
        }));
    }

    /// <summary>Get payment detail</summary>
    [HttpGet("payments/{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<AdminPaymentDetailDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPaymentDetail(Guid id)
    {
        var payment = await _db.Payments
            .Include(p => p.Payer)
            .Include(p => p.Errand)
                .ThenInclude(e => e.Rider)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (payment is null) return NotFound();

        var dto = new AdminPaymentDetailDto(
            payment.Id,
            payment.ErrandId,
            payment.PayerId,
            payment.Payer.FullName,
            payment.Payer.Email ?? "",
            payment.Amount,
            payment.Currency,
            (int)payment.PaymentMethod,
            payment.PaymentGatewayRef,
            (int)payment.Status,
            payment.CreatedAt,
            payment.Errand?.Description,
            payment.Errand != null ? (int)payment.Errand.Status : 0,
            payment.Errand?.PickupAddress,
            payment.Errand?.DropoffAddress,
            payment.Errand?.Rider?.FullName,
            payment.Errand?.TotalAmount,
            payment.Errand?.CommissionAmount
        );

        return Ok(ApiResponse<AdminPaymentDetailDto>.Ok(dto));
    }

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
        var payouts = await _payoutRepo.GetOutstandingAsync();
        var dtos = payouts.Select(p => new RiderPayoutDto(
            p.Id,
            p.Amount,
            p.Currency,
            p.Status,
            p.PaymentReference,
            p.DestinationBankName,
            p.DestinationAccountNumber,
            p.FailureReason,
            p.ProcessedAt,
            p.PeriodStart,
            p.PeriodEnd,
            p.ErrandCount,
            p.CreatedAt)).ToList();

        return Ok(ApiResponse<IReadOnlyList<RiderPayoutDto>>.Ok(dtos, new PaginationMeta
        {
            Page = 1,
            PageSize = 100,
            TotalCount = dtos.Count
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
