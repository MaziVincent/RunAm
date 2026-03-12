import {
	useQuery,
	useMutation,
	useQueryClient,
	keepPreviousData,
} from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type {
	ServiceCategoryDto,
	VendorDto,
	VendorDetailDto,
	ProductCategoryWithProductsDto,
	ApiResponse,
	PaginationMeta,
} from "@/types";

// ── Service Categories ─────────────────────────────────

export function useServiceCategories() {
	return useQuery({
		queryKey: ["service-categories"],
		queryFn: () => api.get<ServiceCategoryDto[]>("/service-categories"),
		staleTime: 5 * 60 * 1000, // 5 minutes — rarely changes
	});
}

export function useServiceCategoryBySlug(slug: string) {
	return useQuery({
		queryKey: ["service-categories", slug],
		queryFn: () =>
			api.get<ServiceCategoryDto>(`/service-categories/slug/${slug}`),
		enabled: !!slug,
	});
}

// ── Vendors ────────────────────────────────────────────

export interface VendorQueryParams {
	categoryId?: string;
	search?: string;
	latitude?: number;
	longitude?: number;
	radius?: number;
	sort?: string;
	page?: number;
	pageSize?: number;
}

export function useVendors(params: VendorQueryParams = {}) {
	return useQuery({
		queryKey: ["vendors", params],
		queryFn: () =>
			api.get<VendorDto[]>("/vendors", {
				categoryId: params.categoryId,
				search: params.search,
				latitude: params.latitude,
				longitude: params.longitude,
				radius: params.radius,
				sort: params.sort,
				page: params.page ?? 1,
				pageSize: params.pageSize ?? 12,
			}),
		staleTime: 30_000,
		placeholderData: keepPreviousData,
	});
}

export function useVendorDetail(id: string) {
	return useQuery({
		queryKey: ["vendors", id],
		queryFn: () => api.get<VendorDetailDto>(`/vendors/${id}`),
		staleTime: 60_000,
		enabled: !!id,
	});
}

export function useVendorProducts(vendorId: string) {
	return useQuery({
		queryKey: ["vendor-products", vendorId],
		queryFn: () =>
			api.get<ProductCategoryWithProductsDto[]>(
				`/vendors/${vendorId}/products`,
			),
		staleTime: 60_000,
		enabled: !!vendorId,
	});
}

// ── Reviews ────────────────────────────────────────────

export function useVendorReviews(vendorId: string, page: number = 1) {
	return useQuery({
		queryKey: ["vendor-reviews", vendorId, page],
		queryFn: () =>
			api.get<unknown>(`/reviews`, {
				vendorId,
				page,
				pageSize: 10,
			}),
		enabled: !!vendorId,
	});
}
