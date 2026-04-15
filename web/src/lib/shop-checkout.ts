export interface RoutePoint {
	id: string;
	latitude: number;
	longitude: number;
}

export interface DeliveryPricingModel {
	baseFare: number;
	perKmRate: number;
}

function toRadians(value: number): number {
	return (value * Math.PI) / 180;
}

export function haversineDistanceKm(
	start: Pick<RoutePoint, "latitude" | "longitude">,
	end: Pick<RoutePoint, "latitude" | "longitude">,
): number {
	const earthRadiusKm = 6371;
	const dLat = toRadians(end.latitude - start.latitude);
	const dLng = toRadians(end.longitude - start.longitude);
	const lat1 = toRadians(start.latitude);
	const lat2 = toRadians(end.latitude);

	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);

	return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function calculateShortestRouteDistanceKm(
	vendors: RoutePoint[],
	destination: Pick<RoutePoint, "latitude" | "longitude">,
): number {
	if (vendors.length === 0) return 0;
	if (vendors.length === 1) {
		return haversineDistanceKm(vendors[0], destination);
	}

	if (vendors.length > 7) {
		const remaining = [...vendors];
		let current = remaining.shift()!;
		let totalDistance = 0;

		while (remaining.length > 0) {
			let nearestIndex = 0;
			let nearestDistance = Number.POSITIVE_INFINITY;

			remaining.forEach((candidate, index) => {
				const distance = haversineDistanceKm(current, candidate);
				if (distance < nearestDistance) {
					nearestDistance = distance;
					nearestIndex = index;
				}
			});

			totalDistance += nearestDistance;
			current = remaining.splice(nearestIndex, 1)[0];
		}

		return totalDistance + haversineDistanceKm(current, destination);
	}

	let bestDistance = Number.POSITIVE_INFINITY;
	const used = Array(vendors.length).fill(false);

	function visit(lastIndex: number | null, visitedCount: number, distanceSoFar: number) {
		if (distanceSoFar >= bestDistance) return;

		if (visitedCount === vendors.length) {
			if (lastIndex === null) return;
			bestDistance = Math.min(
				bestDistance,
				distanceSoFar + haversineDistanceKm(vendors[lastIndex], destination),
			);
			return;
		}

		for (let index = 0; index < vendors.length; index += 1) {
			if (used[index]) continue;
			used[index] = true;
			visit(
				index,
				visitedCount + 1,
				distanceSoFar +
					(lastIndex === null
						? 0
						: haversineDistanceKm(vendors[lastIndex], vendors[index])),
			);
			used[index] = false;
		}
	}

	visit(null, 0, 0);
	return Number.isFinite(bestDistance) ? bestDistance : 0;
}

export function calculateDeliveryFee(
	distanceKm: number,
	pricing: DeliveryPricingModel,
): number {
	return pricing.baseFare + pricing.perKmRate * distanceKm;
}

export function splitAmountByWeights(amount: number, weights: number[]): number[] {
	if (weights.length === 0) return [];

	const totalWeight = weights.reduce((sum, value) => sum + Math.max(value, 0), 0);
	const normalizedWeights =
		totalWeight > 0
			? weights.map((value) => Math.max(value, 0) / totalWeight)
			: weights.map(() => 1 / weights.length);

	const totalMinorUnits = Math.round(amount * 100);
	const rawShares = normalizedWeights.map((weight) => weight * totalMinorUnits);
	const roundedDown = rawShares.map((share) => Math.floor(share));
	let remainder = totalMinorUnits - roundedDown.reduce((sum, share) => sum + share, 0);

	const rankedRemainders = rawShares
		.map((share, index) => ({ index, remainder: share - Math.floor(share) }))
		.sort((left, right) => right.remainder - left.remainder);

	for (const entry of rankedRemainders) {
		if (remainder <= 0) break;
		roundedDown[entry.index] += 1;
		remainder -= 1;
	}

	return roundedDown.map((share) => share / 100);
}