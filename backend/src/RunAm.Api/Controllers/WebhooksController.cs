using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Configuration;
using RunAm.Application.Payments.Commands;
using RunAm.Domain.Enums;
using RunAm.Shared.DTOs.Payments;

namespace RunAm.Api.Controllers;

[Route("api/v1/webhooks")]
[ApiController]
[EnableRateLimiting("webhook")]
public class WebhooksController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly IConfiguration _config;
    private readonly ILogger<WebhooksController> _logger;

    public WebhooksController(IMediator mediator, IConfiguration config, ILogger<WebhooksController> logger)
    {
        _mediator = mediator;
        _config = config;
        _logger = logger;
    }

    /// <summary>Monnify payment notification webhook</summary>
    [HttpPost("monnify")]
    public async Task<IActionResult> MonnifyWebhook()
    {
        // Read raw body for signature verification
        using var reader = new StreamReader(Request.Body);
        var body = await reader.ReadToEndAsync();

        // Verify webhook signature — FAIL CLOSED: reject if secret missing or signature invalid
        var secret = _config["Monnify:WebhookSecret"];
        if (string.IsNullOrEmpty(secret))
        {
            _logger.LogError("Monnify webhook secret is not configured — rejecting webhook");
            return StatusCode(StatusCodes.Status503ServiceUnavailable);
        }

        var signature = Request.Headers["monnify-signature"].FirstOrDefault();
        if (string.IsNullOrEmpty(signature) || !VerifySignature(body, signature, secret))
        {
            _logger.LogWarning("Invalid Monnify webhook signature");
            return Unauthorized();
        }

        var payload = JsonSerializer.Deserialize<MonnifyWebhookPayload>(body, _jsonOpts);
        if (payload is null)
            return BadRequest();

        _logger.LogInformation("Monnify webhook received: {EventType} for {Reference}",
            payload.EventType, payload.EventData?.TransactionReference);

        if (payload.EventType != "SUCCESSFUL_TRANSACTION_COMPLETION"
            || payload.EventData is not { PaymentStatus: "PAID" })
        {
            return Ok();
        }

        var data = payload.EventData;
        if (string.IsNullOrWhiteSpace(data.TransactionReference))
        {
            _logger.LogWarning("Monnify webhook missing transaction reference");
            return Ok();
        }

        // Route 1: Wallet top-up (reserved account transfer — reference starts with RUNAM-)
        if (data.Product?.Reference is { } accountRef
            && accountRef.StartsWith("RUNAM-")
            && Guid.TryParse(accountRef["RUNAM-".Length..], out var userId))
        {
            await HandleWalletTopUp(userId, accountRef, data);
        }
        // Route 2: Order payment (Card / BankTransfer — has a transactionReference matching a pending payment)
        else if (!string.IsNullOrWhiteSpace(data.TransactionReference))
        {
            await HandleOrderPayment(data);
        }

        return Ok();
    }

    private async Task HandleWalletTopUp(Guid userId, string accountRef, MonnifyWebhookEventData data)
    {
        var verification = await _mediator.Send(new VerifyMonnifyWebhookFundingCommand(
            userId,
            accountRef,
            data.TransactionReference!,
            data.PaymentReference,
            data.AmountPaid));

        if (!verification.ShouldCreditWallet)
        {
            _logger.LogWarning(
                "Monnify webhook verification failed for user {UserId} and transaction {TransactionReference}",
                userId, data.TransactionReference);
            return;
        }

        await _mediator.Send(new TopUpWalletCommand(userId, new TopUpWalletRequest(
            verification.Amount,
            PaymentMethod.BankTransfer,
            verification.PaymentReference
        )));

        _logger.LogInformation("Wallet top-up processed: {Amount} for user {UserId}",
            verification.Amount, userId);
    }

    private async Task HandleOrderPayment(MonnifyWebhookEventData data)
    {
        var confirmed = await _mediator.Send(new ConfirmOrderPaymentCommand(
            data.TransactionReference!,
            data.PaymentReference ?? data.TransactionReference!,
            data.AmountPaid));

        if (confirmed)
            _logger.LogInformation("Order payment confirmed for transaction {TransactionReference}", data.TransactionReference);
        else
            _logger.LogWarning("Order payment confirmation failed/skipped for transaction {TransactionReference}", data.TransactionReference);
    }

    private static bool VerifySignature(string body, string signature, string secret)
    {
        using var hmac = new HMACSHA512(Encoding.UTF8.GetBytes(secret));
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(body));
        var computed = Convert.ToHexString(hash).ToLowerInvariant();
        return CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(computed),
            Encoding.UTF8.GetBytes(signature.ToLowerInvariant()));
    }

    private static readonly JsonSerializerOptions _jsonOpts = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    // ── Internal webhook DTOs ───────────────────

    private record MonnifyWebhookPayload(
        string EventType,
        MonnifyWebhookEventData? EventData
    );

    private record MonnifyWebhookEventData(
        string? TransactionReference,
        string? PaymentReference,
        string? PaymentStatus,
        decimal AmountPaid,
        string? PaidOn,
        MonnifyWebhookProduct? Product
    );

    private record MonnifyWebhookProduct(
        string? Type,
        string? Reference
    );
}
