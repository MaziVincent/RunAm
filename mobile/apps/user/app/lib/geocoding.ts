import * as Location from "expo-location";

export interface GeocodedPoint {
	latitude: number;
	longitude: number;
}

function formatAddressFromParts(
	parts: Location.LocationGeocodedAddress,
): string | null {
	const pieces = [
		parts.name,
		parts.street,
		parts.city,
		parts.region,
		parts.country,
	]
		.map((piece) => piece?.trim())
		.filter((piece): piece is string => Boolean(piece));

	return pieces.length > 0 ? pieces.join(", ") : null;
}

export async function geocodeAddress(address: string): Promise<GeocodedPoint> {
	const normalizedAddress = address.trim();
	if (!normalizedAddress) {
		throw new Error("Enter a full address first.");
	}

	const results = await Location.geocodeAsync(normalizedAddress);
	const firstMatch = results[0];

	if (!firstMatch) {
		throw new Error(
			"We couldn't locate that address. Please enter a more specific street, area, or landmark.",
		);
	}

	return {
		latitude: firstMatch.latitude,
		longitude: firstMatch.longitude,
	};
}

export async function reverseGeocodeLocation(
	latitude: number,
	longitude: number,
): Promise<string | null> {
	const results = await Location.reverseGeocodeAsync({ latitude, longitude });
	const firstMatch = results[0];

	if (!firstMatch) {
		return null;
	}

	return formatAddressFromParts(firstMatch);
}
