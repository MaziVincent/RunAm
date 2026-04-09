"use client";

import { useEffect, useRef, useState } from "react";
import {
	Bell,
	Clock,
	ImageIcon,
	Loader2,
	Save,
	Store,
	Truck,
	Upload,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api/client";
import { useMyVendor, useUpdateVendorProfile } from "@/lib/hooks";
import {
	buildUniformOperatingHours,
	parseOperatingHours,
} from "@/lib/vendor-hours";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

export default function VendorSettingsPage() {
	const { data: vendorRes } = useMyVendor();
	const vendor = vendorRes?.data;
	const updateProfile = useUpdateVendorProfile();
	const logoInputRef = useRef<HTMLInputElement>(null);
	const bannerInputRef = useRef<HTMLInputElement>(null);

	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [phone, setPhone] = useState("");
	const [logoUrl, setLogoUrl] = useState("");
	const [bannerUrl, setBannerUrl] = useState("");
	const [logoPreview, setLogoPreview] = useState<string | null>(null);
	const [bannerPreview, setBannerPreview] = useState<string | null>(null);
	const [logoUploading, setLogoUploading] = useState(false);
	const [bannerUploading, setBannerUploading] = useState(false);
	const [minOrder, setMinOrder] = useState("1000");
	const [prepTime, setPrepTime] = useState("30");
	const [openingTime, setOpeningTime] = useState("08:00");
	const [closingTime, setClosingTime] = useState("22:00");
	const [newOrders, setNewOrders] = useState(true);
	const [orderUpdates, setOrderUpdates] = useState(true);
	const [lowStock, setLowStock] = useState(false);
	const [reviews, setReviews] = useState(true);

	async function persistImageUpdate(
		payload: {
			logoUrl?: string;
			bannerUrl?: string;
		},
		successMessage: string,
	) {
		await updateProfile.mutateAsync(payload);
		toast.success(successMessage);
	}

	useEffect(() => {
		if (!vendor) {
			return;
		}

		setName(vendor.businessName ?? "");
		setDescription(vendor.description ?? "");
		setPhone(vendor.phoneNumber ?? "");
		setLogoUrl(vendor.logoUrl ?? "");
		setBannerUrl(vendor.bannerUrl ?? "");
		setLogoPreview(null);
		setBannerPreview(null);
		setMinOrder(vendor.minimumOrderAmount?.toString() ?? "1000");
		setPrepTime(vendor.estimatedPrepTimeMinutes?.toString() ?? "30");

		const parsedHours = parseOperatingHours(vendor.operatingHours);
		setOpeningTime(parsedHours?.openingTime ?? "08:00");
		setClosingTime(parsedHours?.closingTime ?? "22:00");
	}, [vendor]);

	async function uploadVendorImage(
		file: File,
		setUploading: (value: boolean) => void,
		onComplete: (uploadedUrl: string, previewUrl: string) => Promise<void>,
		label: string,
	) {
		if (file.size > 5 * 1024 * 1024) {
			toast.error(`${label} must be under 5MB`);
			return;
		}

		if (!file.type.startsWith("image/")) {
			toast.error("Please select an image file");
			return;
		}

		setUploading(true);
		try {
			const res = await api.upload<{ url: string }>(
				"/files/vendor-image",
				file,
			);
			if (!res.success || !res.data?.url) {
				throw new Error(
					res.error?.message ?? `Failed to upload ${label.toLowerCase()}`,
				);
			}

			await onComplete(res.data.url, URL.createObjectURL(file));
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: `Failed to upload ${label.toLowerCase()}`,
			);
		} finally {
			setUploading(false);
		}
	}

	async function handleLogoSelect(event: React.ChangeEvent<HTMLInputElement>) {
		const file = event.target.files?.[0];
		if (!file) {
			return;
		}

		await uploadVendorImage(
			file,
			setLogoUploading,
			async (uploadedUrl, previewUrl) => {
				setLogoUrl(uploadedUrl);
				setLogoPreview(previewUrl);
				await persistImageUpdate({ logoUrl: uploadedUrl }, "Logo saved");
			},
			"Logo",
		);

		if (logoInputRef.current) {
			logoInputRef.current.value = "";
		}
	}

	async function handleBannerSelect(
		event: React.ChangeEvent<HTMLInputElement>,
	) {
		const file = event.target.files?.[0];
		if (!file) {
			return;
		}

		await uploadVendorImage(
			file,
			setBannerUploading,
			async (uploadedUrl, previewUrl) => {
				setBannerUrl(uploadedUrl);
				setBannerPreview(previewUrl);
				await persistImageUpdate(
					{ bannerUrl: uploadedUrl },
					"Banner image saved",
				);
			},
			"Banner image",
		);

		if (bannerInputRef.current) {
			bannerInputRef.current.value = "";
		}
	}

	async function handleSaveProfile() {
		try {
			await updateProfile.mutateAsync({
				businessName: name,
				description,
				phoneNumber: phone,
				logoUrl,
				bannerUrl,
			});
			toast.success("Profile updated");
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to update profile",
			);
		}
	}

	async function handleSaveDelivery() {
		try {
			await updateProfile.mutateAsync({
				minimumOrderAmount: Number(minOrder),
				estimatedPrepTimeMinutes: Number(prepTime),
			});
			toast.success("Delivery settings updated");
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Failed to update delivery settings",
			);
		}
	}

	async function handleSaveHours() {
		try {
			await updateProfile.mutateAsync({
				operatingHours: buildUniformOperatingHours(openingTime, closingTime),
			});
			toast.success("Operating hours updated");
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Failed to update operating hours",
			);
		}
	}

	return (
		<div className="space-y-6">
			<h1 className="text-2xl font-bold">Settings</h1>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-base">
						<Store className="h-4 w-4" />
						Store Profile
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div>
						<Label>Store Logo</Label>
						<input
							ref={logoInputRef}
							type="file"
							accept="image/*"
							onChange={handleLogoSelect}
							className="hidden"
						/>
						<div className="mt-1.5 flex items-center gap-4">
							<div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border bg-muted">
								{logoUrl ? (
									<img
										src={logoPreview ?? logoUrl}
										alt="Logo"
										className="h-full w-full object-cover"
									/>
								) : (
									<div className="flex h-full w-full items-center justify-center">
										<Store className="h-6 w-6 text-muted-foreground/40" />
									</div>
								)}
							</div>
							<div className="flex-1 space-y-3">
								<p className="text-xs text-muted-foreground">
									Square image, at least 200×200px
								</p>
								<Button
									type="button"
									variant="outline"
									onClick={() => logoInputRef.current?.click()}
									disabled={logoUploading}
									className="gap-2">
									{logoUploading ? (
										<Loader2 className="h-4 w-4 animate-spin" />
									) : (
										<Upload className="h-4 w-4" />
									)}
									{logoUrl ? "Upload new logo" : "Upload logo"}
								</Button>
							</div>
						</div>
					</div>

					<div>
						<Label>Banner Image</Label>
						<input
							ref={bannerInputRef}
							type="file"
							accept="image/*"
							onChange={handleBannerSelect}
							className="hidden"
						/>
						<div className="mt-1.5">
							<div className="relative h-28 w-full overflow-hidden rounded-lg border bg-muted">
								{bannerUrl ? (
									<img
										src={bannerPreview ?? bannerUrl}
										alt="Banner"
										className="h-full w-full object-cover"
									/>
								) : (
									<div className="flex h-full w-full items-center justify-center">
										<ImageIcon className="h-6 w-6 text-muted-foreground/40" />
									</div>
								)}
							</div>
							<div className="mt-3">
								<Button
									type="button"
									variant="outline"
									onClick={() => bannerInputRef.current?.click()}
									disabled={bannerUploading}
									className="gap-2">
									{bannerUploading ? (
										<Loader2 className="h-4 w-4 animate-spin" />
									) : (
										<Upload className="h-4 w-4" />
									)}
									{bannerUrl ? "Upload new banner" : "Upload banner"}
								</Button>
							</div>
							<p className="mt-1 text-xs text-muted-foreground">
								Recommended: 1200×400px
							</p>
						</div>
					</div>

					<Separator />

					<div className="space-y-2">
						<Label htmlFor="store-name">Business Name</Label>
						<Input
							id="store-name"
							value={name}
							onChange={(event) => setName(event.target.value)}
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="store-desc">Description</Label>
						<textarea
							id="store-desc"
							value={description}
							onChange={(event) => setDescription(event.target.value)}
							className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
							placeholder="Tell customers about your store..."
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="store-phone">Phone</Label>
						<Input
							id="store-phone"
							value={phone}
							onChange={(event) => setPhone(event.target.value)}
							type="tel"
						/>
					</div>

					<Button
						onClick={handleSaveProfile}
						disabled={updateProfile.isPending}
						className="w-full gap-2 sm:w-auto">
						<Save className="h-4 w-4" />
						Save Profile
					</Button>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-base">
						<Clock className="h-4 w-4" />
						Operating Hours
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-2">
							<Label htmlFor="open-time">Opening Time</Label>
							<Input
								id="open-time"
								type="time"
								value={openingTime}
								onChange={(event) => setOpeningTime(event.target.value)}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="close-time">Closing Time</Label>
							<Input
								id="close-time"
								type="time"
								value={closingTime}
								onChange={(event) => setClosingTime(event.target.value)}
							/>
						</div>
					</div>

					<p className="text-xs text-muted-foreground">
						Applied to all days. Per-day schedules coming soon.
					</p>

					<Button
						onClick={handleSaveHours}
						disabled={updateProfile.isPending}
						className="w-full gap-2 sm:w-auto">
						<Save className="h-4 w-4" />
						Save Hours
					</Button>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-base">
						<Truck className="h-4 w-4" />
						Delivery Settings
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid gap-3 sm:grid-cols-2">
						<div className="space-y-2">
							<Label htmlFor="min-order">Minimum Order (₦)</Label>
							<Input
								id="min-order"
								type="number"
								value={minOrder}
								onChange={(event) => setMinOrder(event.target.value)}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="prep-time">Avg. Prep Time (min)</Label>
							<Input
								id="prep-time"
								type="number"
								value={prepTime}
								onChange={(event) => setPrepTime(event.target.value)}
							/>
						</div>
					</div>

					<Button
						onClick={handleSaveDelivery}
						disabled={updateProfile.isPending}
						className="w-full gap-2 sm:w-auto">
						<Save className="h-4 w-4" />
						Save Delivery Settings
					</Button>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-base">
						<Bell className="h-4 w-4" />
						Notifications
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					{[
						{
							label: "New Orders",
							desc: "Get notified when a customer places an order",
							checked: newOrders,
							set: setNewOrders,
						},
						{
							label: "Order Updates",
							desc: "Rider assignment, pickup, and delivery",
							checked: orderUpdates,
							set: setOrderUpdates,
						},
						{
							label: "Low Stock Alerts",
							desc: "When product availability changes",
							checked: lowStock,
							set: setLowStock,
						},
						{
							label: "New Reviews",
							desc: "When a customer leaves a review",
							checked: reviews,
							set: setReviews,
						},
					].map((pref) => (
						<div
							key={pref.label}
							className="flex items-center justify-between gap-4">
							<div>
								<p className="text-sm font-medium">{pref.label}</p>
								<p className="text-xs text-muted-foreground">{pref.desc}</p>
							</div>
							<Switch checked={pref.checked} onCheckedChange={pref.set} />
						</div>
					))}
				</CardContent>
			</Card>
		</div>
	);
}
