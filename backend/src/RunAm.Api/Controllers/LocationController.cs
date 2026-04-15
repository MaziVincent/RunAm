using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using RunAm.Domain.Interfaces;
using RunAm.Shared.DTOs;

namespace RunAm.Api.Controllers;

[Route("api/v1/location")]
[EnableRateLimiting("api")]
public class LocationController : BaseApiController
{
    private readonly IGeocodingService _geocodingService;

    public LocationController(IGeocodingService geocodingService) => _geocodingService = geocodingService;

    /// <summary>Autocomplete address suggestions (restricted to Nigeria)</summary>
    [HttpGet("autocomplete")]
    [Authorize]
    public async Task<IActionResult> Autocomplete([FromQuery] string query, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(query) || query.Length < 3)
            return Ok(ApiResponse<IReadOnlyList<PlaceSuggestion>>.Ok([]));

        var suggestions = await _geocodingService.AutocompleteAsync(query, ct);
        return Ok(ApiResponse<IReadOnlyList<PlaceSuggestion>>.Ok(suggestions));
    }

    /// <summary>Geocode a place ID to get address details and coordinates</summary>
    [HttpGet("geocode/{placeId}")]
    [Authorize]
    public async Task<IActionResult> Geocode(string placeId, CancellationToken ct)
    {
        var result = await _geocodingService.GeocodeAsync(placeId, ct);
        if (result is null)
            return NotFound(ApiResponse<object>.Fail("Place not found"));

        return Ok(ApiResponse<GeocodeResult>.Ok(result));
    }

    /// <summary>Geocode a freeform address to get address details and coordinates</summary>
    [HttpGet("geocode-address")]
    [Authorize]
    public async Task<IActionResult> GeocodeAddress([FromQuery] string address, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(address))
            return BadRequest(ApiResponse<object>.Fail("Address is required"));

        var result = await _geocodingService.GeocodeAddressAsync(address, ct);
        if (result is null)
            return NotFound(ApiResponse<object>.Fail("Address could not be geocoded"));

        return Ok(ApiResponse<GeocodeResult>.Ok(result));
    }
}
