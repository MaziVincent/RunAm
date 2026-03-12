import { create } from "zustand";
import type { ProductDto } from "@/types";

export interface CartItemVariant {
	name: string;
	option: string;
	priceAdjustment: number;
}

export interface CartItemExtra {
	name: string;
	price: number;
}

export interface CartItem {
	productId: string;
	productName: string;
	imageUrl: string | null;
	quantity: number;
	unitPrice: number;
	variant: CartItemVariant | null;
	extras: CartItemExtra[];
	notes: string;
	/** Unique key = productId + variant option (for distinguishing same product with different variants) */
	key: string;
}

function makeKey(productId: string, variant: CartItemVariant | null): string {
	return variant ? `${productId}::${variant.option}` : productId;
}

function calculateItemTotal(item: CartItem): number {
	const variantAdj = item.variant?.priceAdjustment ?? 0;
	const extrasTotal = item.extras.reduce((sum, e) => sum + e.price, 0);
	return (item.unitPrice + variantAdj + extrasTotal) * item.quantity;
}

interface CartState {
	vendorId: string | null;
	vendorName: string;
	items: CartItem[];

	addItem: (
		vendorId: string,
		vendorName: string,
		product: ProductDto,
		quantity: number,
		variant: CartItemVariant | null,
		extras: CartItemExtra[],
		notes: string,
	) => void;
	updateQuantity: (key: string, quantity: number) => void;
	removeItem: (key: string) => void;
	clearCart: () => void;

	getItemCount: () => number;
	getSubtotal: () => number;
	getItemTotal: (key: string) => number;
}

const CART_STORAGE_KEY = "runam_cart";

function persistCart(state: {
	vendorId: string | null;
	vendorName: string;
	items: CartItem[];
}) {
	if (typeof window !== "undefined") {
		localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state));
	}
}

function loadCart(): {
	vendorId: string | null;
	vendorName: string;
	items: CartItem[];
} {
	if (typeof window === "undefined") {
		return { vendorId: null, vendorName: "", items: [] };
	}
	try {
		const raw = localStorage.getItem(CART_STORAGE_KEY);
		if (!raw) return { vendorId: null, vendorName: "", items: [] };
		return JSON.parse(raw);
	} catch {
		return { vendorId: null, vendorName: "", items: [] };
	}
}

export const useCartStore = create<CartState>((set, get) => {
	const initial = loadCart();

	return {
		vendorId: initial.vendorId,
		vendorName: initial.vendorName,
		items: initial.items,

		addItem: (
			vendorId,
			vendorName,
			product,
			quantity,
			variant,
			extras,
			notes,
		) => {
			set((state) => {
				// If switching vendors, clear cart
				let items = state.items;
				let currentVendorId = state.vendorId;
				let currentVendorName = state.vendorName;

				if (currentVendorId && currentVendorId !== vendorId) {
					items = [];
				}

				currentVendorId = vendorId;
				currentVendorName = vendorName;

				const key = makeKey(product.id, variant);
				const existingIndex = items.findIndex((i) => i.key === key);

				const newItem: CartItem = {
					productId: product.id,
					productName: product.name,
					imageUrl: product.imageUrl,
					quantity,
					unitPrice: product.price,
					variant,
					extras,
					notes,
					key,
				};

				let newItems: CartItem[];
				if (existingIndex >= 0) {
					newItems = [...items];
					newItems[existingIndex] = {
						...newItems[existingIndex],
						quantity: newItems[existingIndex].quantity + quantity,
						notes: notes || newItems[existingIndex].notes,
					};
				} else {
					newItems = [...items, newItem];
				}

				const newState = {
					vendorId: currentVendorId,
					vendorName: currentVendorName,
					items: newItems,
				};
				persistCart(newState);
				return newState;
			});
		},

		updateQuantity: (key, quantity) => {
			set((state) => {
				if (quantity <= 0) {
					const newItems = state.items.filter((i) => i.key !== key);
					const newState = {
						...state,
						items: newItems,
						...(newItems.length === 0
							? { vendorId: null, vendorName: "" }
							: {}),
					};
					persistCart(newState);
					return newState;
				}

				const newItems = state.items.map((i) =>
					i.key === key ? { ...i, quantity } : i,
				);
				const newState = { ...state, items: newItems };
				persistCart(newState);
				return newState;
			});
		},

		removeItem: (key) => {
			set((state) => {
				const newItems = state.items.filter((i) => i.key !== key);
				const newState = {
					...state,
					items: newItems,
					...(newItems.length === 0 ? { vendorId: null, vendorName: "" } : {}),
				};
				persistCart(newState);
				return newState;
			});
		},

		clearCart: () => {
			const newState = { vendorId: null, vendorName: "", items: [] };
			persistCart(newState);
			set(newState);
		},

		getItemCount: () => {
			return get().items.reduce((sum, i) => sum + i.quantity, 0);
		},

		getSubtotal: () => {
			return get().items.reduce((sum, i) => sum + calculateItemTotal(i), 0);
		},

		getItemTotal: (key) => {
			const item = get().items.find((i) => i.key === key);
			return item ? calculateItemTotal(item) : 0;
		},
	};
});
