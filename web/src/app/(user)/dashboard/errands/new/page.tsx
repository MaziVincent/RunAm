"use client";

import { useState as useFormState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
	ArrowLeft,
	ArrowRight,
	MapPin,
	Package,
	FileText,
	Truck,
	Clock,
	Zap,
	Calendar,
	CreditCard,
	Wallet,
	Smartphone,
	Banknote,
	Check,
	Loader2,
	Camera,
	AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAddresses, useWallet, usePlaceOrder } from "@/lib/hooks";
import { formatCurrency, cn } from "@/lib/utils";
import { PaymentMethod } from "@/types";
import { toast } from "sonner";

interface ErrandFormData {
	category: string;
	pickupAddress: string;
	pickupLat: number;
	pickupLng: number;
	dropoffAddress: string;
	dropoffLat: number;
	dropoffLng: number;
	recipientName: string;
	recipientPhone: string;
	description: string;
	packageSize: string;
	isFragile: boolean;
	priority: string;
	paymentMethod: number;
	specialInstructions: string;
}

const STEPS = [
	{ label: "Service", icon: Package },
	{ label: "Locations", icon: MapPin },
	{ label: "Details", icon: FileText },
	{ label: "Priority", icon: Clock },
	{ label: "Payment", icon: CreditCard },
	{ label: "Review", icon: Check },
];

const CATEGORIES = [
	{
		value: "package",
		label: "Package Delivery",
		icon: "📦",
		desc: "Send packages & parcels",
	},
	{
		value: "document",
		label: "Document Delivery",
		icon: "📄",
		desc: "Send important documents",
	},
	{
		value: "custom",
		label: "Custom Errand",
		icon: "🔧",
		desc: "Any other task",
	},
];

const PACKAGE_SIZES = [
	{ value: "small", label: "Small", desc: "Fits in a hand", hint: "< 2kg" },
	{ value: "medium", label: "Medium", desc: "Fits in a bag", hint: "2-5kg" },
	{ value: "large", label: "Large", desc: "Needs both hands", hint: "5-15kg" },
	{
		value: "extra_large",
		label: "Extra Large",
		desc: "Heavy / bulky",
		hint: "15kg+",
	},
];

export default function CreateErrandPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const initialCategory = searchParams.get("category") ?? "";

	const [step, setStep] = useFormState(initialCategory ? 1 : 0);
	const [form, setForm] = useFormState<ErrandFormData>({
		category: initialCategory || "package",
		pickupAddress: "",
		pickupLat: 0,
		pickupLng: 0,
		dropoffAddress: "",
		dropoffLat: 0,
		dropoffLng: 0,
		recipientName: "",
		recipientPhone: "",
		description: "",
		packageSize: "small",
		isFragile: false,
		priority: "standard",
		paymentMethod: PaymentMethod.Wallet,
		specialInstructions: "",
	});

	const { data: walletData } = useWallet();
	const walletBalance = walletData?.data?.balance ?? 0;
	const { data: addressesData } = useAddresses();
	const addresses = addressesData?.data ?? [];
	const placeOrder = usePlaceOrder();

	function update(partial: Partial<ErrandFormData>) {
		setForm((prev) => ({ ...prev, ...partial }));
	}

	function next() {
		setStep((s) => Math.min(s + 1, STEPS.length - 1));
	}

	function back() {
		if (step === 0) {
			router.back();
		} else {
			setStep((s) => s - 1);
		}
	}

	async function handleSubmit() {
		try {
			await placeOrder.mutateAsync({
				vendorId: "",
				pickupAddress: form.pickupAddress,
				pickupLatitude: form.pickupLat,
				pickupLongitude: form.pickupLng,
				dropoffAddress: form.dropoffAddress,
				dropoffLatitude: form.dropoffLat,
				dropoffLongitude: form.dropoffLng,
				priority: form.priority === "express" ? "Express" : "Standard",
				scheduledFor: null,
				notes: form.specialInstructions,
				paymentMethod: form.paymentMethod,
				promoCode: null,
				orderItems: [],
			});
			toast.success("Errand created successfully!");
			router.push("/dashboard/errands");
		} catch {
			toast.error("Failed to create errand");
		}
	}

	return (
		<div className="mx-auto max-w-2xl space-y-6">
			{/* Header */}
			<div className="flex items-center gap-3">
				<Button variant="ghost" size="icon" onClick={back}>
					<ArrowLeft className="h-5 w-5" />
				</Button>
				<div>
					<h1 className="text-xl font-bold">New Errand</h1>
					<p className="text-xs text-muted-foreground">
						Step {step + 1} of {STEPS.length}
					</p>
				</div>
			</div>

			{/* Progress bar */}
			<div className="flex gap-1">
				{STEPS.map((_, i) => (
					<div
						key={i}
						className={cn(
							"h-1.5 flex-1 rounded-full transition-colors",
							i <= step ? "bg-primary" : "bg-muted",
						)}
					/>
				))}
			</div>

			{/* Step Content */}
			{step === 0 && (
				<Card>
					<CardHeader>
						<CardTitle>What do you need?</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						{CATEGORIES.map((cat) => (
							<button
								key={cat.value}
								onClick={() => {
									update({ category: cat.value });
									next();
								}}
								className={cn(
									"flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-all hover:shadow-md",
									form.category === cat.value && "border-primary bg-primary/5",
								)}>
								<span className="text-3xl">{cat.icon}</span>
								<div>
									<p className="font-semibold">{cat.label}</p>
									<p className="text-xs text-muted-foreground">{cat.desc}</p>
								</div>
								<ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
							</button>
						))}

						<Separator className="my-4" />

						<p className="text-center text-sm text-muted-foreground">
							Need food or grocery delivery?{" "}
							<Link href="/shop" className="text-primary hover:underline">
								Visit the marketplace
							</Link>
						</p>
					</CardContent>
				</Card>
			)}

			{step === 1 && (
				<Card>
					<CardHeader>
						<CardTitle>Pickup & Dropoff</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label>Pickup Address</Label>
							<Input
								value={form.pickupAddress}
								onChange={(e) => update({ pickupAddress: e.target.value })}
								placeholder="Where should we pick up?"
							/>
							{addresses.length > 0 && (
								<div className="flex flex-wrap gap-2">
									{addresses.slice(0, 3).map((addr) => (
										<Button
											key={addr.id}
											variant="outline"
											size="sm"
											className="text-xs"
											onClick={() =>
												update({
													pickupAddress: addr.address,
													pickupLat: addr.latitude,
													pickupLng: addr.longitude,
												})
											}>
											<MapPin className="mr-1 h-3 w-3" />
											{addr.label}
										</Button>
									))}
								</div>
							)}
						</div>

						<div className="space-y-2">
							<Label>Dropoff Address</Label>
							<Input
								value={form.dropoffAddress}
								onChange={(e) => update({ dropoffAddress: e.target.value })}
								placeholder="Where should we deliver?"
							/>
							{addresses.length > 0 && (
								<div className="flex flex-wrap gap-2">
									{addresses.slice(0, 3).map((addr) => (
										<Button
											key={addr.id}
											variant="outline"
											size="sm"
											className="text-xs"
											onClick={() =>
												update({
													dropoffAddress: addr.address,
													dropoffLat: addr.latitude,
													dropoffLng: addr.longitude,
												})
											}>
											<MapPin className="mr-1 h-3 w-3" />
											{addr.label}
										</Button>
									))}
								</div>
							)}
						</div>

						<Separator />

						<div className="grid gap-4 sm:grid-cols-2">
							<div className="space-y-2">
								<Label>Recipient Name</Label>
								<Input
									value={form.recipientName}
									onChange={(e) => update({ recipientName: e.target.value })}
									placeholder="Recipient's name"
								/>
							</div>
							<div className="space-y-2">
								<Label>Recipient Phone</Label>
								<Input
									value={form.recipientPhone}
									onChange={(e) => update({ recipientPhone: e.target.value })}
									placeholder="080..."
								/>
							</div>
						</div>

						<div className="flex justify-end">
							<Button
								onClick={next}
								disabled={!form.pickupAddress || !form.dropoffAddress}>
								Continue
								<ArrowRight className="ml-2 h-4 w-4" />
							</Button>
						</div>
					</CardContent>
				</Card>
			)}

			{step === 2 && (
				<Card>
					<CardHeader>
						<CardTitle>Package Details</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label>Description</Label>
							<Textarea
								value={form.description}
								onChange={(e) => update({ description: e.target.value })}
								placeholder="What are you sending?"
								rows={3}
							/>
						</div>

						<div className="space-y-2">
							<Label>Package Size</Label>
							<div className="grid grid-cols-2 gap-3">
								{PACKAGE_SIZES.map((size) => (
									<button
										key={size.value}
										onClick={() => update({ packageSize: size.value })}
										className={cn(
											"rounded-xl border p-3 text-left transition-all",
											form.packageSize === size.value
												? "border-primary bg-primary/5"
												: "hover:bg-accent",
										)}>
										<p className="text-sm font-semibold">{size.label}</p>
										<p className="text-xs text-muted-foreground">{size.desc}</p>
										<Badge variant="secondary" className="mt-1 text-[10px]">
											{size.hint}
										</Badge>
									</button>
								))}
							</div>
						</div>

						<div className="flex items-center gap-3">
							<Checkbox
								id="fragile"
								checked={form.isFragile}
								onCheckedChange={(v) => update({ isFragile: Boolean(v) })}
							/>
							<Label
								htmlFor="fragile"
								className="flex items-center gap-2 cursor-pointer">
								<AlertTriangle className="h-4 w-4 text-yellow-500" />
								This package is fragile
							</Label>
						</div>

						<div className="flex justify-end">
							<Button onClick={next}>
								Continue
								<ArrowRight className="ml-2 h-4 w-4" />
							</Button>
						</div>
					</CardContent>
				</Card>
			)}

			{step === 3 && (
				<Card>
					<CardHeader>
						<CardTitle>Priority & Schedule</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<RadioGroup
							value={form.priority}
							onValueChange={(v) => update({ priority: v })}>
							{[
								{
									value: "standard",
									label: "Standard",
									desc: "Regular delivery speed",
									icon: Truck,
									price: null,
								},
								{
									value: "express",
									label: "Express",
									desc: "Priority pickup & delivery",
									icon: Zap,
									price: "+₦500",
								},
								{
									value: "scheduled",
									label: "Scheduled",
									desc: "Pick a date & time",
									icon: Calendar,
									price: null,
								},
							].map((opt) => (
								<label
									key={opt.value}
									className={cn(
										"flex cursor-pointer items-center gap-4 rounded-xl border p-4 transition-all",
										form.priority === opt.value
											? "border-primary bg-primary/5"
											: "hover:bg-accent",
									)}>
									<RadioGroupItem value={opt.value} />
									<opt.icon className="h-5 w-5 text-muted-foreground" />
									<div className="flex-1">
										<p className="text-sm font-semibold">{opt.label}</p>
										<p className="text-xs text-muted-foreground">{opt.desc}</p>
									</div>
									{opt.price && (
										<Badge variant="secondary" className="text-xs">
											{opt.price}
										</Badge>
									)}
								</label>
							))}
						</RadioGroup>

						<div className="space-y-2">
							<Label>Special Instructions (optional)</Label>
							<Textarea
								value={form.specialInstructions}
								onChange={(e) =>
									update({ specialInstructions: e.target.value })
								}
								placeholder="Anything the rider should know..."
								rows={2}
							/>
						</div>

						<div className="flex justify-end">
							<Button onClick={next}>
								Continue
								<ArrowRight className="ml-2 h-4 w-4" />
							</Button>
						</div>
					</CardContent>
				</Card>
			)}

			{step === 4 && (
				<Card>
					<CardHeader>
						<CardTitle>Payment Method</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<RadioGroup
							value={String(form.paymentMethod)}
							onValueChange={(v) => update({ paymentMethod: Number(v) })}>
							{[
								{
									value: PaymentMethod.Wallet,
									label: "Wallet",
									desc: `Balance: ${formatCurrency(walletBalance)}`,
									icon: Wallet,
								},
								{
									value: PaymentMethod.Card,
									label: "Card",
									desc: "Pay with debit/credit card",
									icon: CreditCard,
								},
								{
									value: PaymentMethod.MobileMoney,
									label: "Mobile Money",
									desc: "Pay with mobile money",
									icon: Smartphone,
								},
								{
									value: PaymentMethod.Cash,
									label: "Cash on Delivery",
									desc: "Pay the rider in cash",
									icon: Banknote,
								},
							].map((pm) => (
								<label
									key={pm.value}
									className={cn(
										"flex cursor-pointer items-center gap-4 rounded-xl border p-4 transition-all",
										form.paymentMethod === pm.value
											? "border-primary bg-primary/5"
											: "hover:bg-accent",
									)}>
									<RadioGroupItem value={String(pm.value)} />
									<pm.icon className="h-5 w-5 text-muted-foreground" />
									<div>
										<p className="text-sm font-semibold">{pm.label}</p>
										<p className="text-xs text-muted-foreground">{pm.desc}</p>
									</div>
								</label>
							))}
						</RadioGroup>

						<div className="flex justify-end">
							<Button onClick={next}>
								Review Order
								<ArrowRight className="ml-2 h-4 w-4" />
							</Button>
						</div>
					</CardContent>
				</Card>
			)}

			{step === 5 && (
				<Card>
					<CardHeader>
						<CardTitle>Review & Confirm</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-3 rounded-lg bg-muted/50 p-4">
							<div className="flex justify-between text-sm">
								<span className="text-muted-foreground">Service</span>
								<span className="font-medium capitalize">
									{form.category} delivery
								</span>
							</div>
							<Separator />
							<div className="space-y-1">
								<div className="flex gap-2 text-sm">
									<MapPin className="h-4 w-4 shrink-0 text-green-500 mt-0.5" />
									<span>{form.pickupAddress || "Not set"}</span>
								</div>
								<div className="flex gap-2 text-sm">
									<MapPin className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
									<span>{form.dropoffAddress || "Not set"}</span>
								</div>
							</div>
							<Separator />
							<div className="flex justify-between text-sm">
								<span className="text-muted-foreground">Package</span>
								<span className="font-medium capitalize">
									{form.packageSize}
									{form.isFragile ? " (Fragile)" : ""}
								</span>
							</div>
							<div className="flex justify-between text-sm">
								<span className="text-muted-foreground">Priority</span>
								<span className="font-medium capitalize">{form.priority}</span>
							</div>
							<div className="flex justify-between text-sm">
								<span className="text-muted-foreground">Payment</span>
								<span className="font-medium">
									{form.paymentMethod === PaymentMethod.Wallet
										? "Wallet"
										: form.paymentMethod === PaymentMethod.Card
											? "Card"
											: form.paymentMethod === PaymentMethod.Cash
												? "Cash"
												: "Mobile Money"}
								</span>
							</div>
						</div>

						{form.specialInstructions && (
							<div>
								<p className="text-xs text-muted-foreground mb-1">
									Special Instructions
								</p>
								<p className="text-sm">{form.specialInstructions}</p>
							</div>
						)}

						<Button
							className="w-full gap-2"
							size="lg"
							onClick={handleSubmit}
							disabled={placeOrder.isPending}>
							{placeOrder.isPending ? (
								<>
									<Loader2 className="h-4 w-4 animate-spin" />
									Creating...
								</>
							) : (
								<>
									<Check className="h-4 w-4" />
									Place Errand
								</>
							)}
						</Button>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
