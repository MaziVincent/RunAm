"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
	Bike,
	Car,
	PersonStanding,
	CheckCircle2,
	ArrowRight,
	Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useCreateRiderProfile } from "@/lib/hooks";
import { VehicleType } from "@/types";
import { toast } from "sonner";

const VEHICLE_OPTIONS = [
	{
		type: VehicleType.OnFoot,
		label: "On Foot",
		description: "Walk or run deliveries",
		icon: PersonStanding,
	},
	{
		type: VehicleType.Bicycle,
		label: "Bicycle",
		description: "Eco-friendly delivery",
		icon: Bike,
	},
	{
		type: VehicleType.Motorcycle,
		label: "Motorcycle",
		description: "Fast two-wheel delivery",
		icon: Bike,
	},
	{
		type: VehicleType.Car,
		label: "Car",
		description: "For larger packages",
		icon: Car,
	},
];

export default function RiderOnboardingPage() {
	const [step, setStep] = useState(0);
	const [vehicleType, setVehicleType] = useState<VehicleType | null>(null);
	const [licensePlate, setLicensePlate] = useState("");
	const [agreed, setAgreed] = useState(false);
	const router = useRouter();
	const createProfile = useCreateRiderProfile();

	const needsPlate =
		vehicleType === VehicleType.Motorcycle || vehicleType === VehicleType.Car;

	async function handleSubmit() {
		if (vehicleType === null) {
			toast.error("Please select a vehicle type");
			return;
		}
		if (!agreed) {
			toast.error("Please agree to the terms");
			return;
		}
		try {
			await createProfile.mutateAsync({
				vehicleType,
				licensePlate: needsPlate ? licensePlate : undefined,
			});
			toast.success("Rider profile created! Pending approval.");
			router.push("/rider");
		} catch {
			toast.error("Failed to create rider profile");
		}
	}

	return (
		<div className="mx-auto max-w-xl space-y-6">
			<div>
				<h1 className="text-2xl font-bold">Become a Rider</h1>
				<p className="text-sm text-muted-foreground">
					Join RunAm's delivery network and start earning
				</p>
			</div>

			{/* Step indicator */}
			<div className="flex items-center gap-2">
				{["Vehicle", "Details", "Review"].map((label, i) => (
					<div key={label} className="flex flex-1 flex-col items-center gap-1">
						<div
							className={cn(
								"flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-medium transition-colors",
								i < step
									? "border-primary bg-primary text-primary-foreground"
									: i === step
										? "border-primary text-primary"
										: "border-muted text-muted-foreground",
							)}>
							{i < step ? (
								<CheckCircle2 className="h-4 w-4" />
							) : (
								i + 1
							)}
						</div>
						<span className="text-[10px] font-medium">{label}</span>
					</div>
				))}
			</div>

			<Card>
				<CardContent className="p-6">
					{/* Step 0: Vehicle Type */}
					{step === 0 && (
						<div className="space-y-4">
							<h2 className="text-lg font-semibold">Choose Your Vehicle</h2>
							<p className="text-sm text-muted-foreground">
								Select the vehicle type you&apos;ll use for deliveries
							</p>
							<div className="grid grid-cols-2 gap-3">
								{VEHICLE_OPTIONS.map((opt) => (
									<button
										key={opt.type}
										onClick={() => setVehicleType(opt.type)}
										className={cn(
											"flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all hover:border-primary/50",
											vehicleType === opt.type
												? "border-primary bg-primary/5"
												: "border-border",
										)}>
										<opt.icon className="h-8 w-8" />
										<span className="text-sm font-medium">{opt.label}</span>
										<span className="text-xs text-muted-foreground text-center">
											{opt.description}
										</span>
									</button>
								))}
							</div>
						</div>
					)}

					{/* Step 1: Details */}
					{step === 1 && (
						<div className="space-y-4">
							<h2 className="text-lg font-semibold">Vehicle Details</h2>
							{needsPlate ? (
								<div className="space-y-2">
									<Label>License Plate Number</Label>
									<Input
										value={licensePlate}
										onChange={(e) =>
											setLicensePlate(e.target.value.toUpperCase())
										}
										placeholder="e.g. ABC-123-XY"
									/>
									<p className="text-xs text-muted-foreground">
										Required for motorized vehicles
									</p>
								</div>
							) : (
								<div className="rounded-lg bg-muted/50 p-4 text-center">
									<Bike className="mx-auto h-8 w-8 text-muted-foreground" />
									<p className="mt-2 text-sm text-muted-foreground">
										No license plate required for{" "}
										{vehicleType === VehicleType.OnFoot
											? "on-foot"
											: "bicycle"}{" "}
										deliveries
									</p>
								</div>
							)}
							<div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-800 dark:bg-amber-950/30">
								<p className="font-medium text-amber-800 dark:text-amber-200">
									Verification Required
								</p>
								<p className="mt-1 text-amber-700 dark:text-amber-300">
									Your application will be reviewed by our team. Approval
									typically takes 1-2 business days.
								</p>
							</div>
						</div>
					)}

					{/* Step 2: Review */}
					{step === 2 && (
						<div className="space-y-4">
							<h2 className="text-lg font-semibold">Review & Submit</h2>
							<div className="space-y-3 rounded-lg bg-muted/50 p-4 text-sm">
								<div className="flex justify-between">
									<span className="text-muted-foreground">Vehicle Type</span>
									<span className="font-medium">
										{
											VEHICLE_OPTIONS.find((v) => v.type === vehicleType)
												?.label
										}
									</span>
								</div>
								{needsPlate && licensePlate && (
									<div className="flex justify-between">
										<span className="text-muted-foreground">
											License Plate
										</span>
										<span className="font-medium">{licensePlate}</span>
									</div>
								)}
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
										Rider Terms of Service
									</a>{" "}
									and confirm I have the right to operate my selected vehicle
									type
								</span>
							</label>
						</div>
					)}

					{/* Navigation */}
					<div className="mt-6 flex justify-between">
						<Button
							variant="outline"
							onClick={() => setStep((s) => Math.max(s - 1, 0))}
							disabled={step === 0}>
							Back
						</Button>
						{step < 2 ? (
							<Button
								onClick={() => {
									if (step === 0 && vehicleType === null) {
										toast.error("Please select a vehicle type");
										return;
									}
									if (step === 1 && needsPlate && !licensePlate) {
										toast.error("License plate is required");
										return;
									}
									setStep((s) => s + 1);
								}}
								className="gap-2">
								Next
								<ArrowRight className="h-4 w-4" />
							</Button>
						) : (
							<Button
								onClick={handleSubmit}
								disabled={createProfile.isPending || !agreed}
								className="gap-2">
								{createProfile.isPending && (
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
