"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueries } from "@tanstack/react-query";
import {
	ArrowLeft,
	MapPin,
	CreditCard,
	Wallet,
	Banknote,
	Clock,
	ShoppingBag,
	Store,
	AlertCircle,
	Loader2,
	Plus,
	Check,
	Route,
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
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	useCartStore,
	type CartItem,
	type VendorCartGroup,
} from "@/lib/stores/cart-store";
import {
	useAddresses,
	useCreateAddress,
	usePlaceOrder,
	useValidatePromoCode,
	useWallet,
	type PlaceOrderPayload,
} from "@/lib/hooks";
import { useAuthStore } from "@/lib/stores/auth-store";
import { api } from "@/lib/api/client";
import {
	calculateDeliveryFee,
	calculateShortestRouteDistanceKm,
	haversineDistanceKm,
	splitAmountByWeights,
	type DeliveryPricingModel,
	type RoutePoint,
} from "@/lib/shop-checkout";
import { formatCurrency, cn } from "@/lib/utils";
import { PaymentMethod, type ApiResponse, type VendorDetailDto } from "@/types";
import {
	AddressAutocomplete,
	type AddressResult,
} from "@/components/shared/location-picker";
import { toast } from "sonner";

interface PriceEstimateResponse {
	estimatedPrice: number;
	baseFare: number;
	distanceFare: number;
	weightSurcharge: number;
	prioritySurcharge: number;
	estimatedDistanceKm: number;
	estimatedDurationMinutes: number;
}

interface VendorCheckoutSummary extends VendorCartGroup {
	vendor: VendorDetailDto | null;
	deliveryFeeShare: number;
	belowMinimum: boolean;
}

function ensureSuccess<T>(response: ApiResponse<T>, fallback: string): T {
	if (!response.success || !response.data) {
		throw new Error(response.error?.message ?? fallback);
	}

	return response.data;
}

function buildVariantPayload(item: CartItem): string | null {
	if (!item.variant) return null;

	return JSON.stringify([
		{
			name: item.variant.name,
			option: {
				label: item.variant.option,
				priceAdjustment: item.variant.priceAdjustment,
			},
		},
	]);
}

function buildExtrasPayload(item: CartItem): string | null {
	if (item.extras.length === 0) return null;

	return JSON.stringify(
		item.extras.map((extra) => ({
			extra: {
				name: extra.name,
				price: extra.price,
			},
			quantity: 1,
		})),
	);
}

function AddressSelector({
	selectedId,
	onSelect,
}: {
	selectedId: string | null;
	onSelect: (id: string) => void;
}) {
	const { data, isLoading } = useAddresses();
	const addresses = data?.data ?? [];
	const createAddress = useCreateAddress();

	const [dialogOpen, setDialogOpen] = useState(false);
	const [newLabel, setNewLabel] = useState("");
	const [newAddress, setNewAddress] = useState<AddressResult | null>(null);

	useEffect(() => {
		if (!selectedId && addresses.length > 0) {
			const defaultAddress =
				addresses.find((address) => address.isDefault) ?? addresses[0];
			onSelect(defaultAddress.id);
		}
	}, [addresses, selectedId, onSelect]);

	async function handleSaveAddress() {
		if (!newAddress || !newLabel.trim()) return;

		try {
			const result = await createAddress.mutateAsync({
				label: newLabel.trim(),
				address: newAddress.address,
				latitude: newAddress.latitude,
				longitude: newAddress.longitude,
				isDefault: addresses.length === 0,
			});

			if (result?.data?.id) {
				onSelect(result.data.id);
			}

			setDialogOpen(false);
			setNewLabel("");
			setNewAddress(null);
			toast.success("Address saved");
		} catch {
			toast.error("Failed to save address");
		}
	}

	if (isLoading) {
		return (
			<div className="space-y-2">
				{[1, 2].map((index) => (
					<Skeleton key={index} className="h-16 rounded-lg" />
				))}
			</div>
		);
	}

	if (addresses.length === 0) {
		return (
			<>
				<div className="rounded-lg border border-dashed p-6 text-center">
					<MapPin className="mx-auto h-8 w-8 text-muted-foreground/50" />
					<p className="mt-2 text-sm text-muted-foreground">
						No saved addresses
					</p>
					<Button
						variant="outline"
						size="sm"
						className="mt-3 gap-1.5"
						onClick={() => setDialogOpen(true)}>
						<Plus className="h-3.5 w-3.5" />
						Add Address
					</Button>
				</div>
				<AddAddressDialog
					open={dialogOpen}
					onOpenChange={setDialogOpen}
					label={newLabel}
					onLabelChange={setNewLabel}
					onAddressSelect={setNewAddress}
					selectedAddress={newAddress}
					onSave={handleSaveAddress}
					isSaving={createAddress.isPending}
				/>
			</>
		);
	}

	return (
		<>
			<RadioGroup value={selectedId ?? ""} onValueChange={onSelect}>
				<div className="space-y-2">
					{addresses.map((address) => (
						<label
							key={address.id}
							className={cn(
								"flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors",
								selectedId === address.id
									? "border-primary bg-primary/5"
									: "hover:bg-accent",
							)}>
							<RadioGroupItem value={address.id} className="mt-0.5" />
							<div className="flex-1">
								<div className="flex items-center gap-2">
									<span className="text-sm font-semibold">{address.label}</span>
									{address.isDefault && (
										<Badge variant="secondary" className="text-[10px]">
											Default
										</Badge>
									)}
								</div>
								<p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
									{address.address}
								</p>
							</div>
						</label>
					))}
				</div>
			</RadioGroup>
			<Button
				variant="outline"
				size="sm"
				className="mt-3 gap-1.5"
				onClick={() => setDialogOpen(true)}>
				<Plus className="h-3.5 w-3.5" />
				Add Address
			</Button>
			<AddAddressDialog
				open={dialogOpen}
				onOpenChange={setDialogOpen}
				label={newLabel}
				onLabelChange={setNewLabel}
				onAddressSelect={setNewAddress}
				selectedAddress={newAddress}
				onSave={handleSaveAddress}
				isSaving={createAddress.isPending}
			/>
		</>
	);
}

function AddAddressDialog({
	open,
	onOpenChange,
	label,
	onLabelChange,
	onAddressSelect,
	selectedAddress,
	onSave,
	isSaving,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	label: string;
	onLabelChange: (value: string) => void;
	onAddressSelect: (address: AddressResult) => void;
	selectedAddress: AddressResult | null;
	onSave: () => void;
	isSaving: boolean;
}) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Add New Address</DialogTitle>
				</DialogHeader>
				<div className="space-y-4 py-2">
					<div className="space-y-2">
						<Label htmlFor="addr-label">Label</Label>
						<Input
							id="addr-label"
							value={label}
							onChange={(event) => onLabelChange(event.target.value)}
							placeholder="e.g. Home, Office, School"
						/>
					</div>
					<div className="space-y-2">
						<Label>Address</Label>
						<AddressAutocomplete onSelect={onAddressSelect} />
						{selectedAddress && (
							<p className="text-xs text-muted-foreground">
								<Check className="mr-1 inline h-3 w-3 text-primary" />
								{selectedAddress.address}
							</p>
						)}
					</div>
				</div>
				<DialogFooter>
					<Button
						onClick={onSave}
						disabled={!label.trim() || !selectedAddress || isSaving}>
						{isSaving ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Saving…
							</>
						) : (
							"Save Address"
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

const PAYMENT_OPTIONS = [
	{
		value: PaymentMethod.Wallet,
		label: "Wallet",
		icon: Wallet,
		color: "text-primary",
	},
	{
		value: PaymentMethod.BankTransfer,
		label: "Bank Transfer",
		icon: Banknote,
		color: "text-green-600",
	},
	{
		value: PaymentMethod.Card,
		label: "Pay with Card",
		icon: CreditCard,
		color: "text-blue-600",
	},
] as const;

function PaymentSelector({
	selected,
	onSelect,
	walletBalance,
	walletReady,
	total,
	multiVendorCart,
}: {
	selected: PaymentMethod;
	onSelect: (method: PaymentMethod) => void;
	walletBalance: number | null;
	walletReady: boolean;
	total: number;
	multiVendorCart: boolean;
}) {
	const insufficientBalance =
		selected === PaymentMethod.Wallet &&
		walletBalance !== null &&
		walletBalance < total;
	const missingWallet = selected === PaymentMethod.Wallet && !walletReady;

	return (
		<div className="space-y-2">
			<RadioGroup
				value={String(selected)}
				onValueChange={(value) => onSelect(Number(value) as PaymentMethod)}>
				{PAYMENT_OPTIONS.map((option) => {
					const disabled =
						multiVendorCart && option.value !== PaymentMethod.Wallet;

					return (
						<label
							key={option.value}
							className={cn(
								"flex items-center gap-3 rounded-lg border p-3 transition-colors",
								disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
								selected === option.value
									? "border-primary bg-primary/5"
									: !disabled && "hover:bg-accent",
							)}>
							<RadioGroupItem
								value={String(option.value)}
								disabled={disabled}
							/>
							<option.icon className={cn("h-5 w-5", option.color)} />
							<span className="flex-1 text-sm font-medium">{option.label}</span>
							{option.value === PaymentMethod.Wallet &&
								walletBalance !== null && (
									<span className="text-xs text-muted-foreground">
										Balance: {formatCurrency(walletBalance)}
									</span>
								)}
							{disabled && (
								<Badge variant="secondary" className="text-[10px]">
									Single-vendor only
								</Badge>
							)}
						</label>
					);
				})}
			</RadioGroup>

			{multiVendorCart && (
				<div className="flex items-center gap-2 rounded-md bg-primary/10 p-3 text-xs text-primary">
					<Route className="h-4 w-4 shrink-0" />
					<p>
						Multi-vendor checkout is currently completed in one wallet-paid
						flow.
					</p>
				</div>
			)}

			{missingWallet && (
				<div className="flex items-center gap-2 rounded-md bg-amber-100 p-3 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
					<AlertCircle className="h-4 w-4 shrink-0" />
					<p>
						Create your wallet from the dashboard before using wallet payment.
					</p>
				</div>
			)}

			{insufficientBalance && (
				<div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-xs text-destructive">
					<AlertCircle className="h-4 w-4 shrink-0" />
					<p>
						Insufficient wallet balance. Please top up before placing this
						order.
					</p>
				</div>
			)}
		</div>
	);
}

function VendorSummary({ summary }: { summary: VendorCheckoutSummary }) {
	return (
		<div className="rounded-xl border border-border/70 p-4">
			<div className="flex items-center justify-between gap-3">
				<div className="flex items-center gap-3">
					<div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
						<Store className="h-4 w-4" />
					</div>
					<div>
						<p className="font-semibold">{summary.vendorName}</p>
						<p className="text-xs text-muted-foreground">
							{summary.itemCount} {summary.itemCount === 1 ? "item" : "items"}
						</p>
					</div>
				</div>
				<Link
					href={`/shop/vendors/${summary.vendorId}`}
					className="text-xs font-medium text-primary hover:text-primary/80">
					Edit cart
				</Link>
			</div>

			<div className="mt-4 divide-y">
				{summary.items.map((item) => {
					const lineTotal =
						(item.unitPrice +
							(item.variant?.priceAdjustment ?? 0) +
							item.extras.reduce((sum, extra) => sum + extra.price, 0)) *
						item.quantity;

					return (
						<div
							key={item.key}
							className="flex items-start justify-between py-2 text-sm">
							<div className="min-w-0 flex-1">
								<p>
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
										+ {item.extras.map((extra) => extra.name).join(", ")}
									</p>
								)}
							</div>
							<span className="ml-4 shrink-0 font-medium">
								{formatCurrency(lineTotal)}
							</span>
						</div>
					);
				})}
			</div>

			<div className="mt-4 space-y-1.5 text-sm">
				<div className="flex justify-between">
					<span className="text-muted-foreground">Items subtotal</span>
					<span>{formatCurrency(summary.subtotal)}</span>
				</div>
				<div className="flex justify-between">
					<span className="text-muted-foreground">Delivery share</span>
					<span>{formatCurrency(summary.deliveryFeeShare)}</span>
				</div>
			</div>

			{summary.belowMinimum && summary.vendor && (
				<div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
					Minimum order for {summary.vendorName} is{" "}
					{formatCurrency(summary.vendor.minimumOrderAmount)}. Add{" "}
					{formatCurrency(summary.vendor.minimumOrderAmount - summary.subtotal)}{" "}
					more to continue.
				</div>
			)}
		</div>
	);
}

export default function CheckoutPage() {
	const router = useRouter();
	const { isAuthenticated } = useAuthStore();
	const { clearCart, clearVendors, getItemCount, getSubtotal, getVendorCarts } =
		useCartStore();

	const vendorCarts = getVendorCarts();
	const itemCount = getItemCount();
	const subtotal = getSubtotal();
	const multiVendorCart = vendorCarts.length > 1;

	useEffect(() => {
		if (!isAuthenticated) {
			router.push("/login?redirect=/shop/checkout");
		}
	}, [isAuthenticated, router]);

	useEffect(() => {
		if (itemCount === 0) {
			router.push("/shop/cart");
		}
	}, [itemCount, router]);

	const vendorQueries = useQueries({
		queries: vendorCarts.map((vendorCart) => ({
			queryKey: ["checkout-vendor", vendorCart.vendorId],
			queryFn: async () =>
				ensureSuccess(
					await api.get<VendorDetailDto>(`/vendors/${vendorCart.vendorId}`),
					"Failed to load vendor.",
				),
			staleTime: 60_000,
			enabled: vendorCarts.length > 0,
		})),
	});

	const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
		null,
	);
	const [paymentMethod, setPaymentMethod] = useState(PaymentMethod.Wallet);
	const [specialInstructions, setSpecialInstructions] = useState("");
	const [promoCode, setPromoCode] = useState("");
	const [appliedPromo, setAppliedPromo] = useState<{
		code: string;
		discountAmount: number;
	} | null>(null);
	const [isScheduled, setIsScheduled] = useState(false);
	const [scheduledTime, setScheduledTime] = useState("");

	const { data: addressesData } = useAddresses();
	const addresses = addressesData?.data ?? [];
	const selectedAddress = addresses.find(
		(address) => address.id === selectedAddressId,
	);

	const estimateQueries = useQueries({
		queries: vendorQueries.map((query, index) => ({
			queryKey: [
				"checkout-delivery-estimate",
				vendorCarts[index]?.vendorId,
				selectedAddressId,
			],
			queryFn: async () => {
				const vendor = query.data;
				if (!vendor || !selectedAddress) {
					throw new Error("Delivery estimate unavailable.");
				}

				return ensureSuccess(
					await api.get<PriceEstimateResponse>("/errands/estimate", {
						Category: 0,
						PickupLatitude: vendor.latitude,
						PickupLongitude: vendor.longitude,
						DropoffLatitude: selectedAddress.latitude,
						DropoffLongitude: selectedAddress.longitude,
						Priority: 0,
					}),
					"Failed to estimate delivery.",
				);
			},
			enabled: !!query.data && !!selectedAddress,
			staleTime: 5 * 60_000,
		})),
	});

	const vendorSummaries = useMemo<VendorCheckoutSummary[]>(() => {
		const points: RoutePoint[] = vendorQueries
			.map((query, index) => {
				const vendor = query.data;
				if (!vendor) return null;

				return {
					id: vendorCarts[index].vendorId,
					latitude: vendor.latitude,
					longitude: vendor.longitude,
				};
			})
			.filter((point): point is RoutePoint => point !== null);

		const pricingSeed =
			estimateQueries.find((query) => query.data)?.data ?? null;
		const pricingModel: DeliveryPricingModel | null = pricingSeed
			? {
					baseFare: pricingSeed.baseFare,
					perKmRate:
						pricingSeed.estimatedDistanceKm > 0
							? pricingSeed.distanceFare / pricingSeed.estimatedDistanceKm
							: 0,
				}
			: null;

		const combinedDistanceKm =
			selectedAddress && points.length > 0
				? calculateShortestRouteDistanceKm(points, selectedAddress)
				: 0;
		const combinedDeliveryFee =
			selectedAddress && pricingModel
				? calculateDeliveryFee(combinedDistanceKm, pricingModel)
				: 0;

		const weights =
			selectedAddress && points.length > 0
				? points.map((point) => haversineDistanceKm(point, selectedAddress))
				: vendorCarts.map(() => 1);
		const deliveryFeeShares = splitAmountByWeights(
			combinedDeliveryFee,
			weights,
		);

		return vendorCarts.map((vendorCart, index) => {
			const vendor = vendorQueries[index]?.data ?? null;

			return {
				...vendorCart,
				vendor,
				deliveryFeeShare: deliveryFeeShares[index] ?? 0,
				belowMinimum:
					!!vendor &&
					vendor.minimumOrderAmount > 0 &&
					vendorCart.subtotal < vendor.minimumOrderAmount,
			};
		});
	}, [estimateQueries, selectedAddress, vendorCarts, vendorQueries]);

	const combinedDeliveryFee = useMemo(
		() =>
			vendorSummaries.reduce(
				(sum, summary) => sum + summary.deliveryFeeShare,
				0,
			),
		[vendorSummaries],
	);

	const vendorsReady = vendorSummaries.every((summary) => !!summary.vendor);
	const deliveryReady =
		!selectedAddress ||
		vendorSummaries.every(
			(summary, index) => !summary.vendor || !!estimateQueries[index]?.data,
		);

	const { data: walletData } = useWallet();
	const wallet = walletData?.data ?? null;
	const walletBalance = wallet?.balance ?? null;

	const placeOrder = usePlaceOrder();
	const validatePromo = useValidatePromoCode();

	useEffect(() => {
		if (multiVendorCart && paymentMethod !== PaymentMethod.Wallet) {
			setPaymentMethod(PaymentMethod.Wallet);
		}
	}, [multiVendorCart, paymentMethod]);

	useEffect(() => {
		setAppliedPromo(null);
		if (multiVendorCart) {
			setPromoCode("");
		}
	}, [subtotal, combinedDeliveryFee, selectedAddressId, multiVendorCart]);

	const discount = appliedPromo?.discountAmount ?? 0;
	const total = subtotal + combinedDeliveryFee - discount;
	const anyBelowMinimum = vendorSummaries.some(
		(summary) => summary.belowMinimum,
	);
	const vendorsLoading = vendorQueries.some((query) => query.isLoading);
	const deliveryLoading =
		!!selectedAddress && estimateQueries.some((query) => query.isLoading);

	const canPlaceOrder =
		!!selectedAddressId &&
		vendorSummaries.length > 0 &&
		!vendorsLoading &&
		!deliveryLoading &&
		vendorsReady &&
		deliveryReady &&
		!anyBelowMinimum &&
		!(isScheduled && !scheduledTime) &&
		!(paymentMethod === PaymentMethod.Wallet && !wallet?.isActive) &&
		!(
			paymentMethod === PaymentMethod.Wallet &&
			walletBalance !== null &&
			walletBalance < total
		) &&
		!(multiVendorCart && paymentMethod !== PaymentMethod.Wallet) &&
		!placeOrder.isPending;

	async function handlePlaceOrder() {
		if (!canPlaceOrder || !selectedAddress) return;

		const successfulResults: Array<{ vendorId: string; errandId: string }> = [];

		try {
			for (const summary of vendorSummaries) {
				if (!summary.vendor) {
					throw new Error(
						`Vendor ${summary.vendorName} is not available right now.`,
					);
				}

				const payload: PlaceOrderPayload = {
					vendorId: summary.vendorId,
					dropoffAddress: selectedAddress.address,
					dropoffLatitude: selectedAddress.latitude,
					dropoffLongitude: selectedAddress.longitude,
					deliveryFeeOverride: summary.deliveryFeeShare,
					recipientName: null,
					recipientPhone: null,
					specialInstructions: specialInstructions.trim() || null,
					paymentMethod,
					promoCode: multiVendorCart ? null : (appliedPromo?.code ?? null),
					scheduledAt:
						isScheduled && scheduledTime
							? new Date(scheduledTime).toISOString()
							: null,
					items: summary.items.map((item) => ({
						productId: item.productId,
						quantity: item.quantity,
						notes: item.notes || null,
						selectedVariantJson: buildVariantPayload(item),
						selectedExtrasJson: buildExtrasPayload(item),
					})),
				};

				const result = await placeOrder.mutateAsync(payload);
				const errandId = result?.data?.errand?.id;
				const checkoutUrl = result?.data?.checkoutUrl;

				if (!errandId) {
					throw new Error(`Failed to place order for ${summary.vendorName}.`);
				}

				successfulResults.push({ vendorId: summary.vendorId, errandId });

				if (checkoutUrl) {
					clearCart();
					window.location.href = checkoutUrl;
					return;
				}
			}

			clearCart();
			const orderIds = successfulResults.map((result) => result.errandId);
			router.push(
				orderIds.length === 1
					? `/shop/order-confirmation?id=${orderIds[0]}`
					: `/shop/order-confirmation?ids=${encodeURIComponent(orderIds.join(","))}`,
			);
		} catch (error) {
			if (successfulResults.length > 0) {
				clearVendors(successfulResults.map((result) => result.vendorId));
				router.push(
					`/shop/order-confirmation?ids=${encodeURIComponent(
						successfulResults.map((result) => result.errandId).join(","),
					)}`,
				);
				toast.error("Some orders were placed", {
					description:
						"Completed vendor orders were saved. Remaining vendors are still in your cart.",
				});
				return;
			}

			toast.error("Failed to place order", {
				description:
					error instanceof Error
						? error.message
						: "Something went wrong. Please try again.",
			});
		}
	}

	if (!isAuthenticated || itemCount === 0) return null;

	return (
		<div className="container mx-auto max-w-4xl px-4 py-6 pb-32">
			<div className="mb-6 flex items-center gap-3">
				<Button variant="ghost" size="icon" asChild>
					<Link href="/shop/cart">
						<ArrowLeft className="h-5 w-5" />
					</Link>
				</Button>
				<div>
					<h1 className="text-xl font-bold">Checkout</h1>
					<p className="text-sm text-muted-foreground">
						{vendorSummaries.length}{" "}
						{vendorSummaries.length === 1 ? "vendor" : "vendors"} · {itemCount}{" "}
						{itemCount === 1 ? "item" : "items"}
					</p>
				</div>
			</div>

			{anyBelowMinimum && (
				<div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
					<AlertCircle className="h-4 w-4 shrink-0" />
					<span>
						One or more vendor carts are below minimum order. Adjust those carts
						before placing your order.
					</span>
				</div>
			)}

			<div className="space-y-6">
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
							onValueChange={(value) => setIsScheduled(value === "scheduled")}>
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
										Pickup routing is optimized across all selected vendors.
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

						{isScheduled && (
							<div className="mt-3">
								<Label
									htmlFor="scheduled-time"
									className="text-xs text-muted-foreground">
									Delivery date &amp; time
								</Label>
								<Input
									id="scheduled-time"
									type="datetime-local"
									value={scheduledTime}
									onChange={(event) => setScheduledTime(event.target.value)}
									min={new Date(Date.now() + 60 * 60_000)
										.toISOString()
										.slice(0, 16)}
									className="mt-1"
								/>
							</div>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-base">Special Instructions</CardTitle>
					</CardHeader>
					<CardContent>
						<Textarea
							value={specialInstructions}
							onChange={(event) => setSpecialInstructions(event.target.value)}
							placeholder="Gate code, delivery notes, allergies, or drop-off guidance."
							rows={2}
							className="resize-none"
						/>
					</CardContent>
				</Card>

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
							walletReady={!!wallet?.isActive}
							total={total}
							multiVendorCart={multiVendorCart}
						/>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center gap-2">
							<Input
								value={promoCode}
								onChange={(event) =>
									setPromoCode(event.target.value.toUpperCase())
								}
								placeholder={
									multiVendorCart
										? "Promo codes apply to single-vendor checkout"
										: "Promo code"
								}
								className="flex-1"
								disabled={multiVendorCart}
							/>
							<Button
								variant="outline"
								size="sm"
								onClick={async () => {
									try {
										const response = await validatePromo.mutateAsync({
											code: promoCode.trim(),
											orderAmount: subtotal + combinedDeliveryFee,
										});

										if (!response.data?.isValid) {
											toast.error(
												response.data?.message || "Promo code is not valid.",
											);
											setAppliedPromo(null);
											return;
										}

										setAppliedPromo({
											code: promoCode.trim(),
											discountAmount: response.data.discountAmount,
										});
										toast.success("Promo code applied.");
									} catch (error) {
										setAppliedPromo(null);
										toast.error(
											error instanceof Error
												? error.message
												: "Failed to validate promo code.",
										);
									}
								}}
								disabled={
									multiVendorCart ||
									!promoCode.trim() ||
									validatePromo.isPending
								}>
								{appliedPromo?.code === promoCode.trim()
									? "Applied"
									: validatePromo.isPending
										? "Checking..."
										: "Apply"}
							</Button>
						</div>
						{multiVendorCart && (
							<p className="mt-2 text-xs text-muted-foreground">
								Promo codes are currently limited to single-vendor marketplace
								checkout.
							</p>
						)}
						{appliedPromo && !multiVendorCart && (
							<p className="mt-2 text-xs text-primary">
								✓ {formatCurrency(appliedPromo.discountAmount)} discount applied
							</p>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-base">
							<Route className="h-4 w-4 text-primary" />
							Order Summary
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						{vendorSummaries.map((summary) => (
							<VendorSummary key={summary.vendorId} summary={summary} />
						))}

						<Separator />

						<div className="space-y-1.5">
							<div className="flex justify-between text-sm">
								<span className="text-muted-foreground">Subtotal</span>
								<span>{formatCurrency(subtotal)}</span>
							</div>
							<div className="flex justify-between text-sm">
								<span className="text-muted-foreground">
									Combined delivery fee
								</span>
								<span>
									{deliveryLoading ? (
										<span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
											<Loader2 className="h-3.5 w-3.5 animate-spin" />
											Calculating
										</span>
									) : (
										formatCurrency(combinedDeliveryFee)
									)}
								</span>
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

			<div className="fixed bottom-0 left-0 right-0 border-t bg-background px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
				<div className="mx-auto max-w-4xl">
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
