using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using RunAm.Application.Payments.Commands;
using RunAm.Domain.Enums;
using RunAm.Shared.DTOs.Payments;

namespace RunAm.Api.Controllers;

[Route("api/v1/webhooks")]
[ApiController]
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

        // Verify webhook signature
        var secret = _config["Monnify:WebhookSecret"];
        if (!string.IsNullOrEmpty(secret))
        {
            var signature = Request.Headers["monnify-signature"].FirstOrDefault();
            if (string.IsNullOrEmpty(signature) || !VerifySignature(body, signature, secret))
            {
                _logger.LogWarning("Invalid Monnify webhook signature");
                return Unauthorized();
            }
        }

        var payload = JsonSerializer.Deserialize<MonnifyWebhookPayload>(body, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        if (payload is null)
            return BadRequest();

        _logger.LogInformation("Monnify webhook received: {EventType} for {Reference}",
            payload.EventType, payload.EventData?.TransactionReference);

        // Handle collection (inbound transfer to reserved account = wallet top-up)
        if (payload.EventType == "SUCCESSFUL_TRANSACTION_COMPLETION"
            && payload.EventData is { PaymentStatus: "PAID" })
        {
            var data = payload.EventData;

            // Extract userId from accountReference (format: RUNAM-<guid>)
            if (data.Product?.Reference is { } accountRef
                && accountRef.StartsWith("RUNAM-")
                && Guid.TryParse(accountRef["RUNAM-".Length..], out var userId))
            {
                await _mediator.Send(new TopUpWalletCommand(userId, new TopUpWalletRequest(
                    data.AmountPaid,
                    PaymentMethod.BankTransfer,
                    data.TransactionReference
                )));

                _logger.LogInformation("Wallet top-up processed: {Amount} for user {UserId}",
                    data.AmountPaid, userId);
            }
        }

        return Ok();
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
