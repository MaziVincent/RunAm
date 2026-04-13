"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
	Bike,
	Car,
	PersonStanding,
	CheckCircle2,
	ArrowRight,
	ArrowLeft,
	Loader2,
	Camera,
	MapPin,
	Building2,
	Shield,
	FileText,
	X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
	useCreateRiderProfile,
	useValidateBankAccount,
	useUploadSelfie,
} from "@/lib/hooks";
import { VehicleType } from "@/types";
import { toast } from "sonner";
import { useAuthStore } from "@/lib/stores/auth-store";

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

const STEPS = [
	{ label: "Vehicle", icon: Car },
	{ label: "Identity", icon: Shield },
	{ label: "Address", icon: MapPin },
	{ label: "Bank", icon: Building2 },
	{ label: "Agreement", icon: FileText },
	{ label: "Review", icon: CheckCircle2 },
];

const NIGERIAN_STATES = [
	"Abia",
	"Adamawa",
	"Akwa Ibom",
	"Anambra",
	"Bauchi",
	"Bayelsa",
	"Benue",
	"Borno",
	"Cross River",
	"Delta",
	"Ebonyi",
	"Edo",
	"Ekiti",
	"Enugu",
	"FCT",
	"Gombe",
	"Imo",
	"Jigawa",
	"Kaduna",
	"Kano",
	"Katsina",
	"Kebbi",
	"Kogi",
	"Kwara",
	"Lagos",
	"Nasarawa",
	"Niger",
	"Ogun",
	"Ondo",
	"Osun",
	"Oyo",
	"Plateau",
	"Rivers",
	"Sokoto",
	"Taraba",
	"Yobe",
	"Zamfara",
];

export default function RiderOnboardingPage() {
	const [step, setStep] = useState(0);
	const [vehicleType, setVehicleType] = useState<VehicleType | null>(null);
	const [licensePlate, setLicensePlate] = useState("");
	const [nin, setNin] = useState("");
	const [selfieUrl, setSelfieUrl] = useState("");
	const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
	const [address, setAddress] = useState("");
	const [city, setCity] = useState("");
	const [state, setState] = useState("");
	const [settlementBankName, setSettlementBankName] = useState("");
	const [settlementBankCode, setSettlementBankCode] = useState("");
	const [settlementAccountNumber, setSettlementAccountNumber] = useState("");
	const [settlementAccountName, setSettlementAccountName] = useState("");
	const [bankVerified, setBankVerified] = useState(false);
	const [agreedTerms, setAgreedTerms] = useState(false);
	const [agreedPolicy, setAgreedPolicy] = useState(false);
	const [agreedVehicle, setAgreedVehicle] = useState(false);

	const videoRef = useRef<HTMLVideoElement>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [cameraOpen, setCameraOpen] = useState(false);
	const [cameraError, setCameraError] = useState<string | null>(null);
	const streamRef = useRef<MediaStream | null>(null);
	const router = useRouter();
	const user = useAuthStore((s) => s.user);
	const createProfile = useCreateRiderProfile();
	const validateBank = useValidateBankAccount();
	const uploadSelfie = useUploadSelfie();

	const needsPlate =
		vehicleType === VehicleType.Motorcycle || vehicleType === VehicleType.Car;
	const allAgreed = agreedTerms && agreedPolicy && agreedVehicle;

	const stopCamera = useCallback(() => {
		if (streamRef.current) {
			streamRef.current.getTracks().forEach((t) => t.stop());
			streamRef.current = null;
		}
		setCameraOpen(false);
	}, []);

	// Clean up camera when leaving step 1
	useEffect(() => {
		if (step !== 1) stopCamera();
	}, [step, stopCamera]);

	// Clean up on unmount
	useEffect(() => {
		return () => {
			stopCamera();
		};
	}, [stopCamera]);

	async function openCamera() {
		setCameraError(null);

		if (!navigator.mediaDevices?.getUserMedia) {
			setCameraError(
				"Camera is not available. Make sure you're accessing this page over HTTPS or on localhost.",
			);
			return;
		}

		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				video: {
					facingMode: "user",
					width: { ideal: 640 },
					height: { ideal: 640 },
				},
				audio: false,
			});
			streamRef.current = stream;
			setCameraOpen(true);
			// Attach stream to video after state update
			requestAnimationFrame(() => {
				if (videoRef.current) {
					videoRef.current.srcObject = stream;
				}
			});
		} catch (err) {
			const name = err instanceof DOMException ? err.name : "";
			if (name === "NotFoundError" || name === "DevicesNotFoundError") {
				setCameraError("No camera found on this device.");
			} else if (
				name === "NotAllowedError" ||
				name === "PermissionDeniedError"
			) {
				setCameraError(
					"Camera access was blocked. Please allow camera access in your browser settings and reload the page.",
				);
			} else if (name === "NotReadableError" || name === "TrackStartError") {
				setCameraError(
					"Camera is in use by another application. Close it and try again.",
				);
			} else {
				setCameraError(
					`Camera error: ${err instanceof Error ? err.message : "Unknown error"}`,
				);
			}
		}
	}

	async function capturePhoto() {
		const video = videoRef.current;
		const canvas = canvasRef.current;
		if (!video || !canvas) return;

		const size = Math.min(video.videoWidth, video.videoHeight);
		canvas.width = size;
		canvas.height = size;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		// Center-crop to square
		const sx = (video.videoWidth - size) / 2;
		const sy = (video.videoHeight - size) / 2;
		ctx.drawImage(video, sx, sy, size, size, 0, 0, size, size);

		stopCamera();

		const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
		setSelfiePreview(dataUrl);

		// Convert to File and upload
		canvas.toBlob(
			async (blob) => {
				if (!blob) {
					toast.error("Failed to capture photo");
					return;
				}
				const file = new File([blob], "selfie.jpg", { type: "image/jpeg" });
				try {
					const result = await uploadSelfie.mutateAsync(file);
					if (result.data) {
						setSelfieUrl(result.data);
						toast.success("Photo captured successfully");
					}
				} catch {
					setSelfiePreview(null);
					toast.error("Failed to upload photo");
				}
			},
			"image/jpeg",
			0.85,
		);
	}

	function retakePhoto() {
		setSelfiePreview(null);
		setSelfieUrl("");
		openCamera();
	}

	async function handleBankVerification() {
		if (!settlementBankCode || settlementAccountNumber.length < 10) {
			toast.error("Enter a valid bank code and 10-digit account number");
			return;
		}
		try {
			const result = await validateBank.mutateAsync({
				bankCode: settlementBankCode,
				accountNumber: settlementAccountNumber,
			});
			if (result.data?.success && result.data.accountName) {
				const resolvedName = result.data.accountName;
				setSettlementAccountName(resolvedName);
				const resolvedUpper = resolvedName.toUpperCase();
				const lastNameMatch =
					user?.lastName && resolvedUpper.includes(user.lastName.toUpperCase());
				if (lastNameMatch) {
					setBankVerified(true);
					toast.success("Account verified: " + resolvedName);
				} else {
					setBankVerified(false);
					const riderFullName = user
						? (user.firstName + " " + user.lastName).toUpperCase()
						: "";
					toast.error(
						'Account name "' +
							resolvedName +
							'" does not match your registered name "' +
							riderFullName +
							'". Please use an account in your name.',
					);
				}
			} else {
				setBankVerified(false);
				toast.error(
					result.data?.message ||
						"Could not verify account. Please check and try again.",
				);
			}
		} catch {
			setBankVerified(false);
			toast.error("Bank verification failed. Please try again.");
		}
	}

	function validateStep(s: number): boolean {
		switch (s) {
			case 0:
				if (vehicleType === null) {
					toast.error("Please select a vehicle type");
					return false;
				}
				if (needsPlate && !licensePlate.trim()) {
					toast.error("License plate is required for motorized vehicles");
					return false;
				}
				return true;
			case 1:
				if (nin.replace(/\D/g, "").length !== 11) {
					toast.error("NIN must be exactly 11 digits");
					return false;
				}
				if (!selfieUrl) {
					toast.error("Please take a passport photograph");
					return false;
				}
				return true;
			case 2:
				if (!address.trim()) {
					toast.error("Please enter your address");
					return false;
				}
				if (!city.trim()) {
					toast.error("Please enter your city");
					return false;
				}
				if (!state) {
					toast.error("Please select your state");
					return false;
				}
				return true;
			case 3:
				if (!bankVerified) {
					toast.error("Please verify your bank account first");
					return false;
				}
				return true;
			case 4:
				if (!allAgreed) {
					toast.error("Please accept all agreements");
					return false;
				}
				return true;
			default:
				return true;
		}
	}

	function goNext() {
		if (!validateStep(step)) return;
		setStep((s) => Math.min(s + 1, 5));
	}

	async function handleSubmit() {
		if (vehicleType === null) return;
		try {
			await createProfile.mutateAsync({
				vehicleType,
				licensePlate: needsPlate ? licensePlate : undefined,
				nin: nin.replace(/\D/g, ""),
				selfieUrl: selfieUrl || undefined,
				address,
				city,
				state,
				settlementBankCode,
				settlementBankName,
				settlementAccountNumber,
				settlementAccountName,
				agreedToTerms: true,
			});
			toast.success("Application submitted! We'll review it shortly.");
			router.push("/rider");
		} catch {
			toast.error("Failed to submit application");
		}
	}

	return (
		<div className="mx-auto max-w-xl space-y-6 py-4">
			<div>
				<h1 className="text-2xl font-bold">Become a Rider</h1>
				<p className="text-sm text-muted-foreground">
					Complete your profile to join RunAm&apos;s delivery network
				</p>
			</div>

			{/* Step indicator */}
			<div className="flex items-center gap-1">
				{STEPS.map((s, i) => (
					<div
						key={s.label}
						className="flex flex-1 flex-col items-center gap-1">
						<div
							className={cn(
								"flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-medium transition-colors",
								i < step
									? "border-primary bg-primary text-primary-foreground"
									: i === step
										? "border-primary text-primary"
										: "border-muted text-muted-foreground",
							)}>
							{i < step ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
						</div>
						<span className="hidden text-[10px] font-medium sm:block">
							{s.label}
						</span>
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
							{needsPlate && (
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
							)}
						</div>
					)}

					{/* Step 1: Identity (NIN + Selfie) */}
					{step === 1 && (
						<div className="space-y-4">
							<h2 className="text-lg font-semibold">Identity Verification</h2>
							<p className="text-sm text-muted-foreground">
								We need your NIN and a passport photograph for verification
							</p>
							<div className="space-y-2">
								<Label>National Identification Number (NIN)</Label>
								<Input
									inputMode="numeric"
									maxLength={11}
									value={nin}
									onChange={(e) => setNin(e.target.value.replace(/\D/g, ""))}
									placeholder="11-digit NIN"
								/>
								<p className="text-xs text-muted-foreground">
									Your NIN will be used for identity verification
								</p>
							</div>
							<div className="space-y-2">
								<Label>Passport Photograph</Label>
								<div className="flex flex-col items-center gap-3">
									{/* Hidden canvas for capture */}
									<canvas ref={canvasRef} className="hidden" />

									{cameraOpen && !selfiePreview && (
										<div className="relative">
											<video
												ref={videoRef}
												autoPlay
												playsInline
												muted
												className="h-48 w-48 rounded-full object-cover border-4 border-primary/30"
											/>
											<div className="absolute inset-0 rounded-full border-4 border-dashed border-white/40 pointer-events-none" />
										</div>
									)}

									{selfiePreview && (
										<div className="relative">
											<img
												src={selfiePreview}
												alt="Captured photo"
												className="h-48 w-48 rounded-full object-cover border-4 border-primary/20"
											/>
											{uploadSelfie.isPending && (
												<div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
													<Loader2 className="h-8 w-8 animate-spin text-white" />
												</div>
											)}
											{selfieUrl && !uploadSelfie.isPending && (
												<div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-white">
													<CheckCircle2 className="h-5 w-5" />
												</div>
											)}
											<button
												type="button"
												onClick={() => {
													setSelfiePreview(null);
													setSelfieUrl("");
												}}
												className="absolute -top-1 -left-1 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-white">
												<X className="h-3 w-3" />
											</button>
										</div>
									)}

									{!cameraOpen && !selfiePreview && (
										<button
											type="button"
											onClick={openCamera}
											className="flex h-48 w-48 flex-col items-center justify-center gap-2 rounded-full border-2 border-dashed border-muted-foreground/30 transition-colors hover:border-primary/50 hover:bg-muted/50">
											<Camera className="h-10 w-10 text-muted-foreground" />
											<span className="text-xs text-muted-foreground">
												Open Camera
											</span>
										</button>
									)}

									{cameraError && (
										<p className="text-sm text-destructive text-center">
											{cameraError}
										</p>
									)}

									{cameraOpen && !selfiePreview && (
										<div className="flex gap-2">
											<Button
												type="button"
												onClick={capturePhoto}
												className="gap-2">
												<Camera className="h-4 w-4" />
												Capture
											</Button>
											<Button
												type="button"
												variant="outline"
												onClick={stopCamera}>
												Cancel
											</Button>
										</div>
									)}

									{selfiePreview && !uploadSelfie.isPending && (
										<Button
											type="button"
											variant="outline"
											size="sm"
											onClick={retakePhoto}
											className="gap-2">
											<Camera className="h-4 w-4" />
											Retake Photo
										</Button>
									)}
								</div>
								<p className="text-center text-xs text-muted-foreground">
									Position your face in the circle and take a clear, well-lit
									passport photograph
								</p>
							</div>
						</div>
					)}

					{/* Step 2: Address */}
					{step === 2 && (
						<div className="space-y-4">
							<h2 className="text-lg font-semibold">Your Address</h2>
							<p className="text-sm text-muted-foreground">
								Enter your home or operating address
							</p>
							<div className="space-y-2">
								<Label>Street Address</Label>
								<Input
									value={address}
									onChange={(e) => setAddress(e.target.value)}
									placeholder="e.g. 12 Admiralty Way, Lekki Phase 1"
								/>
							</div>
							<div className="grid gap-4 sm:grid-cols-2">
								<div className="space-y-2">
									<Label>City</Label>
									<Input
										value={city}
										onChange={(e) => setCity(e.target.value)}
										placeholder="e.g. Lagos"
									/>
								</div>
								<div className="space-y-2">
									<Label>State</Label>
									<select
										value={state}
										onChange={(e) => setState(e.target.value)}
										className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
										<option value="">Select state</option>
										{NIGERIAN_STATES.map((s) => (
											<option key={s} value={s}>
												{s}
											</option>
										))}
									</select>
								</div>
							</div>
						</div>
					)}

					{/* Step 3: Bank Details */}
					{step === 3 && (
						<div className="space-y-4">
							<h2 className="text-lg font-semibold">Bank Details</h2>
							<p className="text-sm text-muted-foreground">
								Your earnings will be paid to this account. The account name
								must match your registered name.
							</p>
							<div className="grid gap-4 sm:grid-cols-2">
								<div className="space-y-2">
									<Label>Bank Name</Label>
									<Input
										value={settlementBankName}
										onChange={(e) => {
											setSettlementBankName(e.target.value);
											setBankVerified(false);
										}}
										placeholder="e.g. Moniepoint"
									/>
								</div>
								<div className="space-y-2">
									<Label>Bank Code</Label>
									<Input
										value={settlementBankCode}
										onChange={(e) => {
											setSettlementBankCode(e.target.value);
											setBankVerified(false);
										}}
										placeholder="e.g. 50515"
									/>
								</div>
							</div>
							<div className="space-y-2">
								<Label>Account Number</Label>
								<div className="flex gap-2">
									<Input
										inputMode="numeric"
										maxLength={10}
										value={settlementAccountNumber}
										onChange={(e) => {
											setSettlementAccountNumber(
												e.target.value.replace(/\D/g, ""),
											);
											setBankVerified(false);
											setSettlementAccountName("");
										}}
										placeholder="10-digit account number"
										className="flex-1"
									/>
									<Button
										type="button"
										variant="outline"
										onClick={handleBankVerification}
										disabled={
											validateBank.isPending ||
											!settlementBankCode ||
											settlementAccountNumber.length < 10
										}
										className="shrink-0 gap-2">
										{validateBank.isPending ? (
											<Loader2 className="h-4 w-4 animate-spin" />
										) : (
											<Shield className="h-4 w-4" />
										)}
										Verify
									</Button>
								</div>
							</div>
							{settlementAccountName && (
								<div
									className={cn(
										"rounded-lg border p-3 text-sm",
										bankVerified
											? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30"
											: "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30",
									)}>
									<p className="font-medium">
										{bankVerified ? (
											<span className="flex items-center gap-2 text-green-700 dark:text-green-300">
												<CheckCircle2 className="h-4 w-4" />
												Account Verified
											</span>
										) : (
											<span className="text-red-700 dark:text-red-300">
												Name Mismatch
											</span>
										)}
									</p>
									<p
										className={cn(
											"mt-1",
											bankVerified
												? "text-green-600 dark:text-green-400"
												: "text-red-600 dark:text-red-400",
										)}>
										Account Name:{" "}
										<span className="font-semibold">
											{settlementAccountName}
										</span>
									</p>
								</div>
							)}
							<div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-800 dark:bg-amber-950/30">
								<p className="text-amber-700 dark:text-amber-300">
									The account name returned by your bank must match the name on
									your RunAm account ({user?.firstName} {user?.lastName}) for
									security purposes.
								</p>
							</div>
						</div>
					)}

					{/* Step 4: Agreement & Consent */}
					{step === 4 && (
						<div className="space-y-4">
							<h2 className="text-lg font-semibold">Agreement & Consent</h2>
							<p className="text-sm text-muted-foreground">
								Please read and accept the following to continue
							</p>
							<div className="space-y-3">
								<div className="rounded-lg border p-4">
									<h3 className="font-medium">Rider Terms of Service</h3>
									<div className="mt-2 max-h-32 overflow-y-auto text-xs text-muted-foreground space-y-2">
										<p>
											By joining RunAm as a rider, you agree to provide delivery
											services in a professional, timely, and safe manner. You
											are responsible for maintaining your vehicle in good
											working condition and complying with all applicable
											traffic laws and regulations.
										</p>
										<p>
											RunAm reserves the right to deactivate your rider account
											if you consistently fail to meet service standards,
											receive poor customer ratings, or violate any terms of
											service.
										</p>
										<p>
											Earnings are calculated based on delivery distance,
											complexity, and demand. RunAm retains a service commission
											on each delivery. Payouts are processed to your verified
											bank account.
										</p>
									</div>
									<label className="mt-3 flex items-center gap-2 text-sm">
										<input
											type="checkbox"
											checked={agreedTerms}
											onChange={(e) => setAgreedTerms(e.target.checked)}
											className="h-4 w-4 rounded border-border"
										/>
										<span>I accept the Rider Terms of Service</span>
									</label>
								</div>
								<div className="rounded-lg border p-4">
									<h3 className="font-medium">Rider Policy</h3>
									<div className="mt-2 max-h-32 overflow-y-auto text-xs text-muted-foreground space-y-2">
										<p>
											As a RunAm rider, you must handle all packages with care.
											Fragile items must be treated with extra attention. You
											must not open, tamper with, or mishandle any package
											entrusted to you.
										</p>
										<p>
											You are required to maintain professional conduct with
											customers and vendors at all times. Any form of
											harassment, discrimination, or unprofessional behaviour
											will result in immediate account suspension.
										</p>
										<p>
											Real-time location sharing is required during active
											deliveries for safety and tracking purposes. You may go
											offline when not accepting deliveries.
										</p>
									</div>
									<label className="mt-3 flex items-center gap-2 text-sm">
										<input
											type="checkbox"
											checked={agreedPolicy}
											onChange={(e) => setAgreedPolicy(e.target.checked)}
											className="h-4 w-4 rounded border-border"
										/>
										<span>I accept the Rider Policy</span>
									</label>
								</div>
								<div className="rounded-lg border p-4">
									<h3 className="font-medium">Vehicle & Safety</h3>
									<p className="mt-2 text-xs text-muted-foreground">
										I confirm that I have the legal right to operate my selected
										vehicle type, I hold any required licenses or permits, and I
										will comply with all road safety regulations while making
										deliveries.
									</p>
									<label className="mt-3 flex items-center gap-2 text-sm">
										<input
											type="checkbox"
											checked={agreedVehicle}
											onChange={(e) => setAgreedVehicle(e.target.checked)}
											className="h-4 w-4 rounded border-border"
										/>
										<span>I confirm the vehicle &amp; safety declaration</span>
									</label>
								</div>
							</div>
						</div>
					)}

					{/* Step 5: Review & Submit */}
					{step === 5 && (
						<div className="space-y-4">
							<h2 className="text-lg font-semibold">Review & Submit</h2>
							<p className="text-sm text-muted-foreground">
								Please review your details before submitting
							</p>
							<div className="space-y-3 text-sm">
								<div className="rounded-lg bg-muted/50 p-4">
									<div className="flex items-center justify-between">
										<span className="font-medium">Vehicle</span>
										<button
											type="button"
											onClick={() => setStep(0)}
											className="text-xs text-primary hover:underline">
											Edit
										</button>
									</div>
									<div className="mt-2 space-y-1 text-muted-foreground">
										<p>
											Type:{" "}
											<span className="text-foreground font-medium">
												{
													VEHICLE_OPTIONS.find((v) => v.type === vehicleType)
														?.label
												}
											</span>
										</p>
										{needsPlate && licensePlate && (
											<p>
												Plate:{" "}
												<span className="text-foreground font-medium">
													{licensePlate}
												</span>
											</p>
										)}
									</div>
								</div>
								<div className="rounded-lg bg-muted/50 p-4">
									<div className="flex items-center justify-between">
										<span className="font-medium">Identity</span>
										<button
											type="button"
											onClick={() => setStep(1)}
											className="text-xs text-primary hover:underline">
											Edit
										</button>
									</div>
									<div className="mt-2 flex items-center gap-3 text-muted-foreground">
										{selfiePreview && (
											<img
												src={selfiePreview}
												alt="Selfie"
												className="h-12 w-12 rounded-full object-cover"
											/>
										)}
										<div>
											<p>
												NIN:{" "}
												<span className="text-foreground font-medium">
													{nin.slice(0, 3)}****{nin.slice(-4)}
												</span>
											</p>
											<p>
												Photo:{" "}
												<span className="text-foreground font-medium">
													{selfieUrl ? "Taken" : "Not taken"}
												</span>
											</p>
										</div>
									</div>
								</div>
								<div className="rounded-lg bg-muted/50 p-4">
									<div className="flex items-center justify-between">
										<span className="font-medium">Address</span>
										<button
											type="button"
											onClick={() => setStep(2)}
											className="text-xs text-primary hover:underline">
											Edit
										</button>
									</div>
									<p className="mt-2 text-muted-foreground">
										{address}, {city}, {state}
									</p>
								</div>
								<div className="rounded-lg bg-muted/50 p-4">
									<div className="flex items-center justify-between">
										<span className="font-medium">Bank Account</span>
										<button
											type="button"
											onClick={() => setStep(3)}
											className="text-xs text-primary hover:underline">
											Edit
										</button>
									</div>
									<div className="mt-2 space-y-1 text-muted-foreground">
										<p>
											{settlementBankName} &bull;{" "}
											<span className="text-foreground font-medium">
												{settlementAccountNumber}
											</span>
										</p>
										<p>
											Name:{" "}
											<span className="text-foreground font-medium">
												{settlementAccountName}
											</span>
										</p>
										{bankVerified && (
											<span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
												<CheckCircle2 className="h-3 w-3" /> Verified
											</span>
										)}
									</div>
								</div>
								<div className="rounded-lg bg-muted/50 p-4">
									<span className="font-medium">Agreements</span>
									<div className="mt-2 space-y-1 text-muted-foreground">
										<p className="flex items-center gap-2">
											<CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
											Terms of Service accepted
										</p>
										<p className="flex items-center gap-2">
											<CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
											Rider Policy accepted
										</p>
										<p className="flex items-center gap-2">
											<CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
											Vehicle &amp; Safety confirmed
										</p>
									</div>
								</div>
							</div>
							<div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-800 dark:bg-amber-950/30">
								<p className="font-medium text-amber-800 dark:text-amber-200">
									What happens next?
								</p>
								<p className="mt-1 text-amber-700 dark:text-amber-300">
									Your application will be reviewed by our team. Approval
									typically takes 1-2 business days. We&apos;ll notify you once
									your account is approved.
								</p>
							</div>
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
						{step < 5 ? (
							<Button onClick={goNext} className="gap-2">
								Next
								<ArrowRight className="h-4 w-4" />
							</Button>
						) : (
							<Button
								onClick={handleSubmit}
								disabled={createProfile.isPending}
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
