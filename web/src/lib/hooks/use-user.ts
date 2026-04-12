import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type {
	ApiResponse,
	ErrandDto,
	MarketplaceOrderResult,
	PromoCodeValidationResult,
	WalletDto,
	WalletTransactionDto,
	UserAddressDto,
	NotificationDto,
	ReviewDto,
	UserDto,
} from "@/types";

function ensureSuccess<T>(response: ApiResponse<T>): ApiResponse<T> {
	if (!response.success) {
		throw new Error(response.error?.message || "Request failed.");
	}

	return response;
}

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
		mutationFn: (data: {
			firstName?: string;
			lastName?: string;
			phoneNumber?: string;
		}) => api.put("/users/profile", data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["current-user"] });
		},
	});
}

// ── Errands ────────────────────────────────────────────

export function useMyErrands(
	params: {
		status?: string;
		page?: number;
		pageSize?: number;
	} = {},
) {
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

export function useCreateErrand() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (data: Record<string, unknown>) =>
			ensureSuccess(await api.post<ErrandDto>("/errands", data)),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["my-errands"] });
			queryClient.invalidateQueries({ queryKey: ["wallet"] });
		},
	});
}

// ── Wallet ─────────────────────────────────────────────

export function useWallet() {
	return useQuery({
		queryKey: ["wallet"],
		queryFn: () => api.get<WalletDto | null>("/payments/wallet"),
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

export function useCreateWallet() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (data: { nin: string }) =>
			ensureSuccess(await api.post<WalletDto>("/payments/wallet", data)),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["wallet"] });
			queryClient.invalidateQueries({ queryKey: ["wallet-transactions"] });
		},
	});
}

export function useValidatePromoCode() {
	return useMutation({
		mutationFn: async (data: { code: string; orderAmount: number }) =>
			ensureSuccess(
				await api.post<PromoCodeValidationResult>(
					"/payments/promo/validate",
					data,
				),
			),
	});
}

// ── Delivery Estimate ──────────────────────────────────

interface PriceEstimateResponse {
	estimatedPrice: number;
	baseFare: number;
	distanceFare: number;
	weightSurcharge: number;
	prioritySurcharge: number;
	estimatedDistanceKm: number;
	estimatedDurationMinutes: number;
}

export function useDeliveryEstimate(params: {
	pickupLatitude: number;
	pickupLongitude: number;
	dropoffLatitude: number;
	dropoffLongitude: number;
	enabled: boolean;
}) {
	const {
		pickupLatitude,
		pickupLongitude,
		dropoffLatitude,
		dropoffLongitude,
		enabled,
	} = params;
	return useQuery({
		queryKey: [
			"delivery-estimate",
			pickupLatitude,
			pickupLongitude,
			dropoffLatitude,
			dropoffLongitude,
		],
		queryFn: () =>
			api.get<PriceEstimateResponse>(
				`/errands/estimate?Category=0&PickupLatitude=${pickupLatitude}&PickupLongitude=${pickupLongitude}&DropoffLatitude=${dropoffLatitude}&DropoffLongitude=${dropoffLongitude}&Priority=0`,
			),
		enabled: enabled && pickupLatitude !== 0 && dropoffLatitude !== 0,
		staleTime: 5 * 60_000, // 5 minutes
	});
}

// ── Place Order (Marketplace Errand) ───────────────────

export interface PlaceOrderPayload {
	vendorId: string;
	dropoffAddress: string;
	dropoffLatitude: number;
	dropoffLongitude: number;
	recipientName: string | null;
	recipientPhone: string | null;
	specialInstructions: string | null;
	paymentMethod: number;
	promoCode: string | null;
	scheduledAt: string | null;
	items: {
		productId: string;
		quantity: number;
		notes: string | null;
		selectedVariantJson: string | null;
		selectedExtrasJson: string | null;
	}[];
}

export function usePlaceOrder() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (data: PlaceOrderPayload) =>
			ensureSuccess(
				await api.post<MarketplaceOrderResult>("/errands/marketplace", data),
			),
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
		queryFn: () => api.get<UserAddressDto[]>("/users/me/addresses"),
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
		}) => api.post("/users/me/addresses", data),
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
