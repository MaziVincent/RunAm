import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import type {
	Product,
	CartItem,
	ProductVariantOption,
	ProductExtra,
} from "../types";

const CART_KEY = "cart_state";

function generateCartItemId(
	productId: string,
	selectedVariants?: { name: string; option: ProductVariantOption }[],
	selectedExtras?: { extra: ProductExtra; quantity: number }[],
): string {
	const variantKey = selectedVariants
		? selectedVariants
				.map((v) => `${v.name}:${v.option.label}`)
				.sort()
				.join(";")
		: "";
	const extrasKey = selectedExtras
		? selectedExtras
				.map((e) => `${e.extra.name}:${e.quantity}`)
				.sort()
				.join(",")
		: "";
	return `${productId}|${variantKey}|${extrasKey}`;
}

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
		selectedVariants?: { name: string; option: ProductVariantOption }[],
		selectedExtras?: { extra: ProductExtra; quantity: number }[],
		notes?: string,
	) => void;
	updateQuantity: (cartItemId: string, quantity: number) => void;
	removeItem: (cartItemId: string) => void;
	clearCart: () => void;
	getItemCount: () => number;
	getSubtotal: () => number;
}

function calculateItemPrice(item: CartItem): number {
	let unitPrice = item.product.price;
	if (item.selectedVariants) {
		for (const v of item.selectedVariants) {
			unitPrice += v.option.priceAdjustment;
		}
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
		selectedVariants,
		selectedExtras,
		notes,
	) => {
		const state = get();

		// If adding from a different vendor, clear existing cart
		let items = state.items;
		if (state.vendorId && state.vendorId !== vendorId) {
			items = [];
		}

		// Check if same product with same variant+extras already in cart
		const cartItemId = generateCartItemId(
			product.id,
			selectedVariants,
			selectedExtras,
		);
		const existingIdx = items.findIndex((i) => i.cartItemId === cartItemId);
		let newItems: CartItem[];

		if (existingIdx >= 0) {
			newItems = [...items];
			newItems[existingIdx] = {
				...newItems[existingIdx],
				quantity: newItems[existingIdx].quantity + quantity,
				notes: notes ?? newItems[existingIdx].notes,
			};
		} else {
			newItems = [
				...items,
				{
					cartItemId,
					product,
					quantity,
					selectedVariants,
					selectedExtras,
					notes,
				},
			];
		}

		const next = { vendorId, vendorName, items: newItems };
		set(next);
		persistCart(next);
	},

	updateQuantity: (cartItemId, quantity) => {
		const state = get();
		if (quantity <= 0) {
			get().removeItem(cartItemId);
			return;
		}
		const newItems = state.items.map((i) =>
			i.cartItemId === cartItemId ? { ...i, quantity } : i,
		);
		const next = {
			vendorId: state.vendorId,
			vendorName: state.vendorName,
			items: newItems,
		};
		set({ items: newItems });
		persistCart(next);
	},

	removeItem: (cartItemId) => {
		const state = get();
		const newItems = state.items.filter((i) => i.cartItemId !== cartItemId);
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
