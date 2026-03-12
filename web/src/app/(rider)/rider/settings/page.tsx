"use client";

import { useState } from "react";
import {
	User,
	Bike,
	Car,
	Bell,
	Shield,
	LogOut,
	Loader2,
	PersonStanding,
	Save,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useRiderProfile } from "@/lib/hooks";
import { useAuthStore } from "@/lib/stores/auth-store";
import { VehicleType, ApprovalStatus } from "@/types";
import { cn } from "@/lib/utils";

const vehicleTypeLabel: Record<number, string> = {
	[VehicleType.OnFoot]: "On Foot",
	[VehicleType.Bicycle]: "Bicycle",
	[VehicleType.Motorcycle]: "Motorcycle",
	[VehicleType.Car]: "Car",
};

const vehicleTypeIcon: Record<number, typeof Bike> = {
	[VehicleType.OnFoot]: PersonStanding,
	[VehicleType.Bicycle]: Bike,
	[VehicleType.Motorcycle]: Bike,
	[VehicleType.Car]: Car,
};

const approvalStatusColor: Record<number, string> = {
	[ApprovalStatus.Pending]: "bg-amber-100 text-amber-700",
	[ApprovalStatus.Approved]: "bg-green-100 text-green-700",
	[ApprovalStatus.Rejected]: "bg-red-100 text-red-700",
};

export default function RiderSettingsPage() {
	const { data, isLoading } = useRiderProfile();
	const { user, logout } = useAuthStore();
	const profile = data?.data;
	const [notificationsEnabled, setNotificationsEnabled] = useState(true);
	const [soundEnabled, setSoundEnabled] = useState(true);

	if (isLoading) {
		return (
			<div className="space-y-6">
				<div>
					<h1 className="text-2xl font-bold">Settings</h1>
				</div>
				<div className="space-y-4">
					{[1, 2, 3].map((i) => (
						<Skeleton key={i} className="h-40 rounded-lg" />
					))}
				</div>
			</div>
		);
	}

	const VehicleIcon = profile
		? (vehicleTypeIcon[profile.vehicleType] ?? Bike)
		: Bike;

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold">Settings</h1>
				<p className="text-sm text-muted-foreground">
					Manage your rider profile and preferences
				</p>
			</div>

			{/* Profile Overview */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-base">
						<User className="h-4 w-4" />
						Profile
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid gap-4 sm:grid-cols-2">
						<div>
							<Label className="text-muted-foreground">Name</Label>
							<p className="text-sm font-medium">
								{user?.firstName} {user?.lastName}
							</p>
						</div>
						<div>
							<Label className="text-muted-foreground">Email</Label>
							<p className="text-sm font-medium">{user?.email}</p>
						</div>
						<div>
							<Label className="text-muted-foreground">Rider Name</Label>
							<p className="text-sm font-medium">{profile?.riderName ?? "—"}</p>
						</div>
						<div>
							<Label className="text-muted-foreground">Status</Label>
							{profile && (
								<span
									className={cn(
										"inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
										approvalStatusColor[profile.approvalStatus],
									)}>
									{profile.approvalStatus === ApprovalStatus.Pending
										? "Pending Approval"
										: profile.approvalStatus === ApprovalStatus.Approved
											? "Approved"
											: "Rejected"}
								</span>
							)}
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Vehicle Info */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-base">
						<VehicleIcon className="h-4 w-4" />
						Vehicle Information
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid gap-4 sm:grid-cols-2">
						<div>
							<Label className="text-muted-foreground">Vehicle Type</Label>
							<p className="text-sm font-medium">
								{profile
									? (vehicleTypeLabel[profile.vehicleType] ?? "Unknown")
									: "—"}
							</p>
						</div>
						{profile?.licensePlate && (
							<div>
								<Label className="text-muted-foreground">License Plate</Label>
								<p className="text-sm font-medium">{profile.licensePlate}</p>
							</div>
						)}
						<div>
							<Label className="text-muted-foreground">Total Deliveries</Label>
							<p className="text-sm font-medium">
								{profile?.totalCompletedTasks ?? 0}
							</p>
						</div>
						<div>
							<Label className="text-muted-foreground">Rating</Label>
							<p className="text-sm font-medium">
								{profile?.rating?.toFixed(1) ?? "—"} ★
							</p>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Notifications */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-base">
						<Bell className="h-4 w-4" />
						Notifications
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-sm font-medium">Push Notifications</p>
							<p className="text-xs text-muted-foreground">
								Receive notifications for new tasks and updates
							</p>
						</div>
						<Switch
							checked={notificationsEnabled}
							onCheckedChange={setNotificationsEnabled}
						/>
					</div>
					<Separator />
					<div className="flex items-center justify-between">
						<div>
							<p className="text-sm font-medium">Sound Alerts</p>
							<p className="text-xs text-muted-foreground">
								Play sound for incoming task notifications
							</p>
						</div>
						<Switch checked={soundEnabled} onCheckedChange={setSoundEnabled} />
					</div>
				</CardContent>
			</Card>

			{/* Security */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-base">
						<Shield className="h-4 w-4" />
						Security
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-sm font-medium">Change Password</p>
							<p className="text-xs text-muted-foreground">
								Update your account password
							</p>
						</div>
						<Button variant="outline" size="sm">
							Change
						</Button>
					</div>
					<Separator />
					<div className="flex items-center justify-between">
						<div>
							<p className="text-sm font-medium">Two-Factor Authentication</p>
							<p className="text-xs text-muted-foreground">
								Add an extra layer of security
							</p>
						</div>
						<Badge variant="secondary">Coming Soon</Badge>
					</div>
				</CardContent>
			</Card>

			{/* Danger Zone */}
			<Card className="border-destructive/30">
				<CardHeader>
					<CardTitle className="text-base text-destructive">
						Danger Zone
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-sm font-medium">Sign Out</p>
							<p className="text-xs text-muted-foreground">
								Sign out of your rider account
							</p>
						</div>
						<Button
							variant="destructive"
							size="sm"
							className="gap-2"
							onClick={() => {
								logout();
								window.location.href = "/login";
							}}>
							<LogOut className="h-3 w-3" />
							Sign Out
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
