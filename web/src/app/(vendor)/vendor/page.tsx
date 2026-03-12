"use client";

import Link from "next/link";
import {
	ShoppingBag,
	DollarSign,
	Clock,
	TrendingUp,
	Package,
	ChevronRight,
	AlertCircle,
	Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
	useMyVendor,
	useToggleVendorOpen,
	useVendorOrders,
	useVendorAnalytics,
	useConfirmVendorOrder,
	useRejectVendorOrder,
} from "@/lib/hooks";
import { formatCurrency, cn, vendorOrderStatusLabel } from "@/lib/utils";
import { VendorStatus, VendorOrderStatus } from "@/types";
import { toast } from "sonner";

function StoreToggle() {
	const { data: vendorData } = useMyVendor();
	const toggleOpen = useToggleVendorOpen();
	const vendor = vendorData?.data;

	if (!vendor) return null;

	return (
		<div className="flex items-center gap-3 rounded-lg border bg-background p-3">
			<div
				className={cn(
					"h-3 w-3 rounded-full",
					vendor.isOpen ? "bg-green-500" : "bg-muted-foreground",
				)}
			/>
			<span className="text-sm font-medium">
				Store is {vendor.isOpen ? "Open" : "Closed"}
			</span>
			<Switch
				checked={vendor.isOpen}
				onCheckedChange={async () => {
					try {
						await toggleOpen.mutateAsync(!vendor.isOpen);
						toast.success(vendor.isOpen ? "Store closed" : "Store opened");
					} catch {
						toast.error("Failed to toggle store");
					}
				}}
				disabled={toggleOpen.isPending}
				className="ml-auto"
			/>
		</div>
	);
}

function StatsCards() {
	const { data, isLoading } = useVendorAnalytics();
	const analytics = data?.data;

	const stats = [
		{
			label: "Today's Orders",
			value: analytics?.todayOrders ?? 0,
			icon: ShoppingBag,
			color: "text-blue-600 bg-blue-50 dark:bg-blue-950/50",
		},
		{
			label: "Today's Revenue",
			value: formatCurrency(analytics?.todayRevenue ?? 0),
			icon: DollarSign,
			color: "text-green-600 bg-green-50 dark:bg-green-950/50",
		},
		{
			label: "Pending Orders",
			value: analytics?.pendingOrders ?? 0,
			icon: Clock,
			color: "text-amber-600 bg-amber-50 dark:bg-amber-950/50",
			href: "/vendor/orders",
		},
	];

	return (
		<div className="grid gap-3 sm:grid-cols-3">
			{stats.map((stat) => (
				<Card key={stat.label}>
					<CardContent className="flex items-center gap-3 p-4">
						{isLoading ? (
							<Skeleton className="h-12 w-full" />
						) : (
							<>
								<div
									className={cn(
										"flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
										stat.color,
									)}>
									<stat.icon className="h-5 w-5" />
								</div>
								<div>
									<p className="text-xs text-muted-foreground">{stat.label}</p>
									<p className="text-xl font-bold">{stat.value}</p>
								</div>
								{stat.href && (
									<Link href={stat.href} className="ml-auto">
										<ChevronRight className="h-4 w-4 text-muted-foreground" />
									</Link>
								)}
							</>
						)}
					</CardContent>
				</Card>
			))}
		</div>
	);
}

function NewOrders() {
	const { data, isLoading } = useVendorOrders({
		status: String(VendorOrderStatus.Received),
	});
	const confirmOrder = useConfirmVendorOrder();
	const rejectOrder = useRejectVendorOrder();
	const orders = data?.data ?? [];

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between">
				<CardTitle className="text-base">
					New Orders
					{orders.length > 0 && (
						<Badge className="ml-2" variant="destructive">
							{orders.length}
						</Badge>
					)}
				</CardTitle>
				<Link href="/vendor/orders">
					<Button variant="ghost" size="sm">
						View All
					</Button>
				</Link>
			</CardHeader>
			<CardContent>
				{isLoading ? (
					<div className="space-y-3">
						{[1, 2].map((i) => (
							<Skeleton key={i} className="h-24 rounded-lg" />
						))}
					</div>
				) : orders.length === 0 ? (
					<div className="flex flex-col items-center py-8 text-center">
						<ShoppingBag className="h-8 w-8 text-muted-foreground/30" />
						<p className="mt-2 text-sm text-muted-foreground">
							No pending orders
						</p>
					</div>
				) : (
					<div className="space-y-3">
						{orders.slice(0, 5).map((order) => (
							<div
								key={order.id}
								className="rounded-lg border bg-amber-50/50 p-3 dark:bg-amber-950/20">
								<div className="flex items-start justify-between">
									<div>
										<p className="text-sm font-semibold">
											Order #{order.id?.slice(-6)}
										</p>
										<p className="text-xs text-muted-foreground">
											{formatCurrency(order.totalAmount ?? 0)}
										</p>
										<p className="mt-1 text-xs text-muted-foreground">
											{new Date(order.createdAt).toLocaleTimeString("en-NG", {
												hour: "2-digit",
												minute: "2-digit",
											})}
										</p>
									</div>
								</div>
								{/* Description preview */}
								{order.description && (
									<p className="mt-2 truncate text-xs text-muted-foreground">
										{order.description}
									</p>
								)}
								{/* Actions */}
								<div className="mt-3 flex gap-2">
									<Button
										size="sm"
										className="flex-1"
										onClick={async () => {
											try {
												await confirmOrder.mutateAsync({ orderId: order.id });
												toast.success("Order accepted");
											} catch {
												toast.error("Failed to accept");
											}
										}}
										disabled={confirmOrder.isPending}>
										{confirmOrder.isPending ? (
											<Loader2 className="h-4 w-4 animate-spin" />
										) : (
											"Accept"
										)}
									</Button>
									<Button
										size="sm"
										variant="outline"
										onClick={async () => {
											try {
												await rejectOrder.mutateAsync({ orderId: order.id, reason: "Vendor rejected" });
												toast.success("Order rejected");
											} catch {
												toast.error("Failed to reject");
											}
										}}
										disabled={rejectOrder.isPending}>
										Reject
									</Button>
								</div>
							</div>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	);
}

function RevenueChart() {
	const { data } = useVendorAnalytics();
	const analytics = data?.data;
	const weeklyRevenue = analytics?.weeklyRevenue ?? [];

	const maxRevenue = Math.max(...weeklyRevenue.map((d) => d.revenue), 1);
	const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-base">Revenue (7 Days)</CardTitle>
			</CardHeader>
			<CardContent>
				{weeklyRevenue.length === 0 ? (
					<div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
						No data yet
					</div>
				) : (
					<div className="flex h-40 items-end gap-2">
						{weeklyRevenue.slice(0, 7).map((day, i) => (
							<div
								key={i}
								className="flex flex-1 flex-col items-center gap-1">
								<div className="relative w-full">
									<div
										className="w-full rounded-t bg-primary/80 transition-all"
										style={{
											height: `${Math.max((day.revenue / maxRevenue) * 120, 4)}px`,
										}}
									/>
								</div>
								<span className="text-[10px] text-muted-foreground">
									{days[i] ?? ""}
								</span>
							</div>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	);
}

function TopProducts() {
	const { data } = useVendorAnalytics();
	const analytics = data?.data;
	const products = analytics?.topProducts ?? [];

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-base">Top Products</CardTitle>
			</CardHeader>
			<CardContent>
				{products.length === 0 ? (
					<p className="text-sm text-muted-foreground">No data yet</p>
				) : (
					<div className="space-y-3">
						{products.slice(0, 5).map((product, idx) => (
							<div
								key={idx}
								className="flex items-center justify-between">
								<div className="flex items-center gap-3">
									<span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-semibold">
										{idx + 1}
									</span>
									<p className="text-sm font-medium">{product.productName}</p>
								</div>
								<p className="text-sm text-muted-foreground">
									{product.orderCount} orders
								</p>
							</div>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	);
}

export default function VendorDashboardPage() {
	const { data: vendorData, isLoading } = useMyVendor();
	const vendor = vendorData?.data;

	// If vendor not approved, show status
	if (!isLoading && vendor && vendor.status !== VendorStatus.Active) {
		return (
			<div className="space-y-6">
				<h1 className="text-2xl font-bold">Vendor Dashboard</h1>
				<Card>
					<CardContent className="flex flex-col items-center py-12 text-center">
						<AlertCircle className="h-12 w-12 text-amber-500" />
						<h2 className="mt-4 text-xl font-bold">Application Under Review</h2>
						<p className="mt-2 max-w-md text-sm text-muted-foreground">
							Your vendor application is currently being reviewed. You&apos;ll
							receive a notification once it&apos;s approved.
						</p>
						<Badge className="mt-4" variant="secondary">
							Status: {vendor.status === VendorStatus.Pending ? "Pending Review" : "Suspended"}
						</Badge>
					</CardContent>
				</Card>
			</div>
		);
	}

	// If no vendor profile, prompt onboarding
	if (!isLoading && !vendor) {
		return (
			<div className="space-y-6">
				<h1 className="text-2xl font-bold">Vendor Dashboard</h1>
				<Card>
					<CardContent className="flex flex-col items-center py-12 text-center">
						<Package className="h-12 w-12 text-primary" />
						<h2 className="mt-4 text-xl font-bold">Become a Vendor</h2>
						<p className="mt-2 max-w-md text-sm text-muted-foreground">
							Start selling on RunAm. Set up your store and start receiving
							orders from customers in your area.
						</p>
						<Link href="/vendor/onboarding">
							<Button className="mt-6 gap-2">
								<TrendingUp className="h-4 w-4" />
								Get Started
							</Button>
						</Link>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<h1 className="text-2xl font-bold">Dashboard</h1>
				<StoreToggle />
			</div>

			<StatsCards />

			<div className="grid gap-6 lg:grid-cols-2">
				<NewOrders />
				<div className="space-y-6">
					<RevenueChart />
					<TopProducts />
				</div>
			</div>
		</div>
	);
}
