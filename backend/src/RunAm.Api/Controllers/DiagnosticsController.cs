using System.Net;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RunAm.Shared.DTOs;

namespace RunAm.Api.Controllers;

[Route("api/v1/diagnostics")]
[AllowAnonymous]
public class DiagnosticsController : BaseApiController
{
    private readonly IHttpClientFactory _httpClientFactory;

    public DiagnosticsController(IHttpClientFactory httpClientFactory)
    {
        _httpClientFactory = httpClientFactory;
    }

    /// <summary>Return the public IP used for outbound requests from this API instance.</summary>
    [HttpGet("outbound-ip")]
    [ProducesResponseType(typeof(ApiResponse<OutboundIpResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<OutboundIpResponse>), StatusCodes.Status502BadGateway)]
    public async Task<IActionResult> GetOutboundIp(CancellationToken cancellationToken)
    {
        var client = _httpClientFactory.CreateClient("OutboundIp");
        var response = (await client.GetStringAsync(string.Empty, cancellationToken)).Trim();

        if (!IPAddress.TryParse(response, out var outboundIp))
        {
            return StatusCode(
                StatusCodes.Status502BadGateway,
                ApiResponse<OutboundIpResponse>.Fail(
                    "The outbound IP provider returned an invalid response.",
                    "INVALID_OUTBOUND_IP_RESPONSE"));
        }

        return Ok(ApiResponse<OutboundIpResponse>.Ok(
            new OutboundIpResponse(outboundIp.ToString())));
    }
}

public sealed record OutboundIpResponse(string OutboundIp);
