"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
	LayoutDashboard,
	PlusCircle,
	Package,
	Wallet,
	MapPin,
	Star,
	Bell,
	Settings,
	LogOut,
	Menu,
	X,
	ShoppingBag,
	ChevronRight,
	User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useUnreadNotificationCount } from "@/lib/hooks";
import { UserRole } from "@/types";

const NAV_ITEMS = [
	{ href: "/errands/new", label: "Request Errand", icon: PlusCircle },
	{ href: "/dashboard", label: "Overview", icon: LayoutDashboard },
	{ href: "/dashboard/errands", label: "My Errands", icon: Package },
	{ href: "/dashboard/wallet", label: "Wallet", icon: Wallet },
	{ href: "/dashboard/addresses", label: "Addresses", icon: MapPin },
	{ href: "/dashboard/reviews", label: "My Reviews", icon: Star },
	{ href: "/dashboard/notifications", label: "Notifications", icon: Bell },
	{ href: "/dashboard/settings", label: "Settings", icon: Settings },
] as const;

function NavContent({
	pathname,
	onClose,
}: {
	pathname: string;
	onClose?: () => void;
}) {
	const { user, logout } = useAuthStore();
	const { data: unreadData } = useUnreadNotificationCount();
	const unreadCount = unreadData?.data?.count ?? 0;
	const router = useRouter();

	return (
		<div className="flex h-full flex-col">
			{/* User info */}
			<div className="p-4">
				<div className="flex items-center gap-3">
					<Avatar className="h-10 w-10">
						<AvatarImage src={user?.profileImageUrl ?? undefined} />
						<AvatarFallback className="bg-primary/10 text-primary font-semibold">
							{user?.firstName?.[0]}
							{user?.lastName?.[0]}
						</AvatarFallback>
					</Avatar>
					<div className="min-w-0 flex-1">
						<p className="truncate text-sm font-semibold">
							{user?.firstName} {user?.lastName}
						</p>
						<p className="truncate text-xs text-muted-foreground">
							{user?.email}
						</p>
					</div>
				</div>
			</div>

			<Separator />

			{/* Nav items */}
			<nav className="flex-1 space-y-1 p-3">
				{NAV_ITEMS.map((item) => {
					const isActive =
						item.href === "/dashboard"
							? pathname === "/dashboard"
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
							{item.label === "Notifications" && unreadCount > 0 && (
								<Badge className="ml-auto h-5 min-w-5 rounded-full px-1.5 text-[10px]">
									{unreadCount > 99 ? "99+" : unreadCount}
								</Badge>
							)}
						</Link>
					);
				})}
			</nav>

			<Separator />

			{/* Shop CTA + Role Switching + Logout */}
			<div className="space-y-1 p-3">
				<Link
					href="/shop"
					onClick={onClose}
					className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
					<ShoppingBag className="h-4 w-4" />
					Go to Shop
					<ChevronRight className="ml-auto h-3.5 w-3.5" />
				</Link>

				<button
					onClick={() => {
						logout();
						router.push("/login");
					}}
					className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10">
					<LogOut className="h-4 w-4" />
					Sign Out
				</button>
			</div>
		</div>
	);
}

export default function UserDashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const pathname = usePathname();
	const router = useRouter();
	const { isAuthenticated, isHydrated, hydrate } = useAuthStore();
	const [mobileOpen, setMobileOpen] = useState(false);

	useEffect(() => {
		hydrate();
	}, []);

	useEffect(() => {
		if (isHydrated && !isAuthenticated) {
			router.push("/login?redirect=" + encodeURIComponent(pathname));
		}
	}, [isHydrated, isAuthenticated]);

	if (!isHydrated || !isAuthenticated) {
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
					{/* Logo */}
					<div className="flex h-14 items-center gap-2 border-b px-4">
						<Link href="/" className="flex items-center gap-2">
							<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-bold text-white text-sm">
								R
							</div>
							<span className="text-lg font-bold">RunAm</span>
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
							</div>
							<NavContent
								pathname={pathname}
								onClose={() => setMobileOpen(false)}
							/>
						</SheetContent>
					</Sheet>
					<h1 className="truncate text-base font-semibold">
						{NAV_ITEMS.find((n) =>
							n.href === "/dashboard"
								? pathname === "/dashboard"
								: pathname.startsWith(n.href),
						)?.label ?? "Dashboard"}
					</h1>
				</header>

				{/* Page content */}
				<main className="flex-1 p-4 md:p-6">{children}</main>
			</div>
		</div>
	);
}
