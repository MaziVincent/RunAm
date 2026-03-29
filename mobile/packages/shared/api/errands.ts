import apiClient from "./client";
import type {
	Errand,
	CreateErrandRequest,
	PriceEstimate,
	PaginatedResponse,
} from "../types";

// ── List Errands ─────────────────────────────────────────────

interface GetErrandsParams {
	page?: number;
	pageSize?: number;
}

export function getErrands(
	params?: GetErrandsParams,
): Promise<PaginatedResponse<Errand>> {
	return apiClient.get<PaginatedResponse<Errand>>(
		"/errands",
		params as Record<string, string | number | boolean | undefined>,
	);
}

// ── Get Errand by ID ─────────────────────────────────────────

export function getErrandById(id: string): Promise<Errand> {
	return apiClient.get<Errand>(`/errands/${id}`);
}

// ── Create Errand ────────────────────────────────────────────

export function createErrand(data: CreateErrandRequest): Promise<Errand> {
	return apiClient.post<Errand>("/errands", data);
}

// ── Cancel Errand ────────────────────────────────────────────

export function cancelErrand(id: string, reason: string): Promise<Errand> {
	return apiClient.patch<Errand>(`/errands/${id}/cancel`, { reason });
}

// ── Price Estimate ───────────────────────────────────────────

export interface PriceEstimateParams {
	category: string;
	pickupLatitude: number;
	pickupLongitude: number;
	dropoffLatitude: number;
	dropoffLongitude: number;
	packageSize?: string;
	packageWeight?: number;
	priority?: string;
}

export function getDeliveryEstimate(
	params: PriceEstimateParams,
): Promise<PriceEstimate> {
	return apiClient.get<PriceEstimate>(
		"/errands/estimate",
		params as Record<string, string | number | boolean | undefined>,
	);
}
