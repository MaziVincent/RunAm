import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type {
	VendorDto,
	VendorDetailDto,
	ProductDto,
	ProductCategoryDto,
	OrderItemDto,
	ErrandDto,
	ReviewDto,
} from "@/types";

// ── Vendor Profile (current vendor) ────────────────────

export function useMyVendor() {
	return useQuery({
		queryKey: ["my-vendor"],
		queryFn: () => api.get<VendorDetailDto>("/vendors/me"),
		staleTime: 60_000,
	});
}

export function useUpdateVendorProfile() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (data: {
			businessName?: string;
			description?: string;
			phoneNumber?: string;
			address?: string;
			latitude?: number;
			longitude?: number;
			minimumOrderAmount?: number;
			deliveryFee?: number;
			estimatedPrepTimeMinutes?: number;
			operatingHours?: string;
			logoUrl?: string;
			bannerUrl?: string;
		}) => {
			const res = await api.put<VendorDetailDto>("/vendors/me", data);
			if (!res.success) {
				throw new Error(
					res.error?.message ?? "Failed to update vendor profile",
				);
			}

			return res;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["my-vendor"] });
		},
	});
}

export function useRegisterVendor() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (data: {
			businessName: string;
			businessDescription?: string;
			logoUrl?: string;
			address: string;
			latitude: number;
			longitude: number;
			serviceCategoryIds: string[];
			minimumOrderAmount: number;
			deliveryFee: number;
			estimatedPrepTimeMinutes: number;
			operatingHours?: string;
		}) => {
			const res = await api.post<VendorDto>("/vendors/me", data);
			if (!res.success)
				throw new Error(res.error?.message ?? "Failed to register vendor");
			return res;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["my-vendor"] });
		},
	});
}

// ── Vendor Toggle ──────────────────────────────────────

export function useToggleVendorOpen() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (isOpen: boolean) => api.put("/vendors/me/status", { isOpen }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["my-vendor"] });
		},
	});
}

// ── Vendor Orders ──────────────────────────────────────

export function useVendorOrders(
	params: {
		status?: string;
		page?: number;
		pageSize?: number;
	} = {},
) {
	return useQuery({
		queryKey: ["vendor-orders", params],
		queryFn: () =>
			api.get<ErrandDto[]>("/vendors/me/orders", {
				page: params.page ?? 1,
				pageSize: params.pageSize ?? 20,
				status: params.status,
			}),
		refetchInterval: 15_000, // Poll for new orders
	});
}

export function useVendorOrderDetail(id: string) {
	return useQuery({
		queryKey: ["vendor-orders", id],
		queryFn: () => api.get<ErrandDto>(`/vendors/me/orders/${id}`),
		enabled: !!id,
	});
}

export function useConfirmVendorOrder() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: { orderId: string; estimatedPrepMinutes?: number }) =>
			api.post(`/vendors/me/orders/${data.orderId}/confirm`, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["vendor-orders"] });
		},
	});
}

export function useRejectVendorOrder() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: { orderId: string; reason: string }) =>
			api.post(`/vendors/me/orders/${data.orderId}/reject`, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["vendor-orders"] });
		},
	});
}

export function useMarkOrderReady() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (orderId: string) =>
			api.post(`/vendors/me/orders/${orderId}/ready`),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["vendor-orders"] });
		},
	});
}

// ── Products ───────────────────────────────────────────

export function useMyProducts(
	params: {
		categoryId?: string;
		page?: number;
		pageSize?: number;
	} = {},
) {
	return useQuery({
		queryKey: ["my-products", params],
		queryFn: () =>
			api.get<ProductDto[]>("/vendors/me/products", {
				page: params.page ?? 1,
				pageSize: params.pageSize ?? 50,
				categoryId: params.categoryId,
			}),
	});
}

export function useCreateProduct() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: {
			productCategoryId: string;
			name: string;
			description?: string;
			price: number;
			compareAtPrice?: number;
			imageUrl?: string;
			isAvailable?: boolean;
			variantsJson?: string;
			extrasJson?: string;
		}) => api.post<ProductDto>("/vendors/me/products", data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["my-products"] });
			queryClient.invalidateQueries({ queryKey: ["my-vendor"] });
		},
	});
}

export function useUpdateProduct() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			id,
			...data
		}: {
			id: string;
			productCategoryId?: string;
			name?: string;
			description?: string;
			price?: number;
			compareAtPrice?: number;
			imageUrl?: string;
			isAvailable?: boolean;
			variantsJson?: string;
			extrasJson?: string;
		}) => api.put(`/vendors/me/products/${id}`, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["my-products"] });
			queryClient.invalidateQueries({ queryKey: ["my-vendor"] });
		},
	});
}

export function useDeleteProduct() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => api.delete(`/vendors/me/products/${id}`),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["my-products"] });
			queryClient.invalidateQueries({ queryKey: ["my-vendor"] });
		},
	});
}

export function useToggleProductAvailability() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: { id: string; isAvailable: boolean }) =>
			api.patch(`/vendors/me/products/${data.id}`, {
				isAvailable: data.isAvailable,
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["my-products"] });
		},
	});
}

// ── Product Categories ─────────────────────────────────

export function useMyProductCategories() {
	return useQuery({
		queryKey: ["my-product-categories"],
		queryFn: () => api.get<ProductCategoryDto[]>("/vendors/me/categories"),
	});
}

export function useCreateProductCategory() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: {
			name: string;
			description?: string;
			sortOrder?: number;
		}) => api.post<ProductCategoryDto>("/vendors/me/categories", data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["my-product-categories"] });
			queryClient.invalidateQueries({ queryKey: ["my-vendor"] });
		},
	});
}

export function useUpdateProductCategory() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			id,
			...data
		}: {
			id: string;
			name?: string;
			description?: string;
			sortOrder?: number;
		}) => api.put(`/vendors/me/categories/${id}`, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["my-product-categories"] });
		},
	});
}

export function useDeleteProductCategory() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => api.delete(`/vendors/me/categories/${id}`),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["my-product-categories"] });
			queryClient.invalidateQueries({ queryKey: ["my-vendor"] });
		},
	});
}

// ── Vendor Reviews ─────────────────────────────────────

export function useMyVendorReviews(page: number = 1) {
	return useQuery({
		queryKey: ["vendor-reviews", page],
		queryFn: () =>
			api.get<ReviewDto[]>("/vendors/me/reviews", { page, pageSize: 10 }),
	});
}

// ── Vendor Analytics ───────────────────────────────────

export interface VendorAnalytics {
	todayOrders: number;
	todayRevenue: number;
	weeklyRevenue: { date: string; revenue: number; orders: number }[];
	topProducts: { productName: string; orderCount: number; revenue: number }[];
	pendingOrders: number;
}

export function useVendorAnalytics() {
	return useQuery({
		queryKey: ["vendor-analytics"],
		queryFn: () => api.get<VendorAnalytics>("/vendors/me/analytics"),
		staleTime: 60_000,
	});
}
