import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type {
	ErrandDto,
	WalletDto,
	WalletTransactionDto,
	UserAddressDto,
	NotificationDto,
	ReviewDto,
	UserDto,
} from "@/types";

// ── User Profile ───────────────────────────────────────

export function useCurrentUser() {
	return useQuery({
		queryKey: ["current-user"],
		queryFn: () => api.get<UserDto>("/users/me"),
		staleTime: 60_000,
	});
}

export function useUpdateProfile() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: { firstName?: string; lastName?: string; phoneNumber?: string }) =>
			api.put("/users/profile", data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["current-user"] });
		},
	});
}

// ── Errands ────────────────────────────────────────────

export function useMyErrands(params: {
	status?: string;
	page?: number;
	pageSize?: number;
} = {}) {
	return useQuery({
		queryKey: ["my-errands", params],
		queryFn: () =>
			api.get<ErrandDto[]>("/errands", {
				page: params.page ?? 1,
				pageSize: params.pageSize ?? 10,
				status: params.status,
			}),
	});
}

export function useErrandDetail(id: string) {
	return useQuery({
		queryKey: ["errands", id],
		queryFn: () => api.get<ErrandDto>(`/errands/${id}`),
		enabled: !!id,
	});
}

// ── Wallet ─────────────────────────────────────────────

export function useWallet() {
	return useQuery({
		queryKey: ["wallet"],
		queryFn: () => api.get<WalletDto>("/payments/wallet"),
	});
}

export function useWalletTransactions(page: number = 1) {
	return useQuery({
		queryKey: ["wallet-transactions", page],
		queryFn: () =>
			api.get<WalletTransactionDto[]>("/payments/wallet/transactions", {
				page,
				pageSize: 20,
			}),
	});
}

export function useTopUpWallet() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: { amount: number; paymentMethod: number }) =>
			api.post("/payments/wallet/top-up", data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["wallet"] });
			queryClient.invalidateQueries({ queryKey: ["wallet-transactions"] });
		},
	});
}

// ── Place Order (Marketplace Errand) ───────────────────

export interface PlaceOrderPayload {
	vendorId: string;
	pickupAddress: string;
	pickupLatitude: number;
	pickupLongitude: number;
	dropoffAddress: string;
	dropoffLatitude: number;
	dropoffLongitude: number;
	priority: string;
	scheduledFor: string | null;
	notes: string;
	paymentMethod: number;
	promoCode: string | null;
	orderItems: {
		productId: string;
		quantity: number;
		unitPrice: number;
		notes: string | null;
		selectedVariantJson: string | null;
		selectedExtrasJson: string | null;
	}[];
}

export function usePlaceOrder() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: PlaceOrderPayload) =>
			api.post<ErrandDto>("/errands", data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["my-errands"] });
			queryClient.invalidateQueries({ queryKey: ["wallet"] });
		},
	});
}

// ── Addresses ──────────────────────────────────────────

export function useAddresses() {
	return useQuery({
		queryKey: ["addresses"],
		queryFn: () => api.get<UserAddressDto[]>("/users/addresses"),
	});
}

export function useCreateAddress() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: {
			label: string;
			address: string;
			latitude: number;
			longitude: number;
			isDefault?: boolean;
		}) => api.post("/users/addresses", data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["addresses"] });
		},
	});
}

// ── Notifications ──────────────────────────────────────

export function useNotifications(page: number = 1) {
	return useQuery({
		queryKey: ["notifications", page],
		queryFn: () =>
			api.get<NotificationDto[]>("/notifications", { page, pageSize: 20 }),
	});
}

export function useUnreadNotificationCount() {
	return useQuery({
		queryKey: ["notification-count"],
		queryFn: () => api.get<{ count: number }>("/notifications/unread-count"),
		refetchInterval: 30_000, // Poll every 30s as fallback to SignalR
	});
}

// ── Reviews ────────────────────────────────────────────

export function useMyReviews(page: number = 1) {
	return useQuery({
		queryKey: ["my-reviews", page],
		queryFn: () =>
			api.get<ReviewDto[]>("/reviews/mine", { page, pageSize: 10 }),
	});
}
