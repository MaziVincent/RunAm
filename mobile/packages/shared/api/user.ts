import apiClient from "./client";
import type { User } from "../types";

// ── Get Current User ─────────────────────────────────────────

export function getMe(): Promise<User> {
	return apiClient.get<User>("/users/me");
}

// ── Update Profile ───────────────────────────────────────────

export interface UpdateProfileRequest {
	firstName?: string;
	lastName?: string;
	phoneNumber?: string;
}

export function updateProfile(data: UpdateProfileRequest): Promise<User> {
	return apiClient.put<User>("/users/me", data);
}
