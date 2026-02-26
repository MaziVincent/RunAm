import apiClient from "./client";
import type {
	ServiceCategory,
	Vendor,
	VendorDetail,
	ProductCategoryWithProducts,
} from "../types";

// ── Service Categories ───────────────────────────────────────

export function getServiceCategories(): Promise<ServiceCategory[]> {
	return apiClient.get<ServiceCategory[]>("/service-categories");
}

export function getServiceCategoryBySlug(
	slug: string,
): Promise<ServiceCategory> {
	return apiClient.get<ServiceCategory>(`/service-categories/${slug}`);
}

// ── Vendors ──────────────────────────────────────────────────

interface GetVendorsParams {
	categoryId?: string;
	search?: string;
	latitude?: number;
	longitude?: number;
	radiusKm?: number;
	page?: number;
	pageSize?: number;
}

export function getVendors(params?: GetVendorsParams): Promise<Vendor[]> {
	return apiClient.get<Vendor[]>(
		"/vendors",
		params as Record<string, string | number | boolean | undefined>,
	);
}

export function getVendorById(id: string): Promise<VendorDetail> {
	return apiClient.get<VendorDetail>(`/vendors/${id}`);
}

// ── Products ─────────────────────────────────────────────────

export function getVendorProducts(
	vendorId: string,
): Promise<ProductCategoryWithProducts[]> {
	return apiClient.get<ProductCategoryWithProducts[]>(
		`/vendors/${vendorId}/products`,
	);
}
