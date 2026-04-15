"use client";

import { type Dispatch, type SetStateAction, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
	Landmark,
	Banknote,
	Check,
	Loader2,
	AlertTriangle,
	Plus,
	Trash2,
	Route,
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
import {
	useAddresses,
	useCreateErrand,
	useDeliveryEstimate,
	useGeocodeAddress,
	useProcessErrandPayment,
	useWallet,
} from "@/lib/hooks";
import { cn, formatCurrency } from "@/lib/utils";
import {
	ErrandCategory,
	ErrandPriority,
	PackageSize,
	PaymentMethod,
	type CreateErrandRequest,
	type PriceEstimateRequest,
} from "@/types";
import { toast } from "sonner";

interface LocationFormValue {
	id: string;
	address: string;
	latitude: number;
	longitude: number;
	contactName: string;
	contactPhone: string;
	instructions: string;
}

type WizardStep = 0 | 1 | 2 | 3 | 4 | 5;
type LogisticsCategory = "package" | "document" | "custom";
type PriorityOption = "standard" | "express" | "scheduled";

const STEPS = [
	{ label: "Service", icon: Package },
	{ label: "Locations", icon: MapPin },
	{ label: "Details", icon: FileText },
	{ label: "Priority", icon: Clock },
	{ label: "Payment", icon: CreditCard },
	{ label: "Review", icon: Check },
] as const;

const CATEGORIES = [
	{
		value: "package",
		label: "Package Delivery",
		icon: "📦",
		desc: "Send packages and parcels",
	},
	{
		value: "document",
		label: "Document Delivery",
		icon: "📄",
		desc: "Move secure or important documents",
	},
	{
		value: "custom",
		label: "Custom Errand",
		icon: "🛠️",
		desc: "Request a logistics task outside the marketplace",
	},
] as const;

const PACKAGE_SIZES = [
	{ value: "small", label: "Small", desc: "Fits in one hand", hint: "< 2kg" },
	{ value: "medium", label: "Medium", desc: "Fits in a bag", hint: "2-5kg" },
	{ value: "large", label: "Large", desc: "Needs both hands", hint: "5-15kg" },
	{ value: "extra_large", label: "Extra Large", desc: "Heavy or bulky", hint: "15kg+" },
] as const;

function createLocationValue(): LocationFormValue {
	return {
		id: "",
		address: "",
		latitude: 0,
		longitude: 0,
		contactName: "",
		contactPhone: "",
		instructions: "",
	};
}

function normalizeInitialCategory(category: string | undefined): LogisticsCategory | null {
	if (category === "package" || category === "document" || category === "custom") {
		return category;
	}

	return null;
}

function toCategory(category: LogisticsCategory, stopCount: number) {
	if (stopCount > 0) return ErrandCategory.MultiStopDelivery;
	if (category === "document") return ErrandCategory.DocumentDelivery;
	if (category === "custom") return ErrandCategory.CustomErrand;
	return ErrandCategory.PackageDelivery;
}

function toPriority(priority: PriorityOption) {
	if (priority === "express") return ErrandPriority.Express;
	if (priority === "scheduled") return ErrandPriority.Scheduled;
	return ErrandPriority.Standard;
}

function toPackageSize(size: string) {
	switch (size) {
		case "medium":
			return PackageSize.Medium;
		case "large":
			return PackageSize.Large;
		case "extra_large":
			return PackageSize.ExtraLarge;
		default:
			return PackageSize.Small;
	}
}

function paymentLabel(method: PaymentMethod) {
	switch (method) {
		case PaymentMethod.Wallet:
			return "Wallet";
		case PaymentMethod.BankTransfer:
			return "Bank Transfer";
		case PaymentMethod.Card:
			return "Card";
		case PaymentMethod.Cash:
			return "Cash on delivery";
		default:
			return "Payment";
	}
}

function formatError(error: unknown, fallback: string) {
	return error instanceof Error && error.message ? error.message : fallback;
}

export default function ErrandRequestWizard({
	initialCategory,
}: {
	initialCategory?: string;
}) {
	const router = useRouter();
	const resolvedInitialCategory = normalizeInitialCategory(initialCategory);
	const stopIdRef = useRef(0);

	const [step, setStep] = useState<WizardStep>(resolvedInitialCategory ? 1 : 0);
	const [category, setCategory] = useState<LogisticsCategory>(resolvedInitialCategory ?? "package");
	const [pickup, setPickup] = useState<LocationFormValue>(createLocationValue());
	const [dropoff, setDropoff] = useState<LocationFormValue>(createLocationValue());
	const [stops, setStops] = useState<LocationFormValue[]>([]);
	const [description, setDescription] = useState("");
	const [packageSize, setPackageSize] = useState("small");
	const [packageWeight, setPackageWeight] = useState("");
	const [isFragile, setIsFragile] = useState(false);
	const [specialInstructions, setSpecialInstructions] = useState("");
	const [priority, setPriority] = useState<PriorityOption>("standard");
	const [scheduledDate, setScheduledDate] = useState("");
	const [scheduledTime, setScheduledTime] = useState("");
	const [paymentMethod, setPaymentMethod] = useState(PaymentMethod.Wallet);
	const [isPreparingReview, setIsPreparingReview] = useState(false);

	const { data: addressesResponse } = useAddresses();
	const { data: walletResponse } = useWallet();
	const geocodeAddress = useGeocodeAddress();
	const createErrand = useCreateErrand();
	const processPayment = useProcessErrandPayment();

	const addresses = addressesResponse?.data ?? [];
	const wallet = walletResponse?.data ?? null;
	const walletBalance = wallet?.balance ?? 0;

	const estimateRequest = useMemo<PriceEstimateRequest>(
		() => ({
			category: toCategory(category, stops.length),
			pickupLatitude: pickup.latitude,
			pickupLongitude: pickup.longitude,
			dropoffLatitude: dropoff.latitude,
			dropoffLongitude: dropoff.longitude,
			packageSize: toPackageSize(packageSize),
			packageWeight: packageWeight ? Number(packageWeight) : null,
			priority: toPriority(priority),
			stops: stops.length
				? stops.map((stop, index) => ({
					stopOrder: index + 1,
					address: stop.address,
					latitude: stop.latitude,
					longitude: stop.longitude,
					contactName: stop.contactName || null,
					contactPhone: stop.contactPhone || null,
					instructions: stop.instructions || null,
				}))
				: null,
		}),
		[category, pickup, dropoff, packageSize, packageWeight, priority, stops],
	);

	const estimate = useDeliveryEstimate(estimateRequest, step === 5 && !isPreparingReview);
	const estimateData = estimate.data?.data ?? null;
	const walletBlocked =
		paymentMethod === PaymentMethod.Wallet && (!wallet?.isActive || (estimateData ? walletBalance < estimateData.estimatedPrice : false));

	function updateLocation(
		setter: Dispatch<SetStateAction<LocationFormValue>>,
		field: keyof LocationFormValue,
		value: string | number,
	) {
		setter((current) => ({
			...current,
			[field]: value,
			...(field === "address" ? { latitude: 0, longitude: 0 } : {}),
		}));
	}

	function updateStop(id: string, field: keyof LocationFormValue, value: string | number) {
		setStops((current) =>
			current.map((stop) =>
				stop.id === id
					? {
						...stop,
						[field]: value,
						...(field === "address" ? { latitude: 0, longitude: 0 } : {}),
					}
					: stop,
			),
		);
	}

	function applySavedAddress(
		setter: Dispatch<SetStateAction<LocationFormValue>>,
		address: { address: string; latitude: number; longitude: number },
	) {
		setter((current) => ({
			...current,
			address: address.address,
			latitude: address.latitude,
			longitude: address.longitude,
		}));
	}

	function addStop() {
		stopIdRef.current += 1;
		setStops((current) => [
			...current,
			{
				...createLocationValue(),
				id: `stop-${stopIdRef.current}`,
			},
		]);
	}

	function removeStop(id: string) {
		setStops((current) => current.filter((stop) => stop.id !== id));
	}

	async function resolveLocation(point: LocationFormValue, label: string): Promise<LocationFormValue> {
		if (!point.address.trim()) {
			throw new Error(`${label} address is required.`);
		}

		if (point.latitude !== 0 && point.longitude !== 0) {
			return point;
		}

		const response = await geocodeAddress.mutateAsync(point.address.trim());
		const result = response.data;
		if (!result) {
			throw new Error(`We could not geocode the ${label.toLowerCase()} address.`);
		}

		return {
			...point,
			address: result.address,
			latitude: result.latitude,
			longitude: result.longitude,
		};
	}

	async function prepareReview() {
		setIsPreparingReview(true);
		try {
			const resolvedPickup = await resolveLocation(pickup, "Pickup");
			const resolvedStops: LocationFormValue[] = [];

			for (let index = 0; index < stops.length; index += 1) {
				resolvedStops.push(await resolveLocation(stops[index], `Stop ${index + 1}`));
			}

			const resolvedDropoff = await resolveLocation(dropoff, "Dropoff");

			setPickup(resolvedPickup);
			setStops(resolvedStops);
			setDropoff(resolvedDropoff);
			setStep(5);
		} catch (error) {
			toast.error(formatError(error, "Could not prepare your errand for review."));
		} finally {
			setIsPreparingReview(false);
		}
	}

	function next() {
		if (step === 1) {
			if (!pickup.address.trim() || !dropoff.address.trim()) {
				toast.error("Pickup and dropoff addresses are required.");
				return;
			}
		}

		if (step === 2 && !description.trim()) {
			toast.error("Describe what should be delivered.");
			return;
		}

		if (step === 3 && priority === "scheduled" && (!scheduledDate || !scheduledTime)) {
			toast.error("Choose a date and time for the scheduled errand.");
			return;
		}

		if (step === 4) {
			void prepareReview();
			return;
		}

		setStep((current) => Math.min(current + 1, 5) as WizardStep);
	}

	function back() {
		if (step === 0) {
			router.back();
			return;
		}

		setStep((current) => Math.max(current - 1, 0) as WizardStep);
	}

	async function handleSubmit() {
		if (!estimateData) {
			toast.error("We are still calculating your delivery estimate.");
			return;
		}

		if (walletBlocked) {
			toast.error(
				!wallet?.isActive
					? "Create and fund your wallet before paying with wallet."
					: "Your wallet balance is not enough for this errand.",
			);
			return;
		}

		const payload: CreateErrandRequest = {
			category: toCategory(category, stops.length),
			description: description.trim(),
			specialInstructions: specialInstructions.trim() || null,
			priority: toPriority(priority),
			scheduledAt:
				priority === "scheduled"
					? new Date(`${scheduledDate}T${scheduledTime}:00`).toISOString()
					: null,
			pickupAddress: pickup.address.trim(),
			pickupLatitude: pickup.latitude,
			pickupLongitude: pickup.longitude,
			dropoffAddress: dropoff.address.trim(),
			dropoffLatitude: dropoff.latitude,
			dropoffLongitude: dropoff.longitude,
			packageSize: toPackageSize(packageSize),
			packageWeight: packageWeight ? Number(packageWeight) : null,
			isFragile,
			requiresPhotoProof: false,
			recipientName: dropoff.contactName.trim() || null,
			recipientPhone: dropoff.contactPhone.trim() || null,
			paymentMethod,
			stops: stops.length
				? stops.map((stop, index) => ({
					stopOrder: index + 1,
					address: stop.address.trim(),
					latitude: stop.latitude,
					longitude: stop.longitude,
					contactName: stop.contactName.trim() || null,
					contactPhone: stop.contactPhone.trim() || null,
					instructions: stop.instructions.trim() || null,
				}))
				: null,
		};

		try {
			const errandResponse = await createErrand.mutateAsync(payload);
			const errand = errandResponse.data;
			if (!errand) {
				throw new Error("Errand was created without a response payload.");
			}

			try {
				const paymentResponse = await processPayment.mutateAsync({
					errandId: errand.id,
					paymentMethod,
					paymentReference: null,
				});

				const checkoutUrl = paymentResponse.data?.checkoutUrl;
				if (checkoutUrl) {
					window.location.href = checkoutUrl;
					return;
				}
			} catch (paymentError) {
				toast.error(
					formatError(paymentError, "Your errand was created, but payment could not be started."),
				);
				router.push(`/dashboard/errands/${errand.id}`);
				return;
			}

			toast.success("Errand created successfully.");
			router.push(`/dashboard/errands/${errand.id}`);
		} catch (error) {
			toast.error(formatError(error, "Failed to create your errand."));
		}
	}

	const busy =
		isPreparingReview ||
		createErrand.isPending ||
		processPayment.isPending ||
		geocodeAddress.isPending;

	return (
		<div className="mx-auto max-w-3xl space-y-6">
			<div className="flex items-center gap-3">
				<Button variant="ghost" size="icon" onClick={back}>
					<ArrowLeft className="h-5 w-5" />
				</Button>
				<div>
					<h1 className="text-xl font-bold">Request an Errand</h1>
					<p className="text-xs text-muted-foreground">
						Step {step + 1} of {STEPS.length}
					</p>
				</div>
			</div>

			<div className="flex gap-1">
				{STEPS.map((_, index) => (
					<div
						key={index}
						className={cn(
							"h-1.5 flex-1 rounded-full transition-colors",
							index <= step ? "bg-primary" : "bg-muted",
						)}
					/>
				))}
			</div>

			{step === 0 && (
				<Card>
					<CardHeader>
						<CardTitle>What do you need delivered?</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						{CATEGORIES.map((option) => (
							<button
								key={option.value}
								onClick={() => {
									setCategory(option.value);
									setStep(1);
								}}
								className={cn(
									"flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-all hover:shadow-md",
									category === option.value && "border-primary bg-primary/5",
								)}>
								<span className="text-3xl">{option.icon}</span>
								<div>
									<p className="font-semibold">{option.label}</p>
									<p className="text-xs text-muted-foreground">{option.desc}</p>
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
						<CardTitle>Pickup, Stops, and Dropoff</CardTitle>
					</CardHeader>
					<CardContent className="space-y-6">
						<div className="space-y-2">
							<Label>Pickup Address</Label>
							<Input
								value={pickup.address}
								onChange={(event) => updateLocation(setPickup, "address", event.target.value)}
								placeholder="Where should we pick up?"
							/>
							{addresses.length > 0 && (
								<div className="flex flex-wrap gap-2">
									{addresses.slice(0, 3).map((address) => (
										<Button
											key={address.id}
											variant="outline"
											size="sm"
											className="text-xs"
											onClick={() => applySavedAddress(setPickup, address)}>
											<MapPin className="mr-1 h-3 w-3" />
											{address.label}
										</Button>
									))}
								</div>
							)}
						</div>

						<div className="space-y-4 rounded-xl border border-dashed p-4">
							<div className="flex items-center justify-between gap-3">
								<div>
									<p className="text-sm font-semibold">Intermediate Stops</p>
									<p className="text-xs text-muted-foreground">
										Add any stopovers before the final dropoff.
									</p>
								</div>
								<Button type="button" variant="outline" size="sm" className="gap-2" onClick={addStop}>
									<Plus className="h-4 w-4" />
									Add Stop
								</Button>
							</div>

							{stops.length === 0 ? (
								<p className="text-sm text-muted-foreground">No intermediate stops added yet.</p>
							) : (
								<div className="space-y-4">
									{stops.map((stop, index) => (
										<div key={stop.id} className="space-y-3 rounded-lg border bg-background p-4">
											<div className="flex items-center justify-between gap-3">
												<p className="text-sm font-semibold">Stop {index + 1}</p>
												<Button type="button" variant="ghost" size="icon" onClick={() => removeStop(stop.id)}>
													<Trash2 className="h-4 w-4" />
												</Button>
											</div>
											<Input
												value={stop.address}
												onChange={(event) => updateStop(stop.id, "address", event.target.value)}
												placeholder="Stop address"
											/>
											<div className="grid gap-3 sm:grid-cols-2">
												<Input
													value={stop.contactName}
													onChange={(event) => updateStop(stop.id, "contactName", event.target.value)}
													placeholder="Contact name (optional)"
												/>
												<Input
													value={stop.contactPhone}
													onChange={(event) => updateStop(stop.id, "contactPhone", event.target.value)}
													placeholder="Contact phone (optional)"
												/>
											</div>
											<Textarea
												value={stop.instructions}
												onChange={(event) => updateStop(stop.id, "instructions", event.target.value)}
												placeholder="Stop instructions (optional)"
												rows={2}
											/>
										</div>
									))}
								</div>
							)}
						</div>

						<div className="space-y-2">
							<Label>Final Dropoff Address</Label>
							<Input
								value={dropoff.address}
								onChange={(event) => updateLocation(setDropoff, "address", event.target.value)}
								placeholder="Where should we deliver?"
							/>
							{addresses.length > 0 && (
								<div className="flex flex-wrap gap-2">
									{addresses.slice(0, 3).map((address) => (
										<Button
											key={address.id}
											variant="outline"
											size="sm"
											className="text-xs"
											onClick={() => applySavedAddress(setDropoff, address)}>
											<MapPin className="mr-1 h-3 w-3" />
											{address.label}
										</Button>
									))}
								</div>
							)}
						</div>

						<div className="grid gap-4 sm:grid-cols-2">
							<div className="space-y-2">
								<Label>Recipient Name</Label>
								<Input
									value={dropoff.contactName}
									onChange={(event) => updateLocation(setDropoff, "contactName", event.target.value)}
									placeholder="Recipient's name"
								/>
							</div>
							<div className="space-y-2">
								<Label>Recipient Phone</Label>
								<Input
									value={dropoff.contactPhone}
									onChange={(event) => updateLocation(setDropoff, "contactPhone", event.target.value)}
									placeholder="080..."
								/>
							</div>
						</div>

						<div className="space-y-2">
							<Label>Dropoff Instructions</Label>
							<Textarea
								value={dropoff.instructions}
								onChange={(event) => updateLocation(setDropoff, "instructions", event.target.value)}
								placeholder="Anything the rider should know at delivery?"
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

			{step === 2 && (
				<Card>
					<CardHeader>
						<CardTitle>Errand Details</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label>Description</Label>
							<Textarea
								value={description}
								onChange={(event) => setDescription(event.target.value)}
								placeholder="Describe the package, document, or task."
								rows={3}
							/>
						</div>

						<div className="space-y-2">
							<Label>Package Size</Label>
							<div className="grid grid-cols-2 gap-3">
								{PACKAGE_SIZES.map((size) => (
									<button
										key={size.value}
										type="button"
										onClick={() => setPackageSize(size.value)}
										className={cn(
											"rounded-xl border p-3 text-left transition-all",
											packageSize === size.value ? "border-primary bg-primary/5" : "hover:bg-accent",
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

						<div className="grid gap-4 sm:grid-cols-2">
							<div className="space-y-2">
								<Label>Weight (kg)</Label>
								<Input
									value={packageWeight}
									onChange={(event) => setPackageWeight(event.target.value)}
									placeholder="Optional"
									type="number"
									min="0"
									step="0.1"
								/>
							</div>
							<div className="space-y-2">
								<Label>Special Instructions</Label>
								<Textarea
									value={specialInstructions}
									onChange={(event) => setSpecialInstructions(event.target.value)}
									placeholder="Handling instructions, access notes, or special context"
									rows={2}
								/>
							</div>
						</div>

						<div className="flex items-center gap-3">
							<Checkbox id="fragile" checked={isFragile} onCheckedChange={(value) => setIsFragile(Boolean(value))} />
							<Label htmlFor="fragile" className="flex cursor-pointer items-center gap-2">
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
						<CardTitle>Priority and Schedule</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<RadioGroup value={priority} onValueChange={(value) => setPriority(value as PriorityOption)}>
							{[
								{ value: "standard", label: "Standard", desc: "Regular delivery speed", icon: Truck, price: null },
								{ value: "express", label: "Express", desc: "Priority pickup and delivery", icon: Zap, price: "Faster" },
								{ value: "scheduled", label: "Scheduled", desc: "Choose a future pickup window", icon: Calendar, price: "Planned" },
							].map((option) => (
								<label
									key={option.value}
									className={cn(
										"flex cursor-pointer items-center gap-4 rounded-xl border p-4 transition-all",
										priority === option.value ? "border-primary bg-primary/5" : "hover:bg-accent",
									)}>
									<RadioGroupItem value={option.value} />
									<option.icon className="h-5 w-5 text-muted-foreground" />
									<div className="flex-1">
										<p className="text-sm font-semibold">{option.label}</p>
										<p className="text-xs text-muted-foreground">{option.desc}</p>
									</div>
									{option.price && <Badge variant="secondary">{option.price}</Badge>}
								</label>
							))}
						</RadioGroup>

						{priority === "scheduled" && (
							<div className="grid gap-4 sm:grid-cols-2">
								<div className="space-y-2">
									<Label>Pickup Date</Label>
									<Input type="date" value={scheduledDate} onChange={(event) => setScheduledDate(event.target.value)} />
								</div>
								<div className="space-y-2">
									<Label>Pickup Time</Label>
									<Input type="time" value={scheduledTime} onChange={(event) => setScheduledTime(event.target.value)} />
								</div>
							</div>
						)}

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
						<RadioGroup value={String(paymentMethod)} onValueChange={(value) => setPaymentMethod(Number(value) as PaymentMethod)}>
							{[
								{ value: PaymentMethod.Wallet, label: "Wallet", desc: `Balance: ${formatCurrency(walletBalance)}`, icon: Wallet },
								{ value: PaymentMethod.BankTransfer, label: "Bank Transfer", desc: "Secure checkout via Monnify", icon: Landmark },
								{ value: PaymentMethod.Card, label: "Card", desc: "Pay online with your card", icon: CreditCard },
								{ value: PaymentMethod.Cash, label: "Cash on Delivery", desc: "Pay the rider when delivered", icon: Banknote },
							].map((option) => (
								<label
									key={option.value}
									className={cn(
										"flex cursor-pointer items-center gap-4 rounded-xl border p-4 transition-all",
										paymentMethod === option.value ? "border-primary bg-primary/5" : "hover:bg-accent",
									)}>
									<RadioGroupItem value={String(option.value)} />
									<option.icon className="h-5 w-5 text-muted-foreground" />
									<div>
										<p className="text-sm font-semibold">{option.label}</p>
										<p className="text-xs text-muted-foreground">{option.desc}</p>
									</div>
								</label>
							))}
						</RadioGroup>

						{paymentMethod === PaymentMethod.Wallet && !wallet?.isActive && (
							<div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-900">
								Create and fund your wallet before using wallet payment.
							</div>
						)}

						<div className="flex justify-end">
							<Button onClick={next} disabled={busy}>
								Review Errand
								<ArrowRight className="ml-2 h-4 w-4" />
							</Button>
						</div>
					</CardContent>
				</Card>
			)}

			{step === 5 && (
				<Card>
					<CardHeader>
						<CardTitle>Review and Confirm</CardTitle>
					</CardHeader>
					<CardContent className="space-y-5">
						{(isPreparingReview || estimate.isLoading) && (
							<div className="flex items-center gap-3 rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
								<Loader2 className="h-4 w-4 animate-spin" />
								Calculating route and fare...
							</div>
						)}

						{estimate.isError && (
							<div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
								{formatError(estimate.error, "We could not calculate a delivery estimate.")}
							</div>
						)}

						{estimateData && (
							<div className="grid gap-3 sm:grid-cols-3">
								<div className="rounded-xl border p-4">
									<p className="text-xs text-muted-foreground">Estimated Fare</p>
									<p className="mt-1 text-lg font-bold">{formatCurrency(estimateData.estimatedPrice)}</p>
								</div>
								<div className="rounded-xl border p-4">
									<p className="text-xs text-muted-foreground">Distance</p>
									<p className="mt-1 text-lg font-bold">{estimateData.estimatedDistanceKm.toFixed(1)} km</p>
								</div>
								<div className="rounded-xl border p-4">
									<p className="text-xs text-muted-foreground">ETA</p>
									<p className="mt-1 text-lg font-bold">{estimateData.estimatedDurationMinutes} min</p>
								</div>
							</div>
						)}

						<div className="space-y-3 rounded-lg bg-muted/50 p-4">
							<div className="flex items-center justify-between text-sm">
								<span className="text-muted-foreground">Service</span>
								<span className="font-medium">
									{stops.length > 0 ? "Multi-stop logistics" : CATEGORIES.find((item) => item.value === category)?.label}
								</span>
							</div>
							<Separator />
							<div className="space-y-2 text-sm">
								<div className="flex gap-2">
									<MapPin className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
									<span>{pickup.address}</span>
								</div>
								{stops.map((stop, index) => (
									<div key={stop.id} className="flex gap-2">
										<Route className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
										<span>Stop {index + 1}: {stop.address}</span>
									</div>
								))}
								<div className="flex gap-2">
									<MapPin className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
									<span>{dropoff.address}</span>
								</div>
							</div>
							<Separator />
							<div className="flex items-center justify-between text-sm">
								<span className="text-muted-foreground">Priority</span>
								<span className="font-medium capitalize">{priority}</span>
							</div>
							{priority === "scheduled" && scheduledDate && scheduledTime && (
								<div className="flex items-center justify-between text-sm">
									<span className="text-muted-foreground">Scheduled For</span>
									<span className="font-medium">{scheduledDate} {scheduledTime}</span>
								</div>
							)}
							<div className="flex items-center justify-between text-sm">
								<span className="text-muted-foreground">Package</span>
								<span className="font-medium capitalize">
									{packageSize.replace("_", " ")}
									{isFragile ? " • fragile" : ""}
								</span>
							</div>
							<div className="flex items-center justify-between text-sm">
								<span className="text-muted-foreground">Payment</span>
								<span className="font-medium">{paymentLabel(paymentMethod)}</span>
							</div>
						</div>

						{walletBlocked && (
							<div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-900">
								{!wallet?.isActive
									? "Wallet payment is selected, but your wallet is not active yet."
									: "Wallet payment is selected, but your balance is below the estimated fare."}
							</div>
						)}

						<Button className="w-full gap-2" size="lg" onClick={handleSubmit} disabled={busy || !estimateData || walletBlocked || estimate.isError}>
							{createErrand.isPending || processPayment.isPending ? (
								<>
									<Loader2 className="h-4 w-4 animate-spin" />
									Submitting...
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