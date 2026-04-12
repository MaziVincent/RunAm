"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
	LayoutDashboard,
	Users,
	Bike,
	Store,
	Tags,
	Package,
	DollarSign,
	BarChart3,
	Settings,
	LogOut,
	Menu,
	X,
	MapPin,
	Star,
	Tag,
	Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/stores/auth-store";
import { UserRole } from "@/types";

const navItems = [
	{ label: "Dashboard", href: "/admin", icon: LayoutDashboard },
	{ label: "Users", href: "/admin/users", icon: Users },
	{ label: "Riders", href: "/admin/riders", icon: Bike },
	{ label: "Vendors", href: "/admin/vendors", icon: Store },
	{ label: "Categories", href: "/admin/service-categories", icon: Tags },
	{ label: "Errands", href: "/admin/errands", icon: Package },
	{ label: "Tracking", href: "/admin/tracking", icon: MapPin },
	{ label: "Finance", href: "/admin/finance", icon: DollarSign },
	{ label: "Promo Codes", href: "/admin/promo-codes", icon: Tag },
	{ label: "Payouts", href: "/admin/payouts", icon: Wallet },
	{ label: "Reviews", href: "/admin/reviews", icon: Star },
	{ label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
	{ label: "Settings", href: "/admin/settings", icon: Settings },
];

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const pathname = usePathname();
	const router = useRouter();
	const { user, isAuthenticated, isHydrated, hydrate, logout } =
		useAuthStore();
	const [sidebarOpen, setSidebarOpen] = useState(false);

	useEffect(() => {
		hydrate();
	}, [hydrate]);

	useEffect(() => {
		if (!isHydrated) return;
		if (!isAuthenticated) {
			router.push("/login");
			return;
		}
		// Role check: only Admin and SupportAgent
		if (
			user &&
			user.role !== UserRole.Admin &&
			user.role !== UserRole.SupportAgent
		) {
			router.push("/dashboard");
		}
	}, [isHydrated, isAuthenticated, user, router]);

	if (!isHydrated || !isAuthenticated) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
			</div>
		);
	}

	const handleLogout = () => {
		logout();
		router.push("/login");
	};

	return (
		<div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
			{/* Mobile overlay */}
			{sidebarOpen && (
				<div
					className="fixed inset-0 z-40 bg-black/50 lg:hidden"
					onClick={() => setSidebarOpen(false)}
				/>
			)}

			{/* Sidebar */}
			<aside
				className={cn(
					"fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200 dark:border-slate-800 dark:bg-slate-900 lg:static lg:translate-x-0",
					sidebarOpen ? "translate-x-0" : "-translate-x-full",
				)}>
				{/* Logo */}
				<div className="flex h-16 items-center justify-between border-b border-slate-200 px-6 dark:border-slate-800">
					<Link
						href="/admin"
						className="text-xl font-bold text-slate-900 dark:text-white">
						Run<span className="text-primary">Am</span>
					</Link>
					<button
						onClick={() => setSidebarOpen(false)}
						className="lg:hidden text-slate-500">
						<X className="h-5 w-5" />
					</button>
				</div>

				{/* Nav */}
				<nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
					{navItems.map((item) => {
						const isActive =
							item.href === "/admin"
								? pathname === "/admin"
								: pathname.startsWith(item.href);
						return (
							<Link
								key={item.href}
								href={item.href}
								onClick={() => setSidebarOpen(false)}
								className={cn(
									"flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
									isActive
										? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary"
										: "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white",
								)}>
								<item.icon className="h-5 w-5 shrink-0" />
								{item.label}
							</Link>
						);
					})}
				</nav>

				{/* User section */}
				<div className="border-t border-slate-200 p-4 dark:border-slate-800">
					<div className="flex items-center gap-3">
						<div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
							{user?.firstName?.[0]}
							{user?.lastName?.[0]}
						</div>
						<div className="flex-1 overflow-hidden">
							<p className="truncate text-sm font-medium text-slate-900 dark:text-white">
								{user?.firstName} {user?.lastName}
							</p>
							<p className="truncate text-xs text-slate-500">{user?.email}</p>
						</div>
						<button
							onClick={handleLogout}
							className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
							title="Sign out">
							<LogOut className="h-4 w-4" />
						</button>
					</div>
				</div>
			</aside>

			{/* Main content */}
			<div className="flex flex-1 flex-col">
				{/* Header */}
				<header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-slate-200 bg-white/80 px-6 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/80">
					<button
						onClick={() => setSidebarOpen(true)}
						className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden dark:hover:bg-slate-800">
						<Menu className="h-5 w-5" />
					</button>
					<div className="flex-1" />
					<div className="flex items-center gap-3">
						<div className="hidden text-right sm:block">
							<p className="text-sm font-medium text-slate-900 dark:text-white">
								{user?.firstName} {user?.lastName}
							</p>
							<p className="text-xs text-slate-500">Administrator</p>
						</div>
						<div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
							{user?.firstName?.[0]}
							{user?.lastName?.[0]}
						</div>
					</div>
				</header>

				{/* Page content */}
				<main className="flex-1 p-6">{children}</main>
			</div>
		</div>
	);
}
