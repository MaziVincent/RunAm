import apiClient, { type PaginatedResult } from "./client";
import type {
	RiderProfile,
	RiderOnboardingRequest,
	RiderApprovalStatus,
	Errand,
	RiderEarnings,
	WeeklyEarningsChart,
	RiderPerformance,
	RiderBonus,
	BankAccount,
	AddBankAccountRequest,
	Leaderboard,
	ValidateBankAccountResult,
	VehicleType,
} from "../types";

interface RiderProfileDto {
	id: string;
	userId: string;
	riderName: string;
	vehicleType: VehicleType;
	licensePlate?: string;
	approvalStatus: RiderApprovalStatus;
	rating: number;
	totalCompletedTasks: number;
	isOnline: boolean;
	currentLatitude?: number;
	currentLongitude?: number;
}

function mapRiderProfile(profile: RiderProfileDto): RiderProfile {
	const [firstName = "", ...lastNameParts] = profile.riderName.split(" ");

	return {
		id: profile.id,
		userId: profile.userId,
		firstName,
		lastName: lastNameParts.join(" "),
		riderName: profile.riderName,
		phoneNumber: "",
		vehicleType: profile.vehicleType,
		licensePlate: profile.licensePlate,
		isOnline: profile.isOnline,
		isVerified: profile.approvalStatus === "Approved",
		approvalStatus: profile.approvalStatus,
		rating: profile.rating,
		totalCompletedTasks: profile.totalCompletedTasks,
		currentLatitude: profile.currentLatitude,
		currentLongitude: profile.currentLongitude,
	};
}

// ── Get Rider Profile ────────────────────────────────────────

export function getRiderProfile(): Promise<RiderProfile> {
	return apiClient
		.get<RiderProfileDto>("/rider/profile")
		.then(mapRiderProfile);
}

// ── Onboard Rider ────────────────────────────────────────────

export function onboardRider(
	data: RiderOnboardingRequest,
): Promise<RiderProfile> {
	return apiClient
		.post<RiderProfileDto>("/rider/profile", data)
		.then(mapRiderProfile);
}

// ── Update Status (Online/Offline) ───────────────────────────

export function updateRiderStatus(isOnline: boolean): Promise<void> {
	return apiClient.put<void>("/rider/status", { isOnline });
}

// ── Available Tasks ──────────────────────────────────────────

export function getAvailableTasks(): Promise<Errand[]> {
	return apiClient.get<Errand[]>("/rider/tasks/available");
}

// ── Active Tasks ─────────────────────────────────────────────

export function getActiveTasks(): Promise<Errand[]> {
	return apiClient.get<Errand[]>("/rider/tasks/active");
}

// ── Accept Task ──────────────────────────────────────────────

export function acceptTask(id: string): Promise<Errand> {
	return apiClient.post<Errand>(`/rider/tasks/${id}/accept`);
}

// ── Reject Task ──────────────────────────────────────────────

export function rejectTask(id: string): Promise<void> {
	return apiClient.post<void>(`/rider/tasks/${id}/reject`);
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

export function getRiderEarnings(): Promise<RiderEarnings> {
	return apiClient.get<RiderEarnings>("/rider/earnings");
}

// ── Weekly Earnings Chart ────────────────────────────────────

export function getRiderWeeklyEarnings(): Promise<WeeklyEarningsChart> {
	return apiClient.get<WeeklyEarningsChart>("/rider/earnings/weekly");
}

// ── Performance ──────────────────────────────────────────────

export function getRiderPerformance(): Promise<RiderPerformance> {
	return apiClient.get<RiderPerformance>("/rider/performance");
}

// ── Bonuses ──────────────────────────────────────────────────

export function getRiderBonuses(): Promise<RiderBonus[]> {
	return apiClient.get<RiderBonus[]>("/rider/bonuses");
}

// ── Bank Accounts ────────────────────────────────────────────

export function getRiderBankAccounts(): Promise<BankAccount[]> {
	return apiClient.get<BankAccount[]>("/rider/bank-accounts");
}

export function addRiderBankAccount(
	data: AddBankAccountRequest,
): Promise<BankAccount> {
	return apiClient.post<BankAccount>("/rider/bank-accounts", data);
}

export function validateRiderBankAccount(
	bankCode: string,
	accountNumber: string,
): Promise<ValidateBankAccountResult> {
	return apiClient.post<ValidateBankAccountResult>("/rider/validate-bank", {
		bankCode,
		accountNumber,
	});
}

export function deleteRiderBankAccount(id: string): Promise<void> {
	return apiClient.delete<void>(`/rider/bank-accounts/${id}`);
}

export function setDefaultBankAccount(id: string): Promise<void> {
	return apiClient.post<void>(`/rider/bank-accounts/${id}/default`);
}

// ── Leaderboard ──────────────────────────────────────────────

export function getLeaderboard(period: string): Promise<Leaderboard> {
	return apiClient.get<Leaderboard>(`/rider/leaderboard?period=${period}`);
}

// ── Update Vehicle Info ──────────────────────────────────────

export interface UpdateVehicleRequest {
	vehicleType: VehicleType;
	licensePlate?: string;
}

export function updateVehicleInfo(
	data: UpdateVehicleRequest,
): Promise<RiderProfile> {
	return apiClient
		.patch<RiderProfileDto>("/rider/vehicle", data)
		.then(mapRiderProfile);
}

export function uploadRiderSelfie(file: {
	uri: string;
	name: string;
	type: string;
}): Promise<string> {
	const formData = new FormData();
	formData.append("file", file as unknown as Blob);

	return apiClient.request<string>("/rider/upload-selfie", {
		method: "POST",
		body: formData,
	});
}

// ── Register Push Token ──────────────────────────────────────

export function registerPushToken(
	token: string,
	platform: string,
): Promise<void> {
	return apiClient.post<void>("/notifications/register", { token, platform });
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
): Promise<PaginatedResult<RiderPayout>> {
	return apiClient.getPaginated<RiderPayout>(
		"/payments/payouts",
		params as Record<string, string | number | boolean | undefined>,
	);
}

export function requestPayout(amount: number): Promise<RiderPayout> {
	return apiClient.post<RiderPayout>("/payments/payouts", { amount });
}
