import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import type { Address } from "../types";

const STORAGE_KEY = "runam_user_active_address";

interface DeliveryAddressState {
	activeAddressId: string | null;
	activeAddress: Address | null;
	hydrated: boolean;
	hydrate: () => Promise<void>;
	setActive: (address: Address) => void;
	clear: () => void;
}

async function persist(addressId: string | null): Promise<void> {
	try {
		if (addressId) {
			await SecureStore.setItemAsync(STORAGE_KEY, addressId);
		} else {
			await SecureStore.deleteItemAsync(STORAGE_KEY);
		}
	} catch {
		// non-fatal
	}
}

export const useDeliveryAddressStore = create<DeliveryAddressState>(
	(set, get) => ({
		activeAddressId: null,
		activeAddress: null,
		hydrated: false,
		hydrate: async () => {
			if (get().hydrated) return;
			try {
				const id = await SecureStore.getItemAsync(STORAGE_KEY);
				if (id) {
					set({ activeAddressId: id });
				}
			} catch {
				// ignore
			} finally {
				set({ hydrated: true });
			}
		},
		setActive: (address) => {
			set({ activeAddressId: address.id, activeAddress: address });
			void persist(address.id);
		},
		clear: () => {
			set({ activeAddressId: null, activeAddress: null });
			void persist(null);
		},
	}),
);
