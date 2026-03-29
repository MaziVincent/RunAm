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

export function createAddress(data: CreateAddressRequest): Promise<Address> {
	return apiClient.post<Address>("/users/me/addresses", data);
}
