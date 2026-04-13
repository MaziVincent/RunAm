import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type {
	ApiResponse,
	RiderProfileDto,
	RiderPayoutDto,
	ErrandDto,
	ReviewDto,
	ReviewSummaryDto,
	WalletDto,
	WalletTransactionDto,
	NotificationPreferenceDto,
	UpdateNotificationPreferenceRequest,
	ValidateBankAccountResult,
	CreateRiderProfileRequest,
} from "@/types";
import { VehicleType, ErrandStatus } from "@/types";

function ensureSuccess<T>(response: ApiResponse<T>): ApiResponse<T> {
	if (!response.success) {
		throw new Error(response.error?.message || "Request failed.");
	}

	return response;
}

// ── Rider Profile ──────────────────────────────────────

export function useRiderProfile() {
	return useQuery({
		queryKey: ["rider-profile"],
		queryFn: () => api.get<RiderProfileDto>("/rider/profile"),
		staleTime: 60_000,
	});
}

export function useCreateRiderProfile() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (data: CreateRiderProfileRequest) =>
			ensureSuccess(await api.post<RiderProfileDto>("/rider/profile", data)),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["rider-profile"] });
		},
	});
}

// ── Online / Offline ───────────────────────────────────

export function useUpdateRiderStatus() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (isOnline: boolean) =>
			api.put<RiderProfileDto>("/rider/status", { isOnline }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["rider-profile"] });
		},
	});
}

// ── Tasks ──────────────────────────────────────────────

export function useAvailableTasks() {
	return useQuery({
		queryKey: ["available-tasks"],
		queryFn: () => api.get<ErrandDto[]>("/rider/tasks/available"),
		refetchInterval: 10_000, // Poll for new tasks
	});
}

export function useActiveTasks() {
	return useQuery({
		queryKey: ["active-tasks"],
		queryFn: () => api.get<ErrandDto[]>("/rider/tasks/active"),
		refetchInterval: 15_000,
	});
}

export function useTaskHistory(page: number = 1) {
	return useQuery({
		queryKey: ["task-history", page],
		queryFn: () =>
			api.get<ErrandDto[]>("/rider/tasks/history", { page, pageSize: 20 }),
	});
}

export function useTaskDetail(id: string) {
	return useQuery({
		queryKey: ["task-detail", id],
		queryFn: () => api.get<ErrandDto>(`/rider/tasks/${id}`),
		enabled: !!id,
	});
}

export function useAcceptTask() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (taskId: string) =>
			api.post<ErrandDto>(`/rider/tasks/${taskId}/accept`),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["available-tasks"] });
			queryClient.invalidateQueries({ queryKey: ["active-tasks"] });
		},
	});
}

export function useUpdateTaskStatus() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: {
			taskId: string;
			status: ErrandStatus;
			latitude?: number;
			longitude?: number;
			notes?: string;
			imageUrl?: string;
		}) =>
			api.patch<ErrandDto>(`/rider/tasks/${data.taskId}/status`, {
				status: data.status,
				latitude: data.latitude,
				longitude: data.longitude,
				notes: data.notes,
				imageUrl: data.imageUrl,
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["active-tasks"] });
			queryClient.invalidateQueries({ queryKey: ["task-detail"] });
			queryClient.invalidateQueries({ queryKey: ["task-history"] });
		},
	});
}

// ── Earnings ───────────────────────────────────────────

export interface RiderEarnings {
	todayEarnings: number;
	weekEarnings: number;
	monthEarnings: number;
	totalEarnings: number;
	todayTrips: number;
	weekTrips: number;
	availableBalance: number;
	pendingPayout: number;
	dailyEarnings: { date: string; amount: number; taskCount: number }[];
}

export function useRiderEarnings() {
	return useQuery({
		queryKey: ["rider-earnings"],
		queryFn: () => api.get<RiderEarnings>("/rider/earnings"),
		staleTime: 30_000,
	});
}

// ── Performance ────────────────────────────────────────

export interface RiderPerformance {
	completionRate: number;
	averageRating: number;
	averageResponseTime: number; // seconds
	onTimeRate: number;
	totalDeliveries: number;
	monthlyDeliveries: number;
}

export function useRiderPerformance() {
	return useQuery({
		queryKey: ["rider-performance"],
		queryFn: () => api.get<RiderPerformance>("/rider/performance"),
		staleTime: 60_000,
	});
}

// ── Wallet ─────────────────────────────────────────────

export function useRiderWallet() {
	return useQuery({
		queryKey: ["rider-wallet"],
		queryFn: () => api.get<WalletDto | null>("/payments/wallet"),
	});
}

export function useRiderWalletTransactions(page: number = 1) {
	return useQuery({
		queryKey: ["rider-wallet-transactions", page],
		queryFn: () =>
			api.get<WalletTransactionDto[]>("/payments/wallet/transactions", {
				page,
				pageSize: 20,
			}),
	});
}

// ── Payouts ────────────────────────────────────────────

export function useRiderPayouts(page: number = 1) {
	return useQuery({
		queryKey: ["rider-payouts", page],
		queryFn: () =>
			api.get<RiderPayoutDto[]>("/payments/payouts", {
				page,
				pageSize: 20,
			}),
	});
}

export function useRequestPayout() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (amount: number) =>
			ensureSuccess(
				await api.post<RiderPayoutDto>("/payments/payouts", { amount }),
			),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["rider-payouts"] });
			queryClient.invalidateQueries({ queryKey: ["rider-wallet"] });
			queryClient.invalidateQueries({ queryKey: ["rider-earnings"] });
		},
	});
}

// ── Reviews ────────────────────────────────────────────

export function useRiderReviews(page: number = 1) {
	return useQuery({
		queryKey: ["rider-reviews", page],
		queryFn: () =>
			api.get<ReviewDto[]>("/reviews/mine", { page, pageSize: 20 }),
	});
}

export function useRiderReviewSummary() {
	return useQuery({
		queryKey: ["rider-review-summary"],
		queryFn: () => api.get<ReviewSummaryDto>("/reviews/me/summary"),
		staleTime: 60_000,
	});
}

// ── Notification Preferences ───────────────────────────

export function useNotificationPreferences() {
	return useQuery({
		queryKey: ["notification-preferences"],
		queryFn: () =>
			api.get<NotificationPreferenceDto>("/notifications/preferences"),
	});
}

export function useUpdateNotificationPreferences() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: UpdateNotificationPreferenceRequest) =>
			api.patch<NotificationPreferenceDto>("/notifications/preferences", data),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["notification-preferences"],
			});
		},
	});
}

// ── Onboarding Helpers ─────────────────────────────────

export function useValidateBankAccount() {
	return useMutation({
		mutationFn: async (data: { bankCode: string; accountNumber: string }) =>
			ensureSuccess(
				await api.post<ValidateBankAccountResult>("/rider/validate-bank", data),
			),
	});
}

export function useUploadSelfie() {
	return useMutation({
		mutationFn: async (file: File) =>
			ensureSuccess(await api.upload<string>("/rider/upload-selfie", file)),
	});
}
