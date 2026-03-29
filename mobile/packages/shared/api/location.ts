import apiClient from "./client";

// ── Autocomplete ─────────────────────────────────────────────

export interface PlaceSuggestion {
	placeId: string;
	description: string;
}

export function autocomplete(query: string): Promise<PlaceSuggestion[]> {
	return apiClient.get<PlaceSuggestion[]>("/location/autocomplete", {
		query,
	});
}

// ── Geocode ──────────────────────────────────────────────────

export interface GeocodeResult {
	address: string;
	city: string;
	state: string;
	latitude: number;
	longitude: number;
}

export function geocode(placeId: string): Promise<GeocodeResult> {
	return apiClient.get<GeocodeResult>(`/location/geocode/${placeId}`);
}
