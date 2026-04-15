import apiClient from "./client";
import type { Address } from "../types";

// ── List Addresses ───────────────────────────────────────────

export function getAddresses(): Promise<Address[]> {
	return apiClient.get<Address[]>("/users/me/addresses");
}

// ── Create Address ───────────────────────────────────────────

export interface CreateAddressRequest {
	label: string;
	address: string;
	latitude: number;
	longitude: number;
	isDefault?: boolean;
}

export interface UpdateAddressRequest {
	label?: string;
	address?: string;
	latitude?: number;
	longitude?: number;
	isDefault?: boolean;
}

export function createAddress(data: CreateAddressRequest): Promise<Address> {
	return apiClient.post<Address>("/users/me/addresses", data);
}

export function updateAddress(
	addressId: string,
	data: UpdateAddressRequest,
): Promise<Address> {
	return apiClient.put<Address>(`/users/me/addresses/${addressId}`, data);
}

export function setDefaultAddress(addressId: string): Promise<Address> {
	return apiClient.patch<Address>(`/users/me/addresses/${addressId}/default`);
}

export function deleteAddress(addressId: string): Promise<void> {
	return apiClient.delete<void>(`/users/me/addresses/${addressId}`);
}
