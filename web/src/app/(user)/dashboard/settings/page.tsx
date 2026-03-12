"use client";

import { useState } from "react";
import {
	User,
	Shield,
	Bell,
	Smartphone,
	Mail,
	Eye,
	EyeOff,
	Loader2,
	Camera,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCurrentUser, useUpdateProfile } from "@/lib/hooks";
import { toast } from "sonner";

export default function SettingsPage() {
	const { data: userData, isLoading } = useCurrentUser();
	const updateProfile = useUpdateProfile();
	const user = userData?.data;

	const [profileForm, setProfileForm] = useState({
		firstName: "",
		lastName: "",
		email: "",
		phoneNumber: "",
	});
	const [initialized, setInitialized] = useState(false);

	// Initialize form with user data once
	if (user && !initialized) {
		setProfileForm({
			firstName: user.firstName ?? "",
			lastName: user.lastName ?? "",
			email: user.email ?? "",
			phoneNumber: user.phoneNumber ?? "",
		});
		setInitialized(true);
	}

	const [passwordForm, setPasswordForm] = useState({
		currentPassword: "",
		newPassword: "",
		confirmPassword: "",
	});
	const [showPasswords, setShowPasswords] = useState(false);

	const [notifications, setNotifications] = useState({
		pushEnabled: true,
		emailEnabled: true,
		smsEnabled: false,
		errandUpdates: true,
		promotions: false,
	});

	async function handleProfileSave() {
		try {
			await updateProfile.mutateAsync(profileForm);
			toast.success("Profile updated");
		} catch {
			toast.error("Failed to update profile");
		}
	}

	function handlePasswordChange() {
		if (passwordForm.newPassword !== passwordForm.confirmPassword) {
			toast.error("Passwords do not match");
			return;
		}
		if (passwordForm.newPassword.length < 8) {
			toast.error("Password must be at least 8 characters");
			return;
		}
		// TODO: Call change password endpoint
		toast.success("Password changed");
		setPasswordForm({
			currentPassword: "",
			newPassword: "",
			confirmPassword: "",
		});
	}

	if (isLoading) {
		return (
			<div className="space-y-6">
				<Skeleton className="h-8 w-40" />
				<Skeleton className="h-64 rounded-xl" />
				<Skeleton className="h-48 rounded-xl" />
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold">Settings</h1>
				<p className="text-sm text-muted-foreground">
					Manage your profile and preferences
				</p>
			</div>

			{/* Profile Section */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-base">
						<User className="h-4 w-4" />
						Profile Information
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					{/* Avatar */}
					<div className="flex items-center gap-4">
						<div className="relative">
							<Avatar className="h-16 w-16">
								<AvatarImage
									src={user?.profileImageUrl ?? undefined}
									alt={user?.firstName ?? ""}
								/>
								<AvatarFallback className="text-lg">
									{user?.firstName?.[0]}
									{user?.lastName?.[0]}
								</AvatarFallback>
							</Avatar>
							<Button
								size="icon"
								variant="secondary"
								className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full">
								<Camera className="h-3 w-3" />
							</Button>
						</div>
						<div>
							<p className="font-medium">
								{user?.firstName} {user?.lastName}
							</p>
							<p className="text-sm text-muted-foreground">{user?.email}</p>
						</div>
					</div>

					<Separator />

					{/* Profile Form */}
					<div className="grid gap-4 sm:grid-cols-2">
						<div className="space-y-2">
							<Label>First Name</Label>
							<Input
								value={profileForm.firstName}
								onChange={(e) =>
									setProfileForm((p) => ({ ...p, firstName: e.target.value }))
								}
							/>
						</div>
						<div className="space-y-2">
							<Label>Last Name</Label>
							<Input
								value={profileForm.lastName}
								onChange={(e) =>
									setProfileForm((p) => ({ ...p, lastName: e.target.value }))
								}
							/>
						</div>
						<div className="space-y-2">
							<Label>Email</Label>
							<div className="relative">
								<Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
								<Input
									value={profileForm.email}
									onChange={(e) =>
										setProfileForm((p) => ({ ...p, email: e.target.value }))
									}
									className="pl-9"
								/>
							</div>
						</div>
						<div className="space-y-2">
							<Label>Phone</Label>
							<div className="relative">
								<Smartphone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
								<Input
									value={profileForm.phoneNumber}
									onChange={(e) =>
										setProfileForm((p) => ({
											...p,
											phoneNumber: e.target.value,
										}))
									}
									className="pl-9"
								/>
							</div>
						</div>
					</div>

					<Button
						onClick={handleProfileSave}
						disabled={updateProfile.isPending}
						className="gap-2">
						{updateProfile.isPending && (
							<Loader2 className="h-4 w-4 animate-spin" />
						)}
						Save Changes
					</Button>
				</CardContent>
			</Card>

			{/* Security Section */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-base">
						<Shield className="h-4 w-4" />
						Security
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<Label>Current Password</Label>
						<div className="relative">
							<Input
								type={showPasswords ? "text" : "password"}
								value={passwordForm.currentPassword}
								onChange={(e) =>
									setPasswordForm((p) => ({
										...p,
										currentPassword: e.target.value,
									}))
								}
								placeholder="Enter current password"
							/>
							<Button
								type="button"
								variant="ghost"
								size="icon"
								className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2"
								onClick={() => setShowPasswords(!showPasswords)}>
								{showPasswords ? (
									<EyeOff className="h-4 w-4" />
								) : (
									<Eye className="h-4 w-4" />
								)}
							</Button>
						</div>
					</div>
					<div className="grid gap-4 sm:grid-cols-2">
						<div className="space-y-2">
							<Label>New Password</Label>
							<Input
								type={showPasswords ? "text" : "password"}
								value={passwordForm.newPassword}
								onChange={(e) =>
									setPasswordForm((p) => ({
										...p,
										newPassword: e.target.value,
									}))
								}
								placeholder="Min. 8 characters"
							/>
						</div>
						<div className="space-y-2">
							<Label>Confirm Password</Label>
							<Input
								type={showPasswords ? "text" : "password"}
								value={passwordForm.confirmPassword}
								onChange={(e) =>
									setPasswordForm((p) => ({
										...p,
										confirmPassword: e.target.value,
									}))
								}
								placeholder="Repeat new password"
							/>
						</div>
					</div>
					<Button
						variant="outline"
						onClick={handlePasswordChange}
						disabled={
							!passwordForm.currentPassword || !passwordForm.newPassword
						}>
						Change Password
					</Button>
				</CardContent>
			</Card>

			{/* Notification Preferences */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-base">
						<Bell className="h-4 w-4" />
						Notification Preferences
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-sm font-medium">Push Notifications</p>
							<p className="text-xs text-muted-foreground">
								Receive push notifications on your device
							</p>
						</div>
						<Switch
							checked={notifications.pushEnabled}
							onCheckedChange={(v) =>
								setNotifications((n) => ({ ...n, pushEnabled: v }))
							}
						/>
					</div>
					<Separator />
					<div className="flex items-center justify-between">
						<div>
							<p className="text-sm font-medium">Email Notifications</p>
							<p className="text-xs text-muted-foreground">
								Receive email updates about your errands
							</p>
						</div>
						<Switch
							checked={notifications.emailEnabled}
							onCheckedChange={(v) =>
								setNotifications((n) => ({ ...n, emailEnabled: v }))
							}
						/>
					</div>
					<Separator />
					<div className="flex items-center justify-between">
						<div>
							<p className="text-sm font-medium">SMS Notifications</p>
							<p className="text-xs text-muted-foreground">
								Get SMS for important updates like delivery
							</p>
						</div>
						<Switch
							checked={notifications.smsEnabled}
							onCheckedChange={(v) =>
								setNotifications((n) => ({ ...n, smsEnabled: v }))
							}
						/>
					</div>
					<Separator />
					<div className="flex items-center justify-between">
						<div>
							<p className="text-sm font-medium">Errand Updates</p>
							<p className="text-xs text-muted-foreground">
								Status changes and rider assignment
							</p>
						</div>
						<Switch
							checked={notifications.errandUpdates}
							onCheckedChange={(v) =>
								setNotifications((n) => ({ ...n, errandUpdates: v }))
							}
						/>
					</div>
					<Separator />
					<div className="flex items-center justify-between">
						<div>
							<p className="text-sm font-medium">Promotions</p>
							<p className="text-xs text-muted-foreground">
								Deals, discounts and special offers
							</p>
						</div>
						<Switch
							checked={notifications.promotions}
							onCheckedChange={(v) =>
								setNotifications((n) => ({ ...n, promotions: v }))
							}
						/>
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
				<CardContent>
					<p className="text-sm text-muted-foreground">
						Once you delete your account, there is no going back.
					</p>
					<Button variant="destructive" className="mt-3" size="sm">
						Delete Account
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}
