import apiClient from "./client";

// ── ETA ──────────────────────────────────────────────────────

export interface EtaParams {
	riderLat: number;
	riderLng: number;
	destLat: number;
	destLng: number;
}

export interface EtaResponse {
	etaSeconds: number;
	distanceMeters: number;
	estimatedArrival: string;
}

export function getEta(params: EtaParams): Promise<EtaResponse> {
	return apiClient.get<EtaResponse>(
		"/tracking/eta",
		params as Record<string, string | number | boolean | undefined>,
	);
}

// ── Geofence Check ───────────────────────────────────────────

export interface CheckGeofenceRequest {
	errandId: string;
	riderId: string;
	riderLat: number;
	riderLng: number;
	targetLat: number;
	targetLng: number;
	targetType: string;
}

export interface GeofenceEvent {
	errandId: string;
	riderId: string;
	eventType: string;
	latitude: number;
	longitude: number;
	timestamp: string;
}

export function checkGeofence(
	data: CheckGeofenceRequest,
): Promise<GeofenceEvent | null> {
	return apiClient.post<GeofenceEvent | null>("/tracking/geofence", data);
}
