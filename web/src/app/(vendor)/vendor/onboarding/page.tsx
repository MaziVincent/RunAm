"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
	Store,
	MapPin,
	Clock,
	Banknote,
	CheckCircle2,
	ArrowLeft,
	ArrowRight,
	Loader2,
	Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRegisterVendor } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const STEPS = [
	{ label: "Business Info", icon: Store },
	{ label: "Location", icon: MapPin },
	{ label: "Operations", icon: Clock },
	{ label: "Payment", icon: Banknote },
	{ label: "Review", icon: CheckCircle2 },
];

interface FormData {
	businessName: string;
	description: string;
	address: string;
	city: string;
	state: string;
	deliveryRadius: number;
	openingTime: string;
	closingTime: string;
	minimumOrder: number;
	deliveryFee: number;
	prepTime: string;
	bankName: string;
	accountNumber: string;
	accountName: string;
}

const initialForm: FormData = {
	businessName: "",
	description: "",
	address: "",
	city: "",
	state: "",
	deliveryRadius: 5,
	openingTime: "08:00",
	closingTime: "22:00",
	minimumOrder: 500,
	deliveryFee: 300,
	prepTime: "15-30 min",
	bankName: "",
	accountNumber: "",
	accountName: "",
};

export default function VendorOnboardingPage() {
	const [step, setStep] = useState(0);
	const [form, setForm] = useState<FormData>(initialForm);
	const [agreed, setAgreed] = useState(false);
	const router = useRouter();
	const registerVendor = useRegisterVendor();

	function update(key: keyof FormData, value: string | number) {
		setForm((prev) => ({ ...prev, [key]: value }));
	}

	function nextStep() {
		if (step === 0 && !form.businessName) {
			toast.error("Business name required");
			return;
		}
		if (step === 1 && !form.address) {
			toast.error("Address required");
			return;
		}
		setStep((s) => Math.min(s + 1, STEPS.length - 1));
	}

	async function handleSubmit() {
		if (!agreed) {
			toast.error("Please agree to the terms");
			return;
		}
		try {
			await registerVendor.mutateAsync({
				businessName: form.businessName,
				description: form.description,
				phoneNumber: "",
				address: [form.address, form.city, form.state]
					.filter(Boolean)
					.join(", "),
				latitude: 0,
				longitude: 0,
				serviceCategoryIds: [],
				minimumOrderAmount: form.minimumOrder,
				deliveryFee: form.deliveryFee,
				estimatedPrepTimeMinutes: parseInt(form.prepTime) || 30,
				operatingHours: `${form.openingTime}-${form.closingTime}`,
			});
			toast.success("Application submitted!");
			router.push("/vendor");
		} catch {
			toast.error("Failed to submit application");
		}
	}

	return (
		<div className="mx-auto max-w-2xl space-y-6">
			<div>
				<h1 className="text-2xl font-bold">Become a Vendor</h1>
				<p className="text-sm text-muted-foreground">
					Set up your store on RunAm
				</p>
			</div>

			{/* Progress */}
			<div className="flex items-center gap-1">
				{STEPS.map((s, i) => (
					<div key={i} className="flex flex-1 flex-col items-center gap-1.5">
						<div
							className={cn(
								"flex h-9 w-9 items-center justify-center rounded-full border-2 transition-colors",
								i < step
									? "border-primary bg-primary text-primary-foreground"
									: i === step
										? "border-primary text-primary"
										: "border-muted text-muted-foreground",
							)}>
							{i < step ? (
								<CheckCircle2 className="h-5 w-5" />
							) : (
								<s.icon className="h-4 w-4" />
							)}
						</div>
						<span className="hidden text-[10px] font-medium sm:block">
							{s.label}
						</span>
						{i < STEPS.length - 1 && (
							<div
								className={cn(
									"absolute h-0.5 w-full",
									i < step ? "bg-primary" : "bg-muted",
								)}
							/>
						)}
					</div>
				))}
			</div>

			{/* Step Content */}
			<Card>
				<CardContent className="p-6">
					{step === 0 && (
						<div className="space-y-4">
							<h2 className="text-lg font-semibold">Business Information</h2>
							<div className="space-y-2">
								<Label>Business Name *</Label>
								<Input
									value={form.businessName}
									onChange={(e) => update("businessName", e.target.value)}
									placeholder="e.g. Chicken Republic"
								/>
							</div>
							<div className="space-y-2">
								<Label>Description</Label>
								<Textarea
									value={form.description}
									onChange={(e) => update("description", e.target.value)}
									placeholder="Tell customers about your business..."
									rows={4}
								/>
							</div>
							<div className="space-y-2">
								<Label>Logo</Label>
								<div className="flex h-24 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed transition-colors hover:border-primary">
									<div className="flex flex-col items-center text-muted-foreground">
										<Upload className="h-6 w-6" />
										<span className="mt-1 text-xs">Upload logo</span>
									</div>
								</div>
							</div>
						</div>
					)}

					{step === 1 && (
						<div className="space-y-4">
							<h2 className="text-lg font-semibold">Location</h2>
							<div className="space-y-2">
								<Label>Business Address *</Label>
								<Input
									value={form.address}
									onChange={(e) => update("address", e.target.value)}
									placeholder="Street address"
								/>
							</div>
							<div className="grid grid-cols-2 gap-3">
								<div className="space-y-2">
									<Label>City</Label>
									<Input
										value={form.city}
										onChange={(e) => update("city", e.target.value)}
										placeholder="City"
									/>
								</div>
								<div className="space-y-2">
									<Label>State</Label>
									<Input
										value={form.state}
										onChange={(e) => update("state", e.target.value)}
										placeholder="State"
									/>
								</div>
							</div>
							<div className="space-y-2">
								<Label>Delivery Radius: {form.deliveryRadius} km</Label>
								<input
									type="range"
									min={1}
									max={20}
									value={form.deliveryRadius}
									onChange={(e) =>
										update("deliveryRadius", parseInt(e.target.value))
									}
									className="w-full accent-primary"
								/>
								<div className="flex justify-between text-xs text-muted-foreground">
									<span>1 km</span>
									<span>20 km</span>
								</div>
							</div>
						</div>
					)}

					{step === 2 && (
						<div className="space-y-4">
							<h2 className="text-lg font-semibold">Operations</h2>
							<div className="grid grid-cols-2 gap-3">
								<div className="space-y-2">
									<Label>Opening Time</Label>
									<Input
										type="time"
										value={form.openingTime}
										onChange={(e) => update("openingTime", e.target.value)}
									/>
								</div>
								<div className="space-y-2">
									<Label>Closing Time</Label>
									<Input
										type="time"
										value={form.closingTime}
										onChange={(e) => update("closingTime", e.target.value)}
									/>
								</div>
							</div>
							<div className="grid grid-cols-2 gap-3">
								<div className="space-y-2">
									<Label>Minimum Order (₦)</Label>
									<Input
										type="number"
										value={form.minimumOrder}
										onChange={(e) =>
											update("minimumOrder", parseInt(e.target.value) || 0)
										}
									/>
								</div>
								<div className="space-y-2">
									<Label>Delivery Fee (₦)</Label>
									<Input
										type="number"
										value={form.deliveryFee}
										onChange={(e) =>
											update("deliveryFee", parseInt(e.target.value) || 0)
										}
									/>
								</div>
							</div>
							<div className="space-y-2">
								<Label>Prep Time</Label>
								<Input
									value={form.prepTime}
									onChange={(e) => update("prepTime", e.target.value)}
									placeholder="e.g. 15-30 min"
								/>
							</div>
						</div>
					)}

					{step === 3 && (
						<div className="space-y-4">
							<h2 className="text-lg font-semibold">Payment Details</h2>
							<p className="text-sm text-muted-foreground">
								Your earnings will be deposited to this bank account.
							</p>
							<div className="space-y-2">
								<Label>Bank Name</Label>
								<Input
									value={form.bankName}
									onChange={(e) => update("bankName", e.target.value)}
									placeholder="e.g. GTBank"
								/>
							</div>
							<div className="space-y-2">
								<Label>Account Number</Label>
								<Input
									value={form.accountNumber}
									onChange={(e) => update("accountNumber", e.target.value)}
									placeholder="10-digit account number"
									maxLength={10}
								/>
							</div>
							<div className="space-y-2">
								<Label>Account Name</Label>
								<Input
									value={form.accountName}
									onChange={(e) => update("accountName", e.target.value)}
									placeholder="Account holder name"
								/>
							</div>
						</div>
					)}

					{step === 4 && (
						<div className="space-y-4">
							<h2 className="text-lg font-semibold">Review & Submit</h2>
							<div className="space-y-3 rounded-lg bg-muted/50 p-4 text-sm">
								<div className="flex justify-between">
									<span className="text-muted-foreground">Business Name</span>
									<span className="font-medium">{form.businessName}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground">Address</span>
									<span className="font-medium text-right">
										{form.address}, {form.city}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground">Hours</span>
									<span className="font-medium">
										{form.openingTime} – {form.closingTime}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground">Minimum Order</span>
									<span className="font-medium">
										₦{form.minimumOrder.toLocaleString()}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground">Bank</span>
									<span className="font-medium">
										{form.bankName} • ••••{form.accountNumber.slice(-4)}
									</span>
								</div>
							</div>
							<label className="flex items-start gap-2 text-sm">
								<input
									type="checkbox"
									checked={agreed}
									onChange={(e) => setAgreed(e.target.checked)}
									className="mt-0.5 h-4 w-4 rounded border-border"
								/>
								<span>
									I agree to the{" "}
									<a href="#" className="text-primary underline">
										Vendor Terms of Service
									</a>{" "}
									and{" "}
									<a href="#" className="text-primary underline">
										Commission Structure
									</a>
								</span>
							</label>
						</div>
					)}

					{/* Navigation */}
					<div className="mt-6 flex justify-between">
						<Button
							variant="outline"
							onClick={() => setStep((s) => Math.max(s - 1, 0))}
							disabled={step === 0}
							className="gap-2">
							<ArrowLeft className="h-4 w-4" />
							Back
						</Button>
						{step < STEPS.length - 1 ? (
							<Button onClick={nextStep} className="gap-2">
								Next
								<ArrowRight className="h-4 w-4" />
							</Button>
						) : (
							<Button
								onClick={handleSubmit}
								disabled={registerVendor.isPending || !agreed}
								className="gap-2">
								{registerVendor.isPending && (
									<Loader2 className="h-4 w-4 animate-spin" />
								)}
								Submit Application
							</Button>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
