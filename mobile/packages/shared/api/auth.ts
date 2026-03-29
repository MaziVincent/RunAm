import apiClient from "./client";
import type {
	AuthResponse,
	RegisterRequest,
	LoginRequest,
	User,
} from "../types";

// ── Register ─────────────────────────────────────────────────

export interface RegisterResponse {
	message: string;
	phoneNumber: string;
	requiresVerification: boolean;
}

export function register(
	data: RegisterRequest & { role?: string },
): Promise<RegisterResponse> {
	return apiClient.post<RegisterResponse>("/auth/register", data);
}

// ── Verify OTP ───────────────────────────────────────────────

export interface VerifyOtpRequest {
	phoneNumber: string;
	code: string;
}

export function verifyOtp(data: VerifyOtpRequest): Promise<AuthResponse> {
	return apiClient.post<AuthResponse>("/auth/verify-otp", data);
}

// ── Resend OTP ───────────────────────────────────────────────

export function resendOtp(phoneNumber: string): Promise<RegisterResponse> {
	return apiClient.post<RegisterResponse>("/auth/resend-otp", { phoneNumber });
}

// ── Login ────────────────────────────────────────────────────

export function login(data: LoginRequest): Promise<AuthResponse> {
	return apiClient.post<AuthResponse>("/auth/login", data);
}

// ── Refresh Token ────────────────────────────────────────────

export interface RefreshTokenRequest {
	accessToken: string;
	refreshToken: string;
}

export function refreshToken(data: RefreshTokenRequest): Promise<AuthResponse> {
	return apiClient.post<AuthResponse>("/auth/refresh-token", data);
}
