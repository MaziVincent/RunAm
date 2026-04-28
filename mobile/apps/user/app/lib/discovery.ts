import type { Vendor } from "@runam/shared/types";

const EARTH_RADIUS_KM = 6371;

function toRadians(value: number): number {
	return (value * Math.PI) / 180;
}

export function calculateDistanceKm(
	fromLatitude: number,
	fromLongitude: number,
	toLatitude: number,
	toLongitude: number,
): number {
	const latitudeDelta = toRadians(toLatitude - fromLatitude);
	const longitudeDelta = toRadians(toLongitude - fromLongitude);
	const fromLatitudeRad = toRadians(fromLatitude);
	const toLatitudeRad = toRadians(toLatitude);

	const haversine =
		Math.sin(latitudeDelta / 2) ** 2 +
		Math.cos(fromLatitudeRad) *
			Math.cos(toLatitudeRad) *
			Math.sin(longitudeDelta / 2) ** 2;

	return (
		EARTH_RADIUS_KM *
		2 *
		Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
	);
}

export function getVendorDistanceKm(
	vendor: Pick<Vendor, "latitude" | "longitude">,
	latitude?: number | null,
	longitude?: number | null,
): number | null {
	if (latitude == null || longitude == null) {
		return null;
	}

	if (vendor.latitude === 0 && vendor.longitude === 0) {
		return null;
	}

	return calculateDistanceKm(
		latitude,
		longitude,
		vendor.latitude,
		vendor.longitude,
	);
}

export function getVendorDiscoveryTags(vendor: Vendor): string[] {
	const tags = new Set<string>();

	for (const category of vendor.serviceCategories.slice(0, 2)) {
		tags.add(category.name);
	}

	if (vendor.estimatedPrepTimeMinutes <= 25) {
		tags.add("Fast prep");
	}

	if (vendor.rating >= 4.6) {
		tags.add("Top rated");
	}

	if (vendor.totalOrders >= 50) {
		tags.add("Popular");
	}

	return Array.from(tags).slice(0, 4);
}
