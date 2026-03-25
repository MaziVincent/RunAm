namespace RunAm.Domain.Interfaces;

public record PlaceSuggestion(string PlaceId, string Description);

public record GeocodeResult(string Address, string City, string State, double Latitude, double Longitude);

public interface IGeocodingService
{
    Task<IReadOnlyList<PlaceSuggestion>> AutocompleteAsync(string input, CancellationToken ct = default);
    Task<GeocodeResult?> GeocodeAsync(string placeId, CancellationToken ct = default);
}
