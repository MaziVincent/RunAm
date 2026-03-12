"use client";

import { useState } from "react";
import {
	Store,
	Clock,
	Truck,
	Bell,
	Save,
	Camera,
	X,
	Plus,
	Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useMyVendor, useUpdateVendorProfile } from "@/lib/hooks";

const DAYS = [
	"Monday",
	"Tuesday",
	"Wednesday",
	"Thursday",
	"Friday",
	"Saturday",
	"Sunday",
];

export default function VendorSettingsPage() {
	const { data: vendorRes } = useMyVendor();
	const vendor = vendorRes?.data;
	const updateProfile = useUpdateVendorProfile();

	// Store Profile
	const [name, setName] = useState(vendor?.businessName ?? "");
	const [description, setDescription] = useState(vendor?.description ?? "");
	const [phone, setPhone] = useState(vendor?.phoneNumber ?? "");

	// Delivery settings
	const [deliveryFee, setDeliveryFee] = useState(
		vendor?.deliveryFee?.toString() ?? "500",
	);
	const [minOrder, setMinOrder] = useState(
		vendor?.minimumOrderAmount?.toString() ?? "1000",
	);
	const [deliveryRadius, setDeliveryRadius] = useState("5");
	const [prepTime, setPrepTime] = useState(
		vendor?.estimatedPrepTimeMinutes?.toString() ?? "30",
	);

	// Hours — parse from operatingHours string "HH:MM-HH:MM"
	const opHours = vendor?.operatingHours?.split("-") ?? [];
	const [openingTime, setOpeningTime] = useState(opHours[0] ?? "08:00");
	const [closingTime, setClosingTime] = useState(opHours[1] ?? "22:00");

	// Notification prefs
	const [newOrders, setNewOrders] = useState(true);
	const [orderUpdates, setOrderUpdates] = useState(true);
	const [lowStock, setLowStock] = useState(false);
	const [reviews, setReviews] = useState(true);

	const handleSaveProfile = () => {
		updateProfile.mutate({
			businessName: name,
			description,
			phoneNumber: phone,
		});
	};

	const handleSaveDelivery = () => {
		updateProfile.mutate({
			deliveryFee: Number(deliveryFee),
			minimumOrderAmount: Number(minOrder),
			estimatedPrepTimeMinutes: Number(prepTime),
		});
	};

	const handleSaveHours = () => {
		updateProfile.mutate({
			operatingHours: `${openingTime}-${closingTime}`,
		});
	};

	return (
		<div className="space-y-6">
			<h1 className="text-2xl font-bold">Settings</h1>

			{/* Store Profile */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-base">
						<Store className="h-4 w-4" />
						Store Profile
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					{/* Logo */}
					<div className="flex items-center gap-4">
						<div className="relative h-16 w-16 rounded-xl bg-muted">
							{vendor?.logoUrl ? (
								<img
									src={vendor.logoUrl}
									alt=""
									className="h-full w-full rounded-xl object-cover"
								/>
							) : (
								<div className="flex h-full w-full items-center justify-center text-2xl font-bold text-muted-foreground/40">
									{name.charAt(0) || "S"}
								</div>
							)}
							<button className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
								<Camera className="h-3 w-3" />
							</button>
						</div>
						<div>
							<p className="text-sm font-medium">Store Logo</p>
							<p className="text-xs text-muted-foreground">
								Square image, at least 200x200px
							</p>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="store-name">Business Name</Label>
						<Input
							id="store-name"
							value={name}
							onChange={(e) => setName(e.target.value)}
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="store-desc">Description</Label>
						<textarea
							id="store-desc"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
							placeholder="Tell customers about your store..."
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="store-phone">Phone</Label>
						<Input
							id="store-phone"
							value={phone}
							onChange={(e) => setPhone(e.target.value)}
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

			{/* Operating Hours */}
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
								onChange={(e) => setOpeningTime(e.target.value)}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="close-time">Closing Time</Label>
							<Input
								id="close-time"
								type="time"
								value={closingTime}
								onChange={(e) => setClosingTime(e.target.value)}
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

			{/* Delivery Settings */}
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
							<Label htmlFor="delivery-fee">Delivery Fee (₦)</Label>
							<Input
								id="delivery-fee"
								type="number"
								value={deliveryFee}
								onChange={(e) => setDeliveryFee(e.target.value)}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="min-order">Minimum Order (₦)</Label>
							<Input
								id="min-order"
								type="number"
								value={minOrder}
								onChange={(e) => setMinOrder(e.target.value)}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="delivery-radius">Delivery Radius (km)</Label>
							<Input
								id="delivery-radius"
								type="number"
								value={deliveryRadius}
								onChange={(e) => setDeliveryRadius(e.target.value)}
								min={1}
								max={50}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="prep-time">Avg. Prep Time (min)</Label>
							<Input
								id="prep-time"
								type="number"
								value={prepTime}
								onChange={(e) => setPrepTime(e.target.value)}
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

			{/* Notification Preferences */}
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
							<Switch
								checked={pref.checked}
								onCheckedChange={pref.set}
							/>
						</div>
					))}
				</CardContent>
			</Card>
		</div>
	);
}
