"use client";

import Link from "next/link";
import {
	Package,
	Wallet,
	MapPin,
	Plus,
	ArrowRight,
	ShoppingBag,
	TrendingUp,
	Clock,
	FileText,
	Truck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useMyErrands, useWallet, useCurrentUser } from "@/lib/hooks";
import {
	formatCurrency,
	errandStatusLabel,
	errandStatusColor,
	errandCategoryLabel,
} from "@/lib/utils";
import { ErrandStatus } from "@/types";

/* ------------------------------------------------------------------ */
/*  Stats Cards                                                       */
/* ------------------------------------------------------------------ */
function StatsCards() {
	const { data: walletData, isLoading: walletLoading } = useWallet();
	const { data: activeData, isLoading: activeLoading } = useMyErrands({
		status: "active",
		pageSize: 1,
	});
	const { data: allData, isLoading: allLoading } = useMyErrands({
		pageSize: 1,
	});

	const walletBalance = walletData?.data?.balance ?? 0;
	const activeCount = activeData?.meta?.totalCount ?? 0;
	const totalCount = allData?.meta?.totalCount ?? 0;

	const stats = [
		{
			label: "Active Errands",
			value: activeCount,
			icon: Clock,
			color: "text-blue-500",
			bg: "bg-blue-50 dark:bg-blue-950/50",
			href: "/dashboard/errands?status=active",
		},
		{
			label: "Wallet Balance",
			value: formatCurrency(walletBalance),
			icon: Wallet,
			color: "text-primary",
			bg: "bg-primary/5",
			href: "/dashboard/wallet",
		},
		{
			label: "Total Errands",
			value: totalCount,
			icon: Package,
			color: "text-purple-500",
			bg: "bg-purple-50 dark:bg-purple-950/50",
			href: "/dashboard/errands",
		},
	];

	const isLoading = walletLoading || activeLoading || allLoading;

	return (
		<div className="grid gap-4 sm:grid-cols-3">
			{stats.map((stat) => (
				<Link key={stat.label} href={stat.href}>
					<Card className="transition-shadow hover:shadow-md">
						<CardContent className="flex items-center gap-4 p-4">
							<div
								className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${stat.bg}`}>
								<stat.icon className={`h-6 w-6 ${stat.color}`} />
							</div>
							<div>
								<p className="text-xs text-muted-foreground">{stat.label}</p>
								{isLoading ? (
									<Skeleton className="mt-1 h-6 w-16" />
								) : (
									<p className="text-xl font-bold">{stat.value}</p>
								)}
							</div>
						</CardContent>
					</Card>
				</Link>
			))}
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  Active Errands Widget                                             */
/* ------------------------------------------------------------------ */
function ActiveErrands() {
	const { data, isLoading } = useMyErrands({ status: "active", pageSize: 5 });
	const errands = data?.data ?? [];

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between pb-3">
				<CardTitle className="text-base">Active Errands</CardTitle>
				<Button variant="ghost" size="sm" asChild>
					<Link
						href="/dashboard/errands?status=active"
						className="gap-1 text-xs">
						View all <ArrowRight className="h-3 w-3" />
					</Link>
				</Button>
			</CardHeader>
			<CardContent>
				{isLoading ? (
					<div className="space-y-3">
						{[1, 2].map((i) => (
							<Skeleton key={i} className="h-20 rounded-lg" />
						))}
					</div>
				) : errands.length === 0 ? (
					<div className="flex flex-col items-center py-8 text-center">
						<Package className="h-10 w-10 text-muted-foreground/30" />
						<p className="mt-2 text-sm text-muted-foreground">
							No active errands
						</p>
					</div>
				) : (
					<div className="space-y-3">
						{errands.map((errand) => (
							<Link
								key={errand.id}
								href={`/dashboard/errands/${errand.id}`}
								className="flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-accent">
								<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
									<Truck className="h-5 w-5 text-primary" />
								</div>
								<div className="min-w-0 flex-1">
									<div className="flex items-center gap-2">
										<p className="truncate text-sm font-semibold">
											{errand.vendorName
												? `Order from ${errand.vendorName}`
												: (errandCategoryLabel[errand.category] ?? "Errand")}
										</p>
										<Badge
											className={`${errandStatusColor[errand.status]} shrink-0 text-[10px]`}>
											{errandStatusLabel[errand.status]}
										</Badge>
									</div>
									<p className="mt-0.5 truncate text-xs text-muted-foreground">
										{errand.dropoffAddress}
									</p>
									{errand.riderName && (
										<p className="mt-0.5 text-xs text-muted-foreground">
											Rider: {errand.riderName}
										</p>
									)}
								</div>
								<span className="shrink-0 text-sm font-semibold">
									{formatCurrency(errand.totalAmount)}
								</span>
							</Link>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	);
}

/* ------------------------------------------------------------------ */
/*  Quick Actions                                                     */
/* ------------------------------------------------------------------ */
function QuickActions() {
	const actions = [
		{
			label: "Send Package",
			icon: Package,
			href: "/errands/new?category=package",
			color: "bg-blue-50 dark:bg-blue-950/50",
			iconColor: "text-blue-500",
		},
		{
			label: "Order Food",
			icon: ShoppingBag,
			href: "/shop/categories/food",
			color: "bg-orange-50 dark:bg-orange-950/50",
			iconColor: "text-orange-500",
		},
		{
			label: "Go Shopping",
			icon: ShoppingBag,
			href: "/shop",
			color: "bg-green-50 dark:bg-green-950/50",
			iconColor: "text-green-500",
		},
		{
			label: "Send Document",
			icon: FileText,
			href: "/errands/new?category=document",
			color: "bg-purple-50 dark:bg-purple-950/50",
			iconColor: "text-purple-500",
		},
	];

	return (
		<Card>
			<CardHeader className="pb-3">
				<CardTitle className="text-base">Quick Actions</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
					{actions.map((action) => (
						<Link key={action.label} href={action.href}>
							<div className="flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all hover:shadow-md hover:-translate-y-0.5">
								<div
									className={`flex h-12 w-12 items-center justify-center rounded-xl ${action.color}`}>
									<action.icon className={`h-6 w-6 ${action.iconColor}`} />
								</div>
								<span className="text-xs font-medium">{action.label}</span>
							</div>
						</Link>
					))}
				</div>
			</CardContent>
		</Card>
	);
}

/* ------------------------------------------------------------------ */
/*  Recent Orders Widget                                              */
/* ------------------------------------------------------------------ */
function RecentOrders() {
	const { data, isLoading } = useMyErrands({ pageSize: 5 });
	const errands = data?.data ?? [];

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between pb-3">
				<CardTitle className="text-base">Recent Orders</CardTitle>
				<Button variant="ghost" size="sm" asChild>
					<Link href="/dashboard/errands" className="gap-1 text-xs">
						View all <ArrowRight className="h-3 w-3" />
					</Link>
				</Button>
			</CardHeader>
			<CardContent>
				{isLoading ? (
					<div className="space-y-3">
						{[1, 2, 3].map((i) => (
							<Skeleton key={i} className="h-14 rounded-lg" />
						))}
					</div>
				) : errands.length === 0 ? (
					<div className="flex flex-col items-center py-8 text-center">
						<ShoppingBag className="h-10 w-10 text-muted-foreground/30" />
						<p className="mt-2 text-sm text-muted-foreground">No orders yet</p>
						<Button asChild variant="outline" size="sm" className="mt-3">
							<Link href="/shop">Start Shopping</Link>
						</Button>
					</div>
				) : (
					<div className="divide-y">
						{errands.map((errand) => (
							<Link
								key={errand.id}
								href={`/dashboard/errands/${errand.id}`}
								className="flex items-center justify-between py-3 hover:opacity-80 transition-opacity">
								<div className="min-w-0 flex-1">
									<p className="truncate text-sm font-medium">
										{errand.vendorName ?? errandCategoryLabel[errand.category]}
									</p>
									<p className="text-xs text-muted-foreground">
										{new Date(errand.createdAt).toLocaleDateString("en-NG", {
											month: "short",
											day: "numeric",
											hour: "2-digit",
											minute: "2-digit",
										})}
									</p>
								</div>
								<div className="ml-4 text-right">
									<p className="text-sm font-semibold">
										{formatCurrency(errand.totalAmount)}
									</p>
									<Badge
										className={`${errandStatusColor[errand.status]} text-[10px]`}
										variant="secondary">
										{errandStatusLabel[errand.status]}
									</Badge>
								</div>
							</Link>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	);
}

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */
export default function DashboardHomePage() {
	const { data: userData } = useCurrentUser();
	const user = userData?.data;

	return (
		<div className="space-y-6">
			{/* Welcome */}
			<div>
				<h1 className="text-2xl font-bold">
					Welcome back{user ? `, ${user.firstName}` : ""}
				</h1>
				<p className="text-sm text-muted-foreground">
					Here&apos;s what&apos;s happening with your errands
				</p>
			</div>

			{/* Stats */}
			<StatsCards />

			{/* Active Errands */}
			<ActiveErrands />

			{/* Quick Actions */}
			<QuickActions />

			{/* Recent Orders */}
			<RecentOrders />
		</div>
	);
}
