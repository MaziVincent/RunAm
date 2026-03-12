"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
	Minus,
	Plus,
	Trash2,
	ShoppingBag,
	ArrowLeft,
	Tag,
	Store,
	Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCartStore, type CartItem } from "@/lib/stores/cart-store";
import { formatCurrency, cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Cart Item Row                                                     */
/* ------------------------------------------------------------------ */
function CartItemRow({ item }: { item: CartItem }) {
	const { updateQuantity, removeItem, getItemTotal } = useCartStore();
	const total = getItemTotal(item.key);

	return (
		<div className="flex gap-3 py-3">
			{/* Image */}
			{item.imageUrl ? (
				<div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg">
					<Image
						src={item.imageUrl}
						alt={item.productName}
						fill
						className="object-cover"
					/>
				</div>
			) : (
				<div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-muted">
					<Package className="h-6 w-6 text-muted-foreground" />
				</div>
			)}

			{/* Details */}
			<div className="flex min-w-0 flex-1 flex-col">
				<div className="flex items-start justify-between gap-2">
					<div className="min-w-0">
						<h4 className="text-sm font-semibold leading-tight line-clamp-1">
							{item.productName}
						</h4>
						{item.variant && (
							<p className="mt-0.5 text-xs text-muted-foreground">
								{item.variant.name}: {item.variant.option}
								{item.variant.priceAdjustment !== 0 && (
									<span>
										{" "}
										({item.variant.priceAdjustment > 0 ? "+" : ""}
										{formatCurrency(item.variant.priceAdjustment)})
									</span>
								)}
							</p>
						)}
						{item.extras.length > 0 && (
							<p className="mt-0.5 text-xs text-muted-foreground">
								+ {item.extras.map((e) => e.name).join(", ")}
							</p>
						)}
						{item.notes && (
							<p className="mt-0.5 text-xs italic text-muted-foreground line-clamp-1">
								&ldquo;{item.notes}&rdquo;
							</p>
						)}
					</div>
					<span className="shrink-0 text-sm font-bold">
						{formatCurrency(total)}
					</span>
				</div>

				{/* Quantity controls */}
				<div className="mt-2 flex items-center gap-2">
					<div className="flex items-center rounded-md border">
						<Button
							variant="ghost"
							size="icon"
							className="h-9 w-9"
							onClick={() =>
								item.quantity === 1
									? removeItem(item.key)
									: updateQuantity(item.key, item.quantity - 1)
							}>
							{item.quantity === 1 ? (
								<Trash2 className="h-3.5 w-3.5 text-destructive" />
							) : (
								<Minus className="h-3.5 w-3.5" />
							)}
						</Button>
						<span className="w-9 text-center text-sm font-medium">
							{item.quantity}
						</span>
						<Button
							variant="ghost"
							size="icon"
							className="h-9 w-9"
							onClick={() => updateQuantity(item.key, item.quantity + 1)}>
							<Plus className="h-3.5 w-3.5" />
						</Button>
					</div>
					<span className="text-xs text-muted-foreground">
						{formatCurrency(item.unitPrice)} each
					</span>
				</div>
			</div>
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  Empty Cart                                                        */
/* ------------------------------------------------------------------ */
function EmptyCart() {
	return (
		<div className="flex flex-col items-center justify-center py-24 text-center">
			<ShoppingBag className="h-20 w-20 text-muted-foreground/30" />
			<h2 className="mt-6 text-xl font-semibold">Your cart is empty</h2>
			<p className="mt-2 text-sm text-muted-foreground">
				Browse vendors to find something delicious
			</p>
			<Button asChild className="mt-6">
				<Link href="/shop">Start Shopping</Link>
			</Button>
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  Cart Page                                                         */
/* ------------------------------------------------------------------ */
export default function CartPage() {
	const { vendorId, vendorName, items, getSubtotal, clearCart, getItemCount } =
		useCartStore();
	const [promoCode, setPromoCode] = useState("");
	const [promoApplied, setPromoApplied] = useState(false);

	const subtotal = getSubtotal();
	const itemCount = getItemCount();
	// Placeholder delivery fee (will come from vendor in real flow)
	const deliveryFee = 500;
	const discount = promoApplied ? Math.round(subtotal * 0.1) : 0;
	const total = subtotal + deliveryFee - discount;

	if (itemCount === 0) return <EmptyCart />;

	return (
		<div className="container mx-auto max-w-3xl px-4 py-6">
			{/* Header */}
			<div className="mb-6 flex items-center gap-3">
				<Button variant="ghost" size="icon" asChild>
					<Link href="/shop">
						<ArrowLeft className="h-5 w-5" />
					</Link>
				</Button>
				<div>
					<h1 className="text-xl font-bold">Your Cart</h1>
					<p className="text-sm text-muted-foreground">
						{itemCount} {itemCount === 1 ? "item" : "items"}
					</p>
				</div>
				<Button
					variant="ghost"
					size="sm"
					className="ml-auto text-destructive hover:text-destructive"
					onClick={() => clearCart()}>
					Clear Cart
				</Button>
			</div>

			{/* Vendor header */}
			<Card className="mb-4">
				<CardContent className="flex items-center gap-3 p-4">
					<Store className="h-5 w-5 text-primary" />
					<div>
						<p className="font-semibold text-sm">{vendorName}</p>
						<Link
							href={`/shop/vendors/${vendorId}`}
							className="text-xs text-primary hover:underline">
							View menu
						</Link>
					</div>
				</CardContent>
			</Card>

			{/* Items */}
			<Card className="mb-4">
				<CardContent className="divide-y p-4">
					{items.map((item) => (
						<CartItemRow key={item.key} item={item} />
					))}
				</CardContent>
			</Card>

			{/* Promo Code */}
			<Card className="mb-4">
				<CardContent className="p-4">
					<div className="flex items-center gap-2">
						<Tag className="h-4 w-4 text-muted-foreground" />
						<Input
							value={promoCode}
							onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
							placeholder="Promo code"
							className="flex-1"
						/>
						<Button
							variant="outline"
							size="sm"
							onClick={() => {
								if (promoCode.trim()) setPromoApplied(true);
							}}
							disabled={!promoCode.trim() || promoApplied}>
							{promoApplied ? "Applied" : "Apply"}
						</Button>
					</div>
					{promoApplied && (
						<p className="mt-2 text-xs text-primary">
							✓ 10% discount applied!
						</p>
					)}
				</CardContent>
			</Card>

			{/* Order Summary */}
			<Card className="mb-6">
				<CardHeader>
					<CardTitle className="text-base">Order Summary</CardTitle>
				</CardHeader>
				<CardContent className="space-y-2">
					<div className="flex justify-between text-sm">
						<span className="text-muted-foreground">Subtotal</span>
						<span>{formatCurrency(subtotal)}</span>
					</div>
					<div className="flex justify-between text-sm">
						<span className="text-muted-foreground">Delivery Fee</span>
						<span>{formatCurrency(deliveryFee)}</span>
					</div>
					{discount > 0 && (
						<div className="flex justify-between text-sm text-primary">
							<span>Discount</span>
							<span>-{formatCurrency(discount)}</span>
						</div>
					)}
					<Separator />
					<div className="flex justify-between font-bold">
						<span>Total</span>
						<span>{formatCurrency(total)}</span>
					</div>
				</CardContent>
			</Card>

			{/* Checkout CTA */}
			<Button asChild className="w-full gap-2" size="lg">
				<Link href="/shop/checkout">
					Proceed to Checkout — {formatCurrency(total)}
				</Link>
			</Button>
		</div>
	);
}
