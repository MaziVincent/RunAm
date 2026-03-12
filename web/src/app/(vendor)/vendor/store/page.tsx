"use client";

import { useState, useEffect } from "react";
import {
	Store,
	Camera,
	Save,
	Loader2,
	MapPin,
	Globe,
	Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyVendor, useUpdateVendorProfile } from "@/lib/hooks";
import { toast } from "sonner";

export default function VendorStorePage() {
	const { data: vendorRes, isLoading } = useMyVendor();
	const vendor = vendorRes?.data;
	const updateProfile = useUpdateVendorProfile();

	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [phone, setPhone] = useState("");
	const [address, setAddress] = useState("");
	const [logoUrl, setLogoUrl] = useState("");
	const [bannerUrl, setBannerUrl] = useState("");

	useEffect(() => {
		if (vendor) {
			setName(vendor.businessName ?? "");
			setDescription(vendor.description ?? "");
			setPhone(vendor.phoneNumber ?? "");
			setAddress(vendor.address ?? "");
			setLogoUrl(vendor.logoUrl ?? "");
			setBannerUrl(vendor.bannerUrl ?? "");
		}
	}, [vendor]);

	async function handleSave() {
		updateProfile.mutate(
			{
				businessName: name,
				description,
				phoneNumber: phone,
				address,
			},
			{
				onSuccess: () => toast.success("Store profile updated"),
				onError: () => toast.error("Failed to update profile"),
			},
		);
	}

	if (isLoading) {
		return (
			<div className="space-y-6">
				<Skeleton className="h-8 w-48" />
				<Skeleton className="h-48 rounded-xl" />
				<Skeleton className="h-64 rounded-xl" />
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">Store Profile</h1>
					<p className="text-sm text-muted-foreground">
						Manage how your store appears to customers
					</p>
				</div>
				<Button
					onClick={handleSave}
					disabled={updateProfile.isPending}
					className="gap-2">
					{updateProfile.isPending ? (
						<Loader2 className="h-4 w-4 animate-spin" />
					) : (
						<Save className="h-4 w-4" />
					)}
					Save Changes
				</Button>
			</div>

			{/* Cover Image */}
			<Card>
				<CardContent className="p-0">
					<div className="relative h-48 overflow-hidden rounded-t-xl bg-gradient-to-r from-primary/20 to-primary/5">
						{bannerUrl ? (
							<img
								src={bannerUrl}
								alt="Store cover"
								className="h-full w-full object-cover"
							/>
						) : (
							<div className="flex h-full items-center justify-center">
								<div className="text-center">
									<Camera className="mx-auto h-8 w-8 text-muted-foreground/40" />
									<p className="mt-2 text-xs text-muted-foreground">
										Cover Image (1200×400 recommended)
									</p>
								</div>
							</div>
						)}
					</div>

					{/* Logo */}
					<div className="relative -mt-12 ml-6">
						<div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-xl border-4 border-background bg-muted">
							{logoUrl ? (
								<img
									src={logoUrl}
									alt="Store logo"
									className="h-full w-full object-cover"
								/>
							) : (
								<Store className="h-8 w-8 text-muted-foreground" />
							)}
						</div>
					</div>

					<div className="p-6 pt-4">
						<h2 className="text-xl font-bold">
							{vendor?.businessName ?? "Your Store"}
						</h2>
						<div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
							{vendor?.address && (
								<span className="flex items-center gap-1">
									<MapPin className="h-3.5 w-3.5" />
									{vendor.address}
								</span>
							)}
							<span className="flex items-center gap-1">
								<Clock className="h-3.5 w-3.5" />
								{vendor?.isOpen ? "Open Now" : "Closed"}
							</span>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Business Details */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-lg">
						<Store className="h-5 w-5" />
						Business Details
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid gap-4 sm:grid-cols-2">
						<div>
							<Label htmlFor="name">Business Name</Label>
							<Input
								id="name"
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder="Your business name"
								className="mt-1.5"
							/>
						</div>
						<div>
							<Label htmlFor="phone">Phone Number</Label>
							<Input
								id="phone"
								value={phone}
								onChange={(e) => setPhone(e.target.value)}
								placeholder="080XXXXXXXX"
								className="mt-1.5"
							/>
						</div>
					</div>

					<div>
						<Label htmlFor="description">Description</Label>
						<textarea
							id="description"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							rows={3}
							className="mt-1.5 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
							placeholder="Tell customers about your store..."
						/>
					</div>

					<Separator />

					<div>
						<Label htmlFor="address">Business Address</Label>
						<div className="mt-1.5 flex items-center gap-2">
							<MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
							<Input
								id="address"
								value={address}
								onChange={(e) => setAddress(e.target.value)}
								placeholder="Enter your business address"
							/>
						</div>
					</div>

					<Separator />

					<div className="grid gap-4 sm:grid-cols-2">
						<div>
							<Label htmlFor="logoUrl">Logo URL</Label>
							<div className="mt-1.5 flex items-center gap-2">
								<Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
								<Input
									id="logoUrl"
									value={logoUrl}
									onChange={(e) => setLogoUrl(e.target.value)}
									placeholder="https://..."
								/>
							</div>
						</div>
						<div>
							<Label htmlFor="coverUrl">Banner Image URL</Label>
							<div className="mt-1.5 flex items-center gap-2">
								<Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
								<Input
									id="coverUrl"
									value={bannerUrl}
									onChange={(e) => setBannerUrl(e.target.value)}
									placeholder="https://..."
								/>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
