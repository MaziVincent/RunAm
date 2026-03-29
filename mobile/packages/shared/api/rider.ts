import apiClient from "./client";
import type {
	RiderProfile,
	Errand,
	PaginatedResponse,
	EarningsSummary,
	VehicleType,
} from "../types";

// ── Create Rider Profile ─────────────────────────────────────

export interface CreateRiderProfileRequest {
	vehicleType: VehicleType;
	licensePlate?: string;
}

export function createRiderProfile(
	data: CreateRiderProfileRequest,
): Promise<RiderProfile> {
	return apiClient.post<RiderProfile>("/rider/profile", data);
}

// ── Update Status (Online/Offline) ───────────────────────────

export function updateRiderStatus(isOnline: boolean): Promise<RiderProfile> {
	return apiClient.put<RiderProfile>("/rider/status", { isOnline });
}

// ── Accept Task ──────────────────────────────────────────────

export function acceptTask(id: string): Promise<Errand> {
	return apiClient.post<Errand>(`/rider/tasks/${id}/accept`);
}

// ── Update Task Status ───────────────────────────────────────

export interface UpdateTaskStatusRequest {
	status: string;
	latitude?: number;
	longitude?: number;
	notes?: string;
	imageUrl?: string;
}

export function updateTaskStatus(
	id: string,
	data: UpdateTaskStatusRequest,
): Promise<Errand> {
	return apiClient.patch<Errand>(`/rider/tasks/${id}/status`, data);
}

// ── Batch Location Update ────────────────────────────────────

export interface LocationPoint {
	latitude: number;
	longitude: number;
	heading?: number;
	speed?: number;
	recordedAt: string;
}

export function batchLocationUpdate(points: LocationPoint[]): Promise<void> {
	return apiClient.post<void>("/rider/location", { points });
}

// ── Earnings ─────────────────────────────────────────────────

export function getRiderEarnings(): Promise<EarningsSummary> {
	return apiClient.get<EarningsSummary>("/payments/earnings");
}

// ── Payouts ──────────────────────────────────────────────────

export interface RiderPayout {
	id: string;
	amount: number;
	currency: string;
	status: string;
	paymentReference?: string;
	failureReason?: string;
	processedAt?: string;
	periodStart: string;
	periodEnd: string;
	errandCount: number;
	createdAt: string;
}

interface GetPayoutsParams {
	page?: number;
	pageSize?: number;
}

export function getPayouts(
	params?: GetPayoutsParams,
): Promise<PaginatedResponse<RiderPayout>> {
	return apiClient.get<PaginatedResponse<RiderPayout>>(
		"/payments/payouts",
		params as Record<string, string | number | boolean | undefined>,
	);
}

export function requestPayout(): Promise<RiderPayout> {
	return apiClient.post<RiderPayout>("/payments/payouts");
}
