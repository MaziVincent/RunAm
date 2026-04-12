"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
	LayoutDashboard,
	ShoppingBag,
	Package,
	FolderOpen,
	BarChart3,
	Star,
	Banknote,
	Bell,
	Settings,
	LogOut,
	Menu,
	Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useMyVendor } from "@/lib/hooks";
import { UserRole, VendorStatus } from "@/types";

const NAV_ITEMS = [
	{ href: "/vendor", label: "Dashboard", icon: LayoutDashboard },
	{ href: "/vendor/orders", label: "Orders", icon: ShoppingBag },
	{ href: "/vendor/products", label: "Products", icon: Package },
	{ href: "/vendor/categories", label: "Categories", icon: FolderOpen },
	{ href: "/vendor/store", label: "Store Profile", icon: Store },
	{ href: "/vendor/analytics", label: "Analytics", icon: BarChart3 },
	{ href: "/vendor/reviews", label: "Reviews", icon: Star },
	{ href: "/vendor/payouts", label: "Payouts", icon: Banknote },
	{ href: "/vendor/notifications", label: "Notifications", icon: Bell },
	{ href: "/vendor/settings", label: "Settings", icon: Settings },
] as const;

function NavContent({
	pathname,
	onClose,
}: {
	pathname: string;
	onClose?: () => void;
}) {
	const { user, logout } = useAuthStore();
	const { data: vendorData } = useMyVendor();
	const vendor = vendorData?.data;
	const router = useRouter();

	return (
		<div className="flex h-full flex-col">
			{/* Vendor info */}
			<div className="p-4">
				<div className="flex items-center gap-3">
					<Avatar className="h-10 w-10">
						<AvatarImage src={vendor?.logoUrl ?? undefined} />
						<AvatarFallback className="bg-primary/10 text-primary font-semibold">
							<Store className="h-4 w-4" />
						</AvatarFallback>
					</Avatar>
					<div className="min-w-0 flex-1">
						<p className="truncate text-sm font-semibold">
							{vendor?.businessName ?? "My Store"}
						</p>
						<div className="flex items-center gap-1.5">
							<div
								className={cn(
									"h-2 w-2 rounded-full",
									vendor?.isOpen ? "bg-green-500" : "bg-muted-foreground",
								)}
							/>
							<span className="text-xs text-muted-foreground">
								{vendor?.isOpen ? "Open" : "Closed"}
							</span>
						</div>
					</div>
				</div>
			</div>

			<Separator />

			{/* Nav items */}
			<nav className="flex-1 space-y-1 overflow-y-auto p-3">
				{NAV_ITEMS.map((item) => {
					const isActive =
						item.href === "/vendor"
							? pathname === "/vendor"
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
						router.push("/login?role=vendor");
					}}
					className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10">
					<LogOut className="h-4 w-4" />
					Sign Out
				</button>
			</div>
		</div>
	);
}

export default function VendorDashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const pathname = usePathname();
	const router = useRouter();
	const { isAuthenticated, isHydrated, hydrate, user } = useAuthStore();
	const { data: vendorData, isLoading: vendorLoading } = useMyVendor();
	const vendor = vendorData?.success ? vendorData.data : undefined;
	const vendorProfileMissing =
		vendorData?.success === false && vendorData.error?.code === "NOT_FOUND";
	const [mobileOpen, setMobileOpen] = useState(false);

	const isOnboarding = pathname === "/vendor/onboarding";

	useEffect(() => {
		hydrate();
	}, []);

	useEffect(() => {
		if (isHydrated && !isAuthenticated) {
			router.push(
				"/login?role=vendor&redirect=" + encodeURIComponent(pathname),
			);
		}
	}, [isHydrated, isAuthenticated]);

	useEffect(() => {
		if (
			isHydrated &&
			isAuthenticated &&
			user &&
			user.role !== UserRole.Merchant
		) {
			router.push("/dashboard");
		}
	}, [isHydrated, isAuthenticated, user]);

	// Redirect to onboarding if no vendor profile (but not if already there)
	useEffect(() => {
		if (
			isHydrated &&
			isAuthenticated &&
			!vendorLoading &&
			vendor &&
			isOnboarding
		) {
			router.replace("/vendor");
		}
	}, [isHydrated, isAuthenticated, vendorLoading, vendor, isOnboarding]);

	useEffect(() => {
		if (
			isHydrated &&
			isAuthenticated &&
			!vendorLoading &&
			vendorProfileMissing &&
			!isOnboarding
		) {
			router.replace("/vendor/onboarding");
		}
	}, [
		isHydrated,
		isAuthenticated,
		vendorLoading,
		vendorProfileMissing,
		isOnboarding,
	]);

	const isPendingVendor = vendor && vendor.status !== VendorStatus.Active;

	// If vendor is pending/suspended, only allow the main dashboard page
	useEffect(() => {
		if (
			isHydrated &&
			isPendingVendor &&
			pathname !== "/vendor" &&
			!isOnboarding
		) {
			router.replace("/vendor");
		}
	}, [isHydrated, isPendingVendor, pathname, isOnboarding]);

	if (!isHydrated || !isAuthenticated) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
			</div>
		);
	}

	// Show a minimal layout for onboarding (no sidebar)
	if (isOnboarding) {
		return (
			<div className="min-h-screen bg-muted/30">
				<header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background px-4">
					<Link href="/" className="flex items-center gap-2">
						<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-bold text-white text-sm">
							R
						</div>
						<span className="text-lg font-bold">RunAm</span>
						<Badge variant="secondary" className="text-[10px]">
							Vendor
						</Badge>
					</Link>
				</header>
				<main className="mx-auto max-w-3xl p-4 md:p-6">{children}</main>
			</div>
		);
	}

	// Show minimal layout for pending/suspended vendors (no sidebar)
	if (isPendingVendor) {
		return (
			<div className="min-h-screen bg-muted/30">
				<header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background px-4">
					<Link href="/vendor" className="flex items-center gap-2">
						<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-bold text-white text-sm">
							R
						</div>
						<span className="text-lg font-bold">RunAm</span>
						<Badge variant="secondary" className="text-[10px]">
							Vendor
						</Badge>
					</Link>
				</header>
				<main className="mx-auto max-w-3xl p-4 md:p-6">{children}</main>
			</div>
		);
	}

	// Still loading vendor profile
	if (vendorLoading) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
			</div>
		);
	}

	return (
		<div className="flex min-h-screen bg-muted/30">
			{/* Desktop Sidebar */}
			<aside className="hidden w-64 shrink-0 border-r bg-background lg:block">
				<div className="sticky top-0 flex h-screen flex-col">
					<div className="flex h-14 items-center gap-2 border-b px-4">
						<Link href="/vendor" className="flex items-center gap-2">
							<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-bold text-white text-sm">
								R
							</div>
							<span className="text-lg font-bold">RunAm</span>
							<Badge variant="secondary" className="text-[10px]">
								Vendor
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
									Vendor
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
							n.href === "/vendor"
								? pathname === "/vendor"
								: pathname.startsWith(n.href),
						)?.label ?? "Vendor"}
					</h1>
				</header>

				{/* Page content */}
				<main className="flex-1 p-4 md:p-6">{children}</main>
			</div>
		</div>
	);
}
