"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
	ArrowLeft,
	MapPin,
	CreditCard,
	Wallet,
	Smartphone,
	Banknote,
	Clock,
	ShoppingBag,
	Store,
	AlertCircle,
	Loader2,
	Plus,
	Check,
	Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useCartStore } from "@/lib/stores/cart-store";
import {
	useAddresses,
	useWallet,
	useVendorDetail,
	usePlaceOrder,
} from "@/lib/hooks";
import { useAuthStore } from "@/lib/stores/auth-store";
import { formatCurrency, cn } from "@/lib/utils";
import { PaymentMethod } from "@/types";
import { toast } from "sonner";

/* ------------------------------------------------------------------ */
/*  Address Selector                                                  */
/* ------------------------------------------------------------------ */
function AddressSelector({
	selectedId,
	onSelect,
}: {
	selectedId: string | null;
	onSelect: (id: string) => void;
}) {
	const { data, isLoading } = useAddresses();
	const addresses = data?.data ?? [];

	useEffect(() => {
		if (!selectedId && addresses.length > 0) {
			const def = addresses.find((a) => a.isDefault) ?? addresses[0];
			onSelect(def.id);
		}
	}, [addresses, selectedId]);

	if (isLoading) {
		return (
			<div className="space-y-2">
				{[1, 2].map((i) => (
					<Skeleton key={i} className="h-16 rounded-lg" />
				))}
			</div>
		);
	}

	if (addresses.length === 0) {
		return (
			<div className="rounded-lg border border-dashed p-6 text-center">
				<MapPin className="mx-auto h-8 w-8 text-muted-foreground/50" />
				<p className="mt-2 text-sm text-muted-foreground">No saved addresses</p>
				<Button variant="outline" size="sm" className="mt-3 gap-1.5">
					<Plus className="h-3.5 w-3.5" />
					Add Address
				</Button>
			</div>
		);
	}

	return (
		<RadioGroup value={selectedId ?? ""} onValueChange={onSelect}>
			<div className="space-y-2">
				{addresses.map((addr) => (
					<label
						key={addr.id}
						className={cn(
							"flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors",
							selectedId === addr.id
								? "border-primary bg-primary/5"
								: "hover:bg-accent",
						)}>
						<RadioGroupItem value={addr.id} className="mt-0.5" />
						<div className="flex-1">
							<div className="flex items-center gap-2">
								<span className="text-sm font-semibold">{addr.label}</span>
								{addr.isDefault && (
									<Badge variant="secondary" className="text-[10px]">
										Default
									</Badge>
								)}
							</div>
							<p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
								{addr.address}
							</p>
						</div>
					</label>
				))}
			</div>
		</RadioGroup>
	);
}

/* ------------------------------------------------------------------ */
/*  Payment Method Selector                                           */
/* ------------------------------------------------------------------ */
const PAYMENT_OPTIONS = [
	{
		value: PaymentMethod.Wallet,
		label: "Wallet",
		icon: Wallet,
		color: "text-primary",
	},
	{
		value: PaymentMethod.Card,
		label: "Card",
		icon: CreditCard,
		color: "text-blue-500",
	},
	{
		value: PaymentMethod.MobileMoney,
		label: "Mobile Money",
		icon: Smartphone,
		color: "text-purple-500",
	},
	{
		value: PaymentMethod.Cash,
		label: "Cash on Delivery",
		icon: Banknote,
		color: "text-green-600",
	},
] as const;

function PaymentSelector({
	selected,
	onSelect,
	walletBalance,
	total,
}: {
	selected: PaymentMethod;
	onSelect: (m: PaymentMethod) => void;
	walletBalance: number | null;
	total: number;
}) {
	const insufficientBalance =
		selected === PaymentMethod.Wallet &&
		walletBalance !== null &&
		walletBalance < total;

	return (
		<div className="space-y-2">
			<RadioGroup
				value={String(selected)}
				onValueChange={(v) => onSelect(Number(v) as PaymentMethod)}>
				{PAYMENT_OPTIONS.map((pm) => (
					<label
						key={pm.value}
						className={cn(
							"flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors",
							selected === pm.value
								? "border-primary bg-primary/5"
								: "hover:bg-accent",
						)}>
						<RadioGroupItem value={String(pm.value)} />
						<pm.icon className={cn("h-5 w-5", pm.color)} />
						<span className="flex-1 text-sm font-medium">{pm.label}</span>
						{pm.value === PaymentMethod.Wallet && walletBalance !== null && (
							<span className="text-xs text-muted-foreground">
								Balance: {formatCurrency(walletBalance)}
							</span>
						)}
					</label>
				))}
			</RadioGroup>

			{insufficientBalance && (
				<div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-xs text-destructive">
					<AlertCircle className="h-4 w-4 shrink-0" />
					<p>
						Insufficient wallet balance. Please top up or choose a different
						payment method.
					</p>
				</div>
			)}
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  Order Item Summary                                                */
/* ------------------------------------------------------------------ */
function OrderSummaryItems() {
	const { items, vendorName, getSubtotal, getItemTotal } = useCartStore();

	return (
		<div>
			<p className="mb-2 text-xs text-muted-foreground">
				from <span className="font-medium text-foreground">{vendorName}</span>
			</p>
			<div className="divide-y">
				{items.map((item) => (
					<div key={item.key} className="flex items-start justify-between py-2">
						<div className="min-w-0 flex-1">
							<p className="text-sm">
								<span className="font-medium">{item.quantity}×</span>{" "}
								{item.productName}
							</p>
							{item.variant && (
								<p className="text-xs text-muted-foreground">
									{item.variant.option}
								</p>
							)}
							{item.extras.length > 0 && (
								<p className="text-xs text-muted-foreground">
									+ {item.extras.map((e) => e.name).join(", ")}
								</p>
							)}
						</div>
						<span className="ml-4 shrink-0 text-sm">
							{formatCurrency(getItemTotal(item.key))}
						</span>
					</div>
				))}
			</div>
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  Checkout Page                                                     */
/* ------------------------------------------------------------------ */
export default function CheckoutPage() {
	const router = useRouter();
	const { isAuthenticated } = useAuthStore();
	const { vendorId, vendorName, items, getSubtotal, getItemCount, clearCart } =
		useCartStore();

	const itemCount = getItemCount();
	const subtotal = getSubtotal();

	// Redirect unauthenticated users
	useEffect(() => {
		if (!isAuthenticated) {
			router.push("/login?redirect=/shop/checkout");
		}
	}, [isAuthenticated]);

	// Redirect if cart is empty
	useEffect(() => {
		if (itemCount === 0) {
			router.push("/shop/cart");
		}
	}, [itemCount]);

	// Fetch vendor details for address
	const { data: vendorData } = useVendorDetail(vendorId ?? "");
	const vendor = vendorData?.data;

	// Wallet balance
	const { data: walletData } = useWallet();
	const walletBalance = walletData?.data?.balance ?? null;

	// State
	const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
		null,
	);
	const [paymentMethod, setPaymentMethod] = useState(PaymentMethod.Wallet);
	const [specialInstructions, setSpecialInstructions] = useState("");
	const [promoCode, setPromoCode] = useState("");
	const [promoApplied, setPromoApplied] = useState(false);
	const [isScheduled, setIsScheduled] = useState(false);

	// Get the selected address
	const { data: addressesData } = useAddresses();
	const addresses = addressesData?.data ?? [];
	const selectedAddress = addresses.find((a) => a.id === selectedAddressId);

	// Pricing
	const deliveryFee = vendor?.deliveryFee ?? 500;
	const discount = promoApplied ? Math.round(subtotal * 0.1) : 0;
	const total = subtotal + deliveryFee - discount;

	// Place order mutation
	const placeOrder = usePlaceOrder();

	const canPlaceOrder =
		selectedAddressId &&
		itemCount > 0 &&
		!(
			paymentMethod === PaymentMethod.Wallet &&
			walletBalance !== null &&
			walletBalance < total
		) &&
		!placeOrder.isPending;

	async function handlePlaceOrder() {
		if (!canPlaceOrder || !vendor || !selectedAddress) return;

		try {
			const result = await placeOrder.mutateAsync({
				vendorId: vendor.id,
				pickupAddress: vendor.address,
				pickupLatitude: vendor.latitude,
				pickupLongitude: vendor.longitude,
				dropoffAddress: selectedAddress.address,
				dropoffLatitude: selectedAddress.latitude,
				dropoffLongitude: selectedAddress.longitude,
				priority: "Standard",
				scheduledFor: null,
				notes: specialInstructions.trim(),
				paymentMethod: paymentMethod,
				promoCode: promoApplied ? promoCode : null,
				orderItems: items.map((item) => ({
					productId: item.productId,
					quantity: item.quantity,
					unitPrice: item.unitPrice,
					notes: item.notes || null,
					selectedVariantJson: item.variant
						? JSON.stringify(item.variant)
						: null,
					selectedExtrasJson:
						item.extras.length > 0 ? JSON.stringify(item.extras) : null,
				})),
			});

			// Success: clear cart, navigate to confirmation
			clearCart();
			const errandId = result?.data?.id;
			router.push(
				`/shop/order-confirmation${errandId ? `?id=${errandId}` : ""}`,
			);
		} catch (err: any) {
			toast.error("Failed to place order", {
				description: err?.message || "Something went wrong. Please try again.",
			});
		}
	}

	if (!isAuthenticated || itemCount === 0) return null;

	return (
		<div className="container mx-auto max-w-3xl px-4 py-6 pb-32">
			{/* Header */}
			<div className="mb-6 flex items-center gap-3">
				<Button variant="ghost" size="icon" asChild>
					<Link href="/shop/cart">
						<ArrowLeft className="h-5 w-5" />
					</Link>
				</Button>
				<h1 className="text-xl font-bold">Checkout</h1>
			</div>

			<div className="space-y-6">
				{/* 1. Delivery Address */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-base">
							<MapPin className="h-4 w-4 text-primary" />
							Delivery Address
						</CardTitle>
					</CardHeader>
					<CardContent>
						<AddressSelector
							selectedId={selectedAddressId}
							onSelect={setSelectedAddressId}
						/>
					</CardContent>
				</Card>

				{/* 2. Delivery Schedule */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-base">
							<Clock className="h-4 w-4 text-blue-500" />
							Delivery Time
						</CardTitle>
					</CardHeader>
					<CardContent>
						<RadioGroup
							value={isScheduled ? "scheduled" : "now"}
							onValueChange={(v) => setIsScheduled(v === "scheduled")}>
							<label
								className={cn(
									"flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors",
									!isScheduled
										? "border-primary bg-primary/5"
										: "hover:bg-accent",
								)}>
								<RadioGroupItem value="now" />
								<div>
									<p className="text-sm font-medium">Deliver Now</p>
									<p className="text-xs text-muted-foreground">
										Estimated{" "}
										{vendor
											? `${vendor.estimatedPrepTimeMinutes}–${vendor.estimatedPrepTimeMinutes + 15} min`
											: "30–45 min"}
									</p>
								</div>
							</label>
							<label
								className={cn(
									"flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors",
									isScheduled
										? "border-primary bg-primary/5"
										: "hover:bg-accent",
								)}>
								<RadioGroupItem value="scheduled" />
								<div>
									<p className="text-sm font-medium">Schedule for Later</p>
									<p className="text-xs text-muted-foreground">
										Choose a delivery time
									</p>
								</div>
							</label>
						</RadioGroup>
					</CardContent>
				</Card>

				{/* 3. Special Instructions */}
				<Card>
					<CardHeader>
						<CardTitle className="text-base">Special Instructions</CardTitle>
					</CardHeader>
					<CardContent>
						<Textarea
							value={specialInstructions}
							onChange={(e) => setSpecialInstructions(e.target.value)}
							placeholder="Leave at the gate, call when arriving, allergies, etc."
							rows={2}
							className="resize-none"
						/>
					</CardContent>
				</Card>

				{/* 4. Payment Method */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-base">
							<CreditCard className="h-4 w-4 text-blue-500" />
							Payment Method
						</CardTitle>
					</CardHeader>
					<CardContent>
						<PaymentSelector
							selected={paymentMethod}
							onSelect={setPaymentMethod}
							walletBalance={walletBalance}
							total={total}
						/>
					</CardContent>
				</Card>

				{/* 5. Promo Code */}
				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center gap-2">
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
								✓ 10% discount applied
							</p>
						)}
					</CardContent>
				</Card>

				{/* 6. Order Summary */}
				<Card>
					<CardHeader>
						<CardTitle className="text-base">Order Summary</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						<OrderSummaryItems />

						<Separator />

						<div className="space-y-1.5">
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
							<div className="flex justify-between text-base font-bold">
								<span>Total</span>
								<span>{formatCurrency(total)}</span>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Place Order CTA — sticky bottom */}
			<div className="fixed bottom-0 left-0 right-0 border-t bg-background px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
				<div className="mx-auto max-w-3xl">
					<Button
						className="w-full gap-2"
						size="lg"
						disabled={!canPlaceOrder}
						onClick={handlePlaceOrder}>
						{placeOrder.isPending ? (
							<>
								<Loader2 className="h-4 w-4 animate-spin" />
								Placing Order...
							</>
						) : (
							<>
								<ShoppingBag className="h-4 w-4" />
								Place Order — {formatCurrency(total)}
							</>
						)}
					</Button>
					<p className="mt-2 text-center text-[11px] text-muted-foreground">
						By placing this order, you agree to our{" "}
						<Link href="/terms" className="underline">
							Terms of Service
						</Link>
					</p>
				</div>
			</div>
		</div>
	);
}
