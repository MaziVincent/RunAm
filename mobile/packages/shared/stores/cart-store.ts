import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import type {
	Product,
	CartItem,
	ProductVariantOption,
	ProductExtra,
} from "../types";

const CART_KEY = "cart_state";

interface CartState {
	vendorId: string | null;
	vendorName: string | null;
	items: CartItem[];
	isHydrated: boolean;

	hydrate: () => Promise<void>;
	addItem: (
		vendorId: string,
		vendorName: string,
		product: Product,
		quantity: number,
		selectedVariant?: { name: string; option: ProductVariantOption } | null,
		selectedExtras?: { extra: ProductExtra; quantity: number }[],
		notes?: string,
	) => void;
	updateQuantity: (productId: string, quantity: number) => void;
	removeItem: (productId: string) => void;
	clearCart: () => void;
	getItemCount: () => number;
	getSubtotal: () => number;
}

function calculateItemPrice(item: CartItem): number {
	let unitPrice = item.product.price;
	if (item.selectedVariant?.option) {
		unitPrice += item.selectedVariant.option.priceAdjustment;
	}
	if (item.selectedExtras) {
		for (const e of item.selectedExtras) {
			unitPrice += e.extra.price * e.quantity;
		}
	}
	return unitPrice * item.quantity;
}

function persistCart(state: {
	vendorId: string | null;
	vendorName: string | null;
	items: CartItem[];
}) {
	SecureStore.setItemAsync(CART_KEY, JSON.stringify(state)).catch(() => {});
}

export const useCartStore = create<CartState>((set, get) => ({
	vendorId: null,
	vendorName: null,
	items: [],
	isHydrated: false,

	hydrate: async () => {
		try {
			const raw = await SecureStore.getItemAsync(CART_KEY);
			if (raw) {
				const parsed = JSON.parse(raw);
				set({
					vendorId: parsed.vendorId ?? null,
					vendorName: parsed.vendorName ?? null,
					items: parsed.items ?? [],
					isHydrated: true,
				});
			} else {
				set({ isHydrated: true });
			}
		} catch {
			set({ isHydrated: true });
		}
	},

	addItem: (
		vendorId,
		vendorName,
		product,
		quantity,
		selectedVariant,
		selectedExtras,
		notes,
	) => {
		const state = get();

		// If adding from a different vendor, clear existing cart
		let items = state.items;
		if (state.vendorId && state.vendorId !== vendorId) {
			items = [];
		}

		// Check if same product already in cart (by productId)
		const existingIdx = items.findIndex((i) => i.product.id === product.id);
		let newItems: CartItem[];

		if (existingIdx >= 0) {
			newItems = [...items];
			newItems[existingIdx] = {
				...newItems[existingIdx],
				quantity: newItems[existingIdx].quantity + quantity,
				selectedVariant:
					selectedVariant ?? newItems[existingIdx].selectedVariant,
				selectedExtras: selectedExtras ?? newItems[existingIdx].selectedExtras,
				notes: notes ?? newItems[existingIdx].notes,
			};
		} else {
			newItems = [
				...items,
				{ product, quantity, selectedVariant, selectedExtras, notes },
			];
		}

		const next = { vendorId, vendorName, items: newItems };
		set(next);
		persistCart(next);
	},

	updateQuantity: (productId, quantity) => {
		const state = get();
		if (quantity <= 0) {
			get().removeItem(productId);
			return;
		}
		const newItems = state.items.map((i) =>
			i.product.id === productId ? { ...i, quantity } : i,
		);
		const next = {
			vendorId: state.vendorId,
			vendorName: state.vendorName,
			items: newItems,
		};
		set({ items: newItems });
		persistCart(next);
	},

	removeItem: (productId) => {
		const state = get();
		const newItems = state.items.filter((i) => i.product.id !== productId);
		if (newItems.length === 0) {
			const next = { vendorId: null, vendorName: null, items: [] };
			set(next);
			persistCart(next);
		} else {
			const next = {
				vendorId: state.vendorId,
				vendorName: state.vendorName,
				items: newItems,
			};
			set({ items: newItems });
			persistCart(next);
		}
	},

	clearCart: () => {
		const next = { vendorId: null, vendorName: null, items: [] };
		set(next);
		persistCart(next);
	},

	getItemCount: () => {
		return get().items.reduce((sum, i) => sum + i.quantity, 0);
	},

	getSubtotal: () => {
		return get().items.reduce((sum, item) => sum + calculateItemPrice(item), 0);
	},
}));
