using System.Net.Http.Headers;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using RunAm.Domain.Interfaces;

namespace RunAm.Infrastructure.Services;

public class GoogleMapsGeocodingService : IGeocodingService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<GoogleMapsGeocodingService> _logger;
    private readonly string _apiKey;

    public GoogleMapsGeocodingService(
        HttpClient httpClient,
        IConfiguration configuration,
        ILogger<GoogleMapsGeocodingService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
        _apiKey = configuration["GoogleMaps:ApiKey"] ?? "";
        _httpClient.BaseAddress = new Uri("https://maps.googleapis.com/");
        _httpClient.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
    }

    public async Task<IReadOnlyList<PlaceSuggestion>> AutocompleteAsync(string input, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(_apiKey))
        {
            _logger.LogWarning("Google Maps API key is not configured");
            return [];
        }

        var url = $"maps/api/place/autocomplete/json?input={Uri.EscapeDataString(input)}&components=country:ng&key={_apiKey}";

        var response = await _httpClient.GetAsync(url, ct);
        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadAsStringAsync(ct);
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        var status = root.GetProperty("status").GetString();
        if (status != "OK" && status != "ZERO_RESULTS")
        {
            _logger.LogWarning("Places Autocomplete API returned status: {Status}", status);
            return [];
        }

        var predictions = root.GetProperty("predictions");
        var results = new List<PlaceSuggestion>();

        foreach (var prediction in predictions.EnumerateArray())
        {
            var placeId = prediction.GetProperty("place_id").GetString() ?? "";
            var description = prediction.GetProperty("description").GetString() ?? "";
            results.Add(new PlaceSuggestion(placeId, description));
        }

        return results;
    }

    public async Task<GeocodeResult?> GeocodeAsync(string placeId, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(_apiKey))
        {
            _logger.LogWarning("Google Maps API key is not configured");
            return null;
        }

        var url = $"maps/api/geocode/json?place_id={Uri.EscapeDataString(placeId)}&key={_apiKey}";
        return await ExecuteGeocodeAsync(url, ct);
    }

    public async Task<GeocodeResult?> GeocodeAddressAsync(string address, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(_apiKey))
        {
            _logger.LogWarning("Google Maps API key is not configured");
            return null;
        }

        var url = $"maps/api/geocode/json?address={Uri.EscapeDataString(address)}&components=country:NG&key={_apiKey}";
        return await ExecuteGeocodeAsync(url, ct);
    }

    private async Task<GeocodeResult?> ExecuteGeocodeAsync(string url, CancellationToken ct)
    {
        var response = await _httpClient.GetAsync(url, ct);
        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadAsStringAsync(ct);
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        var status = root.GetProperty("status").GetString();
        if (status != "OK")
        {
            _logger.LogWarning("Geocoding API returned status: {Status}", status);
            return null;
        }

        var results = root.GetProperty("results");
        if (results.GetArrayLength() == 0) return null;

        var result = results[0];
        var location = result.GetProperty("geometry").GetProperty("location");
        var lat = location.GetProperty("lat").GetDouble();
        var lng = location.GetProperty("lng").GetDouble();

        var components = result.GetProperty("address_components");
        var formattedAddress = result.GetProperty("formatted_address").GetString() ?? "";

        string city = "", state = "", streetNumber = "", route = "";

        foreach (var component in components.EnumerateArray())
        {
            var types = component.GetProperty("types");
            var longName = component.GetProperty("long_name").GetString() ?? "";

            foreach (var type in types.EnumerateArray())
            {
                var t = type.GetString();
                switch (t)
                {
                    case "street_number": streetNumber = longName; break;
                    case "route": route = longName; break;
                    case "locality": if (string.IsNullOrEmpty(city)) city = longName; break;
                    case "administrative_area_level_2": if (string.IsNullOrEmpty(city)) city = longName; break;
                    case "administrative_area_level_1": state = longName; break;
                }
            }
        }

        var address = string.Join(" ", new[] { streetNumber, route }.Where(s => !string.IsNullOrEmpty(s)));
        if (string.IsNullOrEmpty(address)) address = formattedAddress;

        return new GeocodeResult(address, city, state, lat, lng);
    }
}
