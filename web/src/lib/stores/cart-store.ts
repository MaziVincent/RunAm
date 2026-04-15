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
	vendorId: string;
	vendorName: string;
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

export interface VendorCartGroup {
	vendorId: string;
	vendorName: string;
	items: CartItem[];
	itemCount: number;
	subtotal: number;
}

function makeKey(
	vendorId: string,
	productId: string,
	variant: CartItemVariant | null,
	extras: CartItemExtra[],
	notes: string,
): string {
	const variantKey = variant
		? `${variant.name}:${variant.option}:${variant.priceAdjustment}`
		: "no-variant";
	const extrasKey = extras
		.slice()
		.sort((left, right) => left.name.localeCompare(right.name))
		.map((extra) => `${extra.name}:${extra.price}`)
		.join("|") || "no-extras";
	const notesKey = notes.trim().toLowerCase() || "no-notes";
	return [vendorId, productId, variantKey, extrasKey, notesKey].join("::");
}

function calculateItemTotal(item: CartItem): number {
	const variantAdj = item.variant?.priceAdjustment ?? 0;
	const extrasTotal = item.extras.reduce((sum, e) => sum + e.price, 0);
	return (item.unitPrice + variantAdj + extrasTotal) * item.quantity;
}

interface CartState {
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
	clearVendorCart: (vendorId: string) => void;
	clearVendors: (vendorIds: string[]) => void;
	clearCart: () => void;

	getItemCount: () => number;
	getVendorCount: () => number;
	getSubtotal: () => number;
	getItemTotal: (key: string) => number;
	getVendorCarts: () => VendorCartGroup[];
}

const CART_STORAGE_KEY = "runam_cart";

function persistCart(state: { items: CartItem[] }) {
	if (typeof window !== "undefined") {
		localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state));
	}
}

function normalizeCartItem(
	item: Partial<CartItem>,
	fallbackVendorId: string | null,
	fallbackVendorName: string,
): CartItem | null {
	if (!item.productId || !item.productName) {
		return null;
	}

	const vendorId = item.vendorId ?? fallbackVendorId;
	if (!vendorId) {
		return null;
	}

	const vendorName = item.vendorName ?? fallbackVendorName;
	const variant = item.variant ?? null;
	const extras = Array.isArray(item.extras) ? item.extras : [];
	const notes = typeof item.notes === "string" ? item.notes : "";

	return {
		vendorId,
		vendorName,
		productId: item.productId,
		productName: item.productName,
		imageUrl: item.imageUrl ?? null,
		quantity: item.quantity ?? 1,
		unitPrice: item.unitPrice ?? 0,
		variant,
		extras,
		notes,
		key: makeKey(vendorId, item.productId, variant, extras, notes),
	};
}

function loadCart(): { items: CartItem[] } {
	if (typeof window === "undefined") {
		return { items: [] };
	}
	try {
		const raw = localStorage.getItem(CART_STORAGE_KEY);
		if (!raw) return { items: [] };
		const parsed = JSON.parse(raw) as {
			vendorId?: string | null;
			vendorName?: string;
			items?: Partial<CartItem>[];
		};

		const items = Array.isArray(parsed.items)
			? parsed.items
					.map((item) =>
						normalizeCartItem(item, parsed.vendorId ?? null, parsed.vendorName ?? ""),
					)
					.filter((item): item is CartItem => item !== null)
			: [];

		return { items };
	} catch {
		return { items: [] };
	}
}

function groupVendorCarts(items: CartItem[]): VendorCartGroup[] {
	const groups = new Map<string, VendorCartGroup>();

	for (const item of items) {
		const existing = groups.get(item.vendorId);
		if (existing) {
			existing.items.push(item);
			existing.itemCount += item.quantity;
			existing.subtotal += calculateItemTotal(item);
			continue;
		}

		groups.set(item.vendorId, {
			vendorId: item.vendorId,
			vendorName: item.vendorName,
			items: [item],
			itemCount: item.quantity,
			subtotal: calculateItemTotal(item),
		});
	}

	return Array.from(groups.values());
}

export const useCartStore = create<CartState>((set, get) => {
	const initial = loadCart();

	return {
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
				const normalizedNotes = notes.trim();
				const key = makeKey(vendorId, product.id, variant, extras, normalizedNotes);
				const existingIndex = state.items.findIndex((item) => item.key === key);

				const newItem: CartItem = {
					vendorId,
					vendorName,
					productId: product.id,
					productName: product.name,
					imageUrl: product.imageUrl,
					quantity,
					unitPrice: product.price,
					variant,
					extras,
					notes: normalizedNotes,
					key,
				};

				let newItems: CartItem[];
				if (existingIndex >= 0) {
					newItems = [...state.items];
					newItems[existingIndex] = {
						...newItems[existingIndex],
						quantity: newItems[existingIndex].quantity + quantity,
						notes: normalizedNotes || newItems[existingIndex].notes,
					};
				} else {
					newItems = [...state.items, newItem];
				}

				const newState = { items: newItems };
				persistCart(newState);
				return newState;
			});
		},

		updateQuantity: (key, quantity) => {
			set((state) => {
				if (quantity <= 0) {
					const newItems = state.items.filter((i) => i.key !== key);
					const newState = { items: newItems };
					persistCart(newState);
					return newState;
				}

				const newItems = state.items.map((i) =>
					i.key === key ? { ...i, quantity } : i,
				);
				const newState = { items: newItems };
				persistCart(newState);
				return newState;
			});
		},

		removeItem: (key) => {
			set((state) => {
				const newItems = state.items.filter((i) => i.key !== key);
				const newState = { items: newItems };
				persistCart(newState);
				return newState;
			});
		},

		clearVendorCart: (vendorId) => {
			set((state) => {
				const newItems = state.items.filter((item) => item.vendorId !== vendorId);
				const newState = { items: newItems };
				persistCart(newState);
				return newState;
			});
		},

		clearVendors: (vendorIds) => {
			set((state) => {
				const blocked = new Set(vendorIds);
				const newItems = state.items.filter((item) => !blocked.has(item.vendorId));
				const newState = { items: newItems };
				persistCart(newState);
				return newState;
			});
		},

		clearCart: () => {
			const newState = { items: [] };
			persistCart(newState);
			set(newState);
		},

		getItemCount: () => {
			return get().items.reduce((sum, i) => sum + i.quantity, 0);
		},

		getVendorCount: () => {
			return groupVendorCarts(get().items).length;
		},

		getSubtotal: () => {
			return get().items.reduce((sum, i) => sum + calculateItemTotal(i), 0);
		},

		getItemTotal: (key) => {
			const item = get().items.find((i) => i.key === key);
			return item ? calculateItemTotal(item) : 0;
		},

		getVendorCarts: () => {
			return groupVendorCarts(get().items);
		},
	};
});
