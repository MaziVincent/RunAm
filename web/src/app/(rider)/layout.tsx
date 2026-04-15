"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
	LayoutDashboard,
	Truck,
	DollarSign,
	TrendingUp,
	Wallet,
	Bell,
	Settings,
	LogOut,
	Menu,
	Bike,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useRiderProfile, useUpdateRiderStatus } from "@/lib/hooks";
import { UserRole, ApprovalStatus } from "@/types";

const NAV_ITEMS = [
	{ href: "/rider", label: "Dashboard", icon: LayoutDashboard },
	{ href: "/rider/tasks", label: "Tasks", icon: Truck },
	{ href: "/rider/earnings", label: "Earnings", icon: DollarSign },
	{ href: "/rider/performance", label: "Performance", icon: TrendingUp },
	{ href: "/rider/wallet", label: "Wallet", icon: Wallet },
	{ href: "/rider/notifications", label: "Notifications", icon: Bell },
	{ href: "/rider/settings", label: "Settings", icon: Settings },
] as const;

function OnlineToggle() {
	const { data: profileData } = useRiderProfile();
	const profile = profileData?.data;
	const updateStatus = useUpdateRiderStatus();

	if (!profile) return null;

	return (
		<div className="flex items-center gap-2 rounded-lg border px-3 py-2">
			<div
				className={cn(
					"h-2 w-2 rounded-full",
					profile.isOnline ? "bg-green-500" : "bg-muted-foreground",
				)}
			/>
			<span className="text-xs font-medium">
				{profile.isOnline ? "Online" : "Offline"}
			</span>
			<Switch
				checked={profile.isOnline}
				onCheckedChange={(checked) => updateStatus.mutate(checked)}
				className="ml-auto scale-75"
			/>
		</div>
	);
}

function NavContent({
	pathname,
	onClose,
}: {
	pathname: string;
	onClose?: () => void;
}) {
	const { user, logout } = useAuthStore();
	const router = useRouter();

	return (
		<div className="flex h-full flex-col">
			{/* Rider info */}
			<div className="p-4">
				<div className="flex items-center gap-3">
					<Avatar className="h-10 w-10">
						<AvatarFallback className="bg-primary/10 text-primary font-semibold">
							<Bike className="h-4 w-4" />
						</AvatarFallback>
					</Avatar>
					<div className="min-w-0 flex-1">
						<p className="truncate text-sm font-semibold">
							{user?.firstName} {user?.lastName}
						</p>
						<p className="text-xs text-muted-foreground">Rider</p>
					</div>
				</div>
				<div className="mt-3">
					<OnlineToggle />
				</div>
			</div>

			<Separator />

			{/* Nav items */}
			<nav className="flex-1 space-y-1 overflow-y-auto p-3">
				{NAV_ITEMS.map((item) => {
					const isActive =
						item.href === "/rider"
							? pathname === "/rider"
							: pathname.startsWith(item.href);
					return (
						<Link
							key={item.href}
							href={item.href}
							onClick={onClose}
							className={cn(
								"flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
								isActive
									? "bg-primary/10 text-primary"
									: "text-muted-foreground hover:bg-accent hover:text-foreground",
							)}>
							<item.icon className="h-4 w-4" />
							{item.label}
						</Link>
					);
				})}
			</nav>

			<Separator />

			{/* Bottom actions */}
			<div className="space-y-1 p-3">
				<button
					onClick={() => {
						logout();
						router.push("/login?role=rider");
					}}
					className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10">
					<LogOut className="h-4 w-4" />
					Sign Out
				</button>
			</div>
		</div>
	);
}

export default function RiderDashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const pathname = usePathname();
	const router = useRouter();
	const { isAuthenticated, isHydrated, hydrate, user } = useAuthStore();
	const [mobileOpen, setMobileOpen] = useState(false);
	const { data: profileData, isLoading: profileLoading } = useRiderProfile();
	const profile = profileData?.data;

	useEffect(() => {
		hydrate();
	}, []);

	useEffect(() => {
		if (isHydrated && !isAuthenticated) {
			router.push("/login?role=rider&redirect=" + encodeURIComponent(pathname));
		}
	}, [isHydrated, isAuthenticated]);

	useEffect(() => {
		if (isHydrated && isAuthenticated && user && user.role !== UserRole.Rider) {
			router.push("/dashboard");
		}
	}, [isHydrated, isAuthenticated, user]);

	// Restrict sub-pages unless profile is approved (allow /rider and /rider/onboarding)
	const isOnboarding = pathname === "/rider/onboarding";
	const isDashboardRoot = pathname === "/rider";
	const isRestrictedSubpage = !isOnboarding && !isDashboardRoot;
	useEffect(() => {
		if (
			isHydrated &&
			isAuthenticated &&
			!profileLoading &&
			isRestrictedSubpage &&
			(!profile || profile.approvalStatus !== ApprovalStatus.Approved)
		) {
			router.replace("/rider");
		}
	}, [
		isHydrated,
		isAuthenticated,
		profileLoading,
		isRestrictedSubpage,
		profile,
		router,
	]);

	if (!isHydrated || !isAuthenticated) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
			</div>
		);
	}

	if (isRestrictedSubpage && profileLoading) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
			</div>
		);
	}

	// Onboarding: no sidebar, minimal header
	if (isOnboarding) {
		return (
			<div className="min-h-screen bg-muted/30">
				<header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background px-4">
					<Link href="/rider" className="flex items-center gap-2">
						<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-bold text-white text-sm">
							R
						</div>
						<span className="text-lg font-bold">RunAm</span>
						<Badge variant="secondary" className="text-[10px]">
							Rider
						</Badge>
					</Link>
				</header>
				<main className="flex-1 p-4 md:p-6">{children}</main>
			</div>
		);
	}

	return (
		<div className="flex min-h-screen bg-muted/30">
			{/* Desktop Sidebar */}
			<aside className="hidden w-64 shrink-0 border-r bg-background lg:block">
				<div className="sticky top-0 flex h-screen flex-col">
					<div className="flex h-14 items-center gap-2 border-b px-4">
						<Link href="/rider" className="flex items-center gap-2">
							<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-bold text-white text-sm">
								R
							</div>
							<span className="text-lg font-bold">RunAm</span>
							<Badge variant="secondary" className="text-[10px]">
								Rider
							</Badge>
						</Link>
					</div>
					<NavContent pathname={pathname} />
				</div>
			</aside>

			{/* Main content */}
			<div className="flex flex-1 flex-col">
				{/* Mobile header */}
				<header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background px-4 lg:hidden">
					<Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
						<SheetTrigger asChild>
							<Button variant="ghost" size="icon">
								<Menu className="h-5 w-5" />
								<span className="sr-only">Menu</span>
							</Button>
						</SheetTrigger>
						<SheetContent side="left" className="w-72 p-0">
							<div className="flex h-14 items-center gap-2 border-b px-4">
								<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-bold text-white text-sm">
									R
								</div>
								<span className="text-lg font-bold">RunAm</span>
								<Badge variant="secondary" className="text-[10px]">
									Rider
								</Badge>
							</div>
							<NavContent
								pathname={pathname}
								onClose={() => setMobileOpen(false)}
							/>
						</SheetContent>
					</Sheet>
					<h1 className="truncate text-base font-semibold">
						{NAV_ITEMS.find((n) =>
							n.href === "/rider"
								? pathname === "/rider"
								: pathname.startsWith(n.href),
						)?.label ?? "Rider"}
					</h1>
				</header>

				{/* Page content */}
				<main className="flex-1 p-4 md:p-6">{children}</main>
			</div>
		</div>
	);
}
