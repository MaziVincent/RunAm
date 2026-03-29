import apiClient, { type PaginatedResult } from "./client";
import type { Review, ReviewSummary } from "../types";

// ── Submit Review ────────────────────────────────────────────

export interface CreateReviewRequest {
	errandId: string;
	rating: number;
	comment?: string;
}

export function createReview(data: CreateReviewRequest): Promise<Review> {
	return apiClient.post<Review>("/reviews", data);
}

// ── My Reviews ───────────────────────────────────────────────

interface GetReviewsParams {
	page?: number;
	pageSize?: number;
}

export function getMyReviews(
	params?: GetReviewsParams,
): Promise<PaginatedResult<Review>> {
	return apiClient.getPaginated<Review>(
		"/reviews/me",
		params as Record<string, string | number | boolean | undefined>,
	);
}

export function getMyReviewSummary(): Promise<ReviewSummary> {
	return apiClient.get<ReviewSummary>("/reviews/me/summary");
}

// ── User Reviews ─────────────────────────────────────────────

export function getUserReviews(
	userId: string,
	params?: GetReviewsParams,
): Promise<PaginatedResult<Review>> {
	return apiClient.getPaginated<Review>(
		`/reviews/user/${userId}`,
		params as Record<string, string | number | boolean | undefined>,
	);
}

export function getUserReviewSummary(userId: string): Promise<ReviewSummary> {
	return apiClient.get<ReviewSummary>(`/reviews/user/${userId}/summary`);
}

// ── Errand Reviews ───────────────────────────────────────────

export function getErrandReviews(errandId: string): Promise<Review[]> {
	return apiClient.get<Review[]>(`/reviews/errand/${errandId}`);
}

// ── Flag Review ──────────────────────────────────────────────

export function flagReview(id: string, reason: string): Promise<Review> {
	return apiClient.post<Review>(`/reviews/${id}/flag`, { reason });
}
