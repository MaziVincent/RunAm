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
	Mail,
	MessageSquare,
	Gift,
	BadgeAlert,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { PasswordInput } from "@/components/ui/password-input";
import {
	useRiderProfile,
	useNotificationPreferences,
	useUpdateNotificationPreferences,
	useChangePassword,
} from "@/lib/hooks";
import { useAuthStore } from "@/lib/stores/auth-store";
import {
	VehicleType,
	ApprovalStatus,
	type NotificationPreferenceDto,
} from "@/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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

type NotificationPreferenceKey = Exclude<
	keyof NotificationPreferenceDto,
	"fcmToken"
>;

const notificationOptions: Array<{
	key: NotificationPreferenceKey;
	title: string;
	description: string;
	icon: typeof Bell;
}> = [
	{
		key: "pushEnabled",
		title: "Push Notifications",
		description: "Receive notifications for new tasks and live updates.",
		icon: Bell,
	},
	{
		key: "emailEnabled",
		title: "Email Notifications",
		description: "Get account and delivery updates by email.",
		icon: Mail,
	},
	{
		key: "smsEnabled",
		title: "SMS Notifications",
		description: "Receive urgent updates by text message.",
		icon: MessageSquare,
	},
	{
		key: "errandUpdates",
		title: "Errand Updates",
		description: "Status changes for your deliveries.",
		icon: Bike,
	},
	{
		key: "chatMessages",
		title: "Chat Messages",
		description: "Notifications for new chat messages.",
		icon: MessageSquare,
	},
	{
		key: "paymentAlerts",
		title: "Payment Alerts",
		description: "Earnings, payouts, and wallet activity.",
		icon: Bell,
	},
	{
		key: "promotions",
		title: "Promotions",
		description: "Campaigns, incentives, and rider offers.",
		icon: Gift,
	},
	{
		key: "systemAlerts",
		title: "System Alerts",
		description: "Platform notices and important service updates.",
		icon: BadgeAlert,
	},
];

export default function RiderSettingsPage() {
	const { data, isLoading } = useRiderProfile();
	const { user, logout } = useAuthStore();
	const profile = data?.data;
	const { data: prefsData, isLoading: prefsLoading } =
		useNotificationPreferences();
	const updatePrefs = useUpdateNotificationPreferences();
	const changePassword = useChangePassword();
	const prefs = prefsData?.data;
	const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
	const [passwordForm, setPasswordForm] = useState({
		currentPassword: "",
		newPassword: "",
		confirmPassword: "",
	});

	function togglePref(key: NotificationPreferenceKey, value: boolean) {
		updatePrefs.mutate(
			{ [key]: value },
			{
				onError: () => toast.error("Failed to update preference"),
				onSuccess: () => toast.success("Preference updated"),
			},
		);
	}

	async function handlePasswordChange() {
		if (!passwordForm.currentPassword || !passwordForm.newPassword) {
			toast.error("Enter your current and new password");
			return;
		}

		if (passwordForm.newPassword.length < 8) {
			toast.error("Password must be at least 8 characters");
			return;
		}

		if (passwordForm.newPassword !== passwordForm.confirmPassword) {
			toast.error("New passwords do not match");
			return;
		}

		try {
			await changePassword.mutateAsync({
				currentPassword: passwordForm.currentPassword,
				newPassword: passwordForm.newPassword,
			});
			toast.success("Password changed successfully");
			setPasswordDialogOpen(false);
			setPasswordForm({
				currentPassword: "",
				newPassword: "",
				confirmPassword: "",
			});
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to change password",
			);
		}
	}

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
			<Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Change Password</DialogTitle>
						<DialogDescription>
							Update your rider account password.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="current-password">Current Password</Label>
							<PasswordInput
								id="current-password"
								value={passwordForm.currentPassword}
								onChange={(e) =>
									setPasswordForm((current) => ({
										...current,
										currentPassword: e.target.value,
									}))
								}
								placeholder="Enter your current password"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="new-password">New Password</Label>
							<PasswordInput
								id="new-password"
								value={passwordForm.newPassword}
								onChange={(e) =>
									setPasswordForm((current) => ({
										...current,
										newPassword: e.target.value,
									}))
								}
								placeholder="Minimum 8 characters"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="confirm-password">Confirm New Password</Label>
							<PasswordInput
								id="confirm-password"
								value={passwordForm.confirmPassword}
								onChange={(e) =>
									setPasswordForm((current) => ({
										...current,
										confirmPassword: e.target.value,
									}))
								}
								placeholder="Repeat your new password"
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setPasswordDialogOpen(false)}
							disabled={changePassword.isPending}>
							Cancel
						</Button>
						<Button
							onClick={handlePasswordChange}
							disabled={changePassword.isPending}>
							{changePassword.isPending && (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							)}
							Update Password
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

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
					{prefsLoading ? (
						<div className="space-y-3">
							{[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
								<Skeleton key={i} className="h-10" />
							))}
						</div>
					) : (
						<>
							{notificationOptions.map((option, index) => {
								const Icon = option.icon;
								return (
									<div key={option.key}>
										<div className="flex items-center justify-between gap-4">
											<div className="flex items-start gap-3">
												<div className="rounded-lg bg-muted p-2">
													<Icon className="h-4 w-4 text-muted-foreground" />
												</div>
												<div>
													<p className="text-sm font-medium">{option.title}</p>
													<p className="text-xs text-muted-foreground">
														{option.description}
													</p>
												</div>
											</div>
											<Switch
												checked={prefs?.[option.key] ?? true}
												disabled={updatePrefs.isPending}
												onCheckedChange={(value) =>
													togglePref(option.key, value)
												}
											/>
										</div>
										{index < notificationOptions.length - 1 && (
											<Separator className="mt-4" />
										)}
									</div>
								);
							})}
						</>
					)}
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
						<Button
							variant="outline"
							size="sm"
							onClick={() => setPasswordDialogOpen(true)}>
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
