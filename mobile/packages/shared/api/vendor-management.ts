import apiClient from "./client";
import type {
	Vendor,
	VendorDetail,
	Product,
	ProductCategory,
	PaginatedResponse,
} from "../types";

// ── Vendor Profile (Merchant) ────────────────────────────────

export function getMyVendor(): Promise<Vendor> {
	return apiClient.get<Vendor>("/vendors/me");
}

export interface CreateVendorRequest {
	businessName: string;
	businessDescription?: string;
	logoUrl?: string;
	address: string;
	latitude: number;
	longitude: number;
	operatingHours?: string;
	minimumOrderAmount: number;
	deliveryFee: number;
	estimatedPrepTimeMinutes: number;
	serviceCategoryIds: string[];
}

export function createVendor(data: CreateVendorRequest): Promise<Vendor> {
	return apiClient.post<Vendor>("/vendors/me", data);
}

export interface UpdateVendorRequest {
	businessName: string;
	businessDescription?: string;
	address: string;
	latitude: number;
	longitude: number;
	operatingHours?: string;
	minimumOrderAmount: number;
	deliveryFee: number;
	estimatedPrepTimeMinutes: number;
	serviceCategoryIds: string[];
}

export function updateVendor(data: UpdateVendorRequest): Promise<Vendor> {
	return apiClient.put<Vendor>("/vendors/me", data);
}

export function updateVendorStatus(isOpen: boolean): Promise<Vendor> {
	return apiClient.put<Vendor>("/vendors/me/status", { isOpen });
}

// ── Analytics ────────────────────────────────────────────────

export interface VendorAnalytics {
	todayOrders: number;
	todayRevenue: number;
	weeklyRevenue: { date: string; revenue: number }[];
	topProducts: { productName: string; quantity: number; revenue: number }[];
	pendingOrders: number;
}

export function getVendorAnalytics(): Promise<VendorAnalytics> {
	return apiClient.get<VendorAnalytics>("/vendors/me/analytics");
}

// ── Product Categories ───────────────────────────────────────

export function getMyCategories(): Promise<ProductCategory[]> {
	return apiClient.get<ProductCategory[]>("/vendors/me/categories");
}

export interface CreateProductCategoryRequest {
	name: string;
	description?: string;
	imageUrl?: string;
	sortOrder: number;
}

export function createCategory(
	data: CreateProductCategoryRequest,
): Promise<ProductCategory> {
	return apiClient.post<ProductCategory>("/vendors/me/categories", data);
}

export interface UpdateProductCategoryRequest {
	name: string;
	description?: string;
	imageUrl?: string;
	sortOrder: number;
	isActive: boolean;
}

export function updateCategory(
	id: string,
	data: UpdateProductCategoryRequest,
): Promise<ProductCategory> {
	return apiClient.put<ProductCategory>(`/vendors/me/categories/${id}`, data);
}

export function deleteCategory(id: string): Promise<void> {
	return apiClient.delete<void>(`/vendors/me/categories/${id}`);
}

// ── Products ─────────────────────────────────────────────────

export function getMyProducts(): Promise<Product[]> {
	return apiClient.get<Product[]>("/vendors/me/products");
}

export interface CreateProductRequest {
	productCategoryId: string;
	name: string;
	description?: string;
	price: number;
	compareAtPrice?: number;
	imageUrl?: string;
	sortOrder: number;
	variantsJson?: string;
	extrasJson?: string;
}

export function createProduct(data: CreateProductRequest): Promise<Product> {
	return apiClient.post<Product>("/vendors/me/products", data);
}

export interface UpdateProductRequest {
	productCategoryId: string;
	name: string;
	description?: string;
	price: number;
	compareAtPrice?: number;
	imageUrl?: string;
	sortOrder: number;
	isAvailable: boolean;
	variantsJson?: string;
	extrasJson?: string;
}

export function updateProduct(
	id: string,
	data: UpdateProductRequest,
): Promise<Product> {
	return apiClient.put<Product>(`/vendors/me/products/${id}`, data);
}

export function deleteProduct(id: string): Promise<void> {
	return apiClient.delete<void>(`/vendors/me/products/${id}`);
}

export function toggleProductAvailability(
	id: string,
	isAvailable: boolean,
): Promise<Product> {
	return apiClient.put<Product>(`/vendors/me/products/${id}/availability`, {
		isAvailable,
	});
}

// ── Orders (Vendor side) ─────────────────────────────────────

export interface VendorOrder {
	errandId: string;
	customerName?: string;
	dropoffAddress: string;
	vendorOrderStatus?: string;
	totalAmount: number;
	items: VendorOrderItem[];
	createdAt: string;
}

export interface VendorOrderItem {
	id: string;
	productName: string;
	quantity: number;
	unitPrice: number;
	totalPrice: number;
	notes?: string;
	status: string;
}

interface GetOrdersParams {
	page?: number;
	pageSize?: number;
}

export function getVendorOrders(
	params?: GetOrdersParams,
): Promise<PaginatedResponse<VendorOrder>> {
	return apiClient.get<PaginatedResponse<VendorOrder>>(
		"/vendors/me/orders",
		params as Record<string, string | number | boolean | undefined>,
	);
}

export function confirmOrder(errandId: string): Promise<VendorOrder> {
	return apiClient.put<VendorOrder>(`/vendors/me/orders/${errandId}/confirm`);
}

export function markOrderReady(errandId: string): Promise<VendorOrder> {
	return apiClient.put<VendorOrder>(`/vendors/me/orders/${errandId}/ready`);
}
