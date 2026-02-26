using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RunAm.Application.Payments.Commands;
using RunAm.Application.Payments.Queries;
using RunAm.Shared.DTOs;
using RunAm.Shared.DTOs.Payments;

namespace RunAm.Api.Controllers;

[Route("api/v1/payments")]
[Authorize]
public class PaymentsController : BaseApiController
{
    private readonly IMediator _mediator;

    public PaymentsController(IMediator mediator) => _mediator = mediator;

    // ── Wallet ──────────────────────────────────

    /// <summary>Get current user's wallet</summary>
    [HttpGet("wallet")]
    [ProducesResponseType(typeof(ApiResponse<WalletDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetWallet()
    {
        var result = await _mediator.Send(new GetWalletQuery(GetUserId()));
        return Ok(ApiResponse<WalletDto>.Ok(result));
    }

    /// <summary>Get wallet transactions</summary>
    [HttpGet("wallet/transactions")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<WalletTransactionDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTransactions([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var result = await _mediator.Send(new GetWalletTransactionsQuery(GetUserId(), page, pageSize));
        return Ok(ApiResponse<IReadOnlyList<WalletTransactionDto>>.Ok(result));
    }

    /// <summary>Top up wallet</summary>
    [HttpPost("wallet/topup")]
    [ProducesResponseType(typeof(ApiResponse<WalletDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> TopUp([FromBody] TopUpWalletRequest request)
    {
        var result = await _mediator.Send(new TopUpWalletCommand(GetUserId(), request));
        return Ok(ApiResponse<WalletDto>.Ok(result));
    }

    /// <summary>Withdraw from wallet</summary>
    [HttpPost("wallet/withdraw")]
    [ProducesResponseType(typeof(ApiResponse<WalletDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Withdraw([FromBody] WithdrawRequest request)
    {
        var result = await _mediator.Send(new WithdrawCommand(GetUserId(), request));
        return Ok(ApiResponse<WalletDto>.Ok(result));
    }

    // ── Payments ────────────────────────────────

    /// <summary>Process a payment for an errand</summary>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<PaymentDto>), StatusCodes.Status201Created)]
    public async Task<IActionResult> ProcessPayment([FromBody] ProcessPaymentRequest request)
    {
        var result = await _mediator.Send(new ProcessPaymentCommand(GetUserId(), request));
        return Created("", ApiResponse<PaymentDto>.Ok(result));
    }

    /// <summary>Add tip for a completed errand</summary>
    [HttpPost("{errandId:guid}/tip")]
    [ProducesResponseType(typeof(ApiResponse<PaymentDto>), StatusCodes.Status201Created)]
    public async Task<IActionResult> AddTip(Guid errandId, [FromBody] TipRequest request)
    {
        var result = await _mediator.Send(new AddTipCommand(GetUserId(), errandId, request.Amount));
        return Created("", ApiResponse<PaymentDto>.Ok(result));
    }

    // ── Promo Codes ─────────────────────────────

    /// <summary>Validate a promo code</summary>
    [HttpPost("promo/validate")]
    [ProducesResponseType(typeof(ApiResponse<PromoCodeValidationResult>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ValidatePromo([FromBody] ValidatePromoCodeRequest request)
    {
        var result = await _mediator.Send(new ValidatePromoCodeCommand(request));
        return Ok(ApiResponse<PromoCodeValidationResult>.Ok(result));
    }

    /// <summary>Get promo codes (admin)</summary>
    [HttpGet("promo")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<PromoCodeDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPromoCodes([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var result = await _mediator.Send(new GetPromoCodesQuery(page, pageSize));
        return Ok(ApiResponse<IReadOnlyList<PromoCodeDto>>.Ok(result));
    }

    /// <summary>Create a promo code (admin)</summary>
    [HttpPost("promo")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(ApiResponse<PromoCodeDto>), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreatePromo([FromBody] CreatePromoCodeRequest request)
    {
        var result = await _mediator.Send(new CreatePromoCodeCommand(request));
        return Created("", ApiResponse<PromoCodeDto>.Ok(result));
    }

    // ── Rider Earnings ──────────────────────────

    /// <summary>Get rider earnings summary</summary>
    [HttpGet("earnings")]
    [Authorize(Roles = "Rider")]
    [ProducesResponseType(typeof(ApiResponse<EarningsSummaryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetEarnings()
    {
        var result = await _mediator.Send(new GetRiderEarningsQuery(GetUserId()));
        return Ok(ApiResponse<EarningsSummaryDto>.Ok(result));
    }

    /// <summary>Get rider payouts</summary>
    [HttpGet("payouts")]
    [Authorize(Roles = "Rider")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<RiderPayoutDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPayouts([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var result = await _mediator.Send(new GetRiderPayoutsQuery(GetUserId(), page, pageSize));
        return Ok(ApiResponse<IReadOnlyList<RiderPayoutDto>>.Ok(result));
    }

    /// <summary>Request a payout</summary>
    [HttpPost("payouts")]
    [Authorize(Roles = "Rider")]
    [ProducesResponseType(typeof(ApiResponse<RiderPayoutDto>), StatusCodes.Status201Created)]
    public async Task<IActionResult> RequestPayout()
    {
        var now = DateTime.UtcNow;
        var result = await _mediator.Send(new CreateRiderPayoutCommand(GetUserId(), now.AddDays(-7), now));
        return Created("", ApiResponse<RiderPayoutDto>.Ok(result));
    }
}
