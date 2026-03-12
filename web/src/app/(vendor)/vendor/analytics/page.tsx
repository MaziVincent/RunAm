"use client";

import {
	ShoppingBag,
	DollarSign,
	TrendingUp,
	BarChart3,
	Package,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useVendorAnalytics, useVendorOrders } from "@/lib/hooks";
import { formatCurrency, cn } from "@/lib/utils";

function StatCard({
	label,
	value,
	icon: Icon,
	color,
}: {
	label: string;
	value: string | number;
	icon: any;
	color: string;
}) {
	return (
		<Card>
			<CardContent className="flex items-center gap-3 p-4">
				<div
					className={cn(
						"flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
						color,
					)}>
					<Icon className="h-5 w-5" />
				</div>
				<div>
					<p className="text-xs text-muted-foreground">{label}</p>
					<p className="text-xl font-bold">{value}</p>
				</div>
			</CardContent>
		</Card>
	);
}

function RevenueChart({
	data,
}: {
	data: { date: string; revenue: number }[];
}) {
	if (!data.length) {
		return (
			<div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
				No data yet
			</div>
		);
	}

	const max = Math.max(...data.map((d) => d.revenue), 1);
	const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

	return (
		<div className="space-y-3">
			<div className="flex h-48 items-end gap-2">
				{data.slice(0, 7).map((day, i) => (
					<div key={i} className="flex flex-1 flex-col items-center gap-1">
						<p className="text-[10px] font-medium text-muted-foreground">
							{formatCurrency(day.revenue)}
						</p>
						<div
							className="w-full rounded-t bg-primary/80 transition-all"
							style={{
								height: `${Math.max((day.revenue / max) * 160, 4)}px`,
							}}
						/>
						<span className="text-[10px] text-muted-foreground">
							{days[i] ?? ""}
						</span>
					</div>
				))}
			</div>
		</div>
	);
}

function OrdersChart({
	data,
}: {
	data: { date: string; revenue: number }[];
}) {
	if (!data.length) {
		return (
			<div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
				No data yet
			</div>
		);
	}

	// Use revenue as a proxy for order volume for the chart
	const max = Math.max(...data.map((d) => d.revenue), 1);
	const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

	return (
		<div className="flex h-48 items-end gap-2">
			{data.slice(0, 7).map((day, i) => (
				<div key={i} className="flex flex-1 flex-col items-center gap-1">
					<div
						className="w-full rounded-t bg-blue-500/80 transition-all"
						style={{
							height: `${Math.max((day.revenue / max) * 160, 4)}px`,
						}}
					/>
					<span className="text-[10px] text-muted-foreground">
						{days[i] ?? ""}
					</span>
				</div>
			))}
		</div>
	);
}

function TopProductsTable({
	products,
}: {
	products: { productName: string; orderCount: number; revenue: number }[];
}) {
	if (!products.length) {
		return (
			<p className="py-8 text-center text-sm text-muted-foreground">
				No data yet
			</p>
		);
	}

	const max = Math.max(...products.map((p) => p.orderCount), 1);

	return (
		<div className="space-y-3">
			{products.map((product, idx) => (
				<div key={idx} className="space-y-1">
					<div className="flex items-center justify-between text-sm">
						<span className="font-medium">{product.productName}</span>
						<span className="text-muted-foreground">
							{product.orderCount} orders
						</span>
					</div>
					<div className="h-2 overflow-hidden rounded-full bg-muted">
						<div
							className="h-full rounded-full bg-primary transition-all"
							style={{
								width: `${(product.orderCount / max) * 100}%`,
							}}
						/>
					</div>
				</div>
			))}
		</div>
	);
}

export default function VendorAnalyticsPage() {
	const { data, isLoading } = useVendorAnalytics();
	const analytics = data?.data;

	if (isLoading) {
		return (
			<div className="space-y-6">
				<h1 className="text-2xl font-bold">Analytics</h1>
				<div className="grid gap-3 sm:grid-cols-3">
					{[1, 2, 3].map((i) => (
						<Skeleton key={i} className="h-20 rounded-xl" />
					))}
				</div>
				<Skeleton className="h-64 rounded-xl" />
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<h1 className="text-2xl font-bold">Analytics</h1>

			{/* Stats */}
			<div className="grid gap-3 sm:grid-cols-3">
				<StatCard
					label="Today's Orders"
					value={analytics?.todayOrders ?? 0}
					icon={ShoppingBag}
					color="text-blue-600 bg-blue-50 dark:bg-blue-950/50"
				/>
				<StatCard
					label="Today's Revenue"
					value={formatCurrency(analytics?.todayRevenue ?? 0)}
					icon={DollarSign}
					color="text-green-600 bg-green-50 dark:bg-green-950/50"
				/>
				<StatCard
					label="Pending Orders"
					value={analytics?.pendingOrders ?? 0}
					icon={Package}
					color="text-amber-600 bg-amber-50 dark:bg-amber-950/50"
				/>
			</div>

			{/* Charts */}
			<div className="grid gap-6 lg:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle className="text-base">Weekly Revenue</CardTitle>
					</CardHeader>
					<CardContent>
						<RevenueChart data={analytics?.weeklyRevenue ?? []} />
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle className="text-base">Order Volume</CardTitle>
					</CardHeader>
					<CardContent>
						<OrdersChart data={analytics?.weeklyRevenue ?? []} />
					</CardContent>
				</Card>
			</div>

			{/* Top Products */}
			<Card>
				<CardHeader>
					<CardTitle className="text-base">Top Products</CardTitle>
				</CardHeader>
				<CardContent>
					<TopProductsTable products={analytics?.topProducts ?? []} />
				</CardContent>
			</Card>
		</div>
	);
}
