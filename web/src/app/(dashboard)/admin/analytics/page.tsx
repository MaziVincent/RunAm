"use client";

import { useQuery } from "@tanstack/react-query";
import {
	BarChart3,
	Users,
	Bike,
	Package,
	DollarSign,
	TrendingUp,
	Store,
	ArrowUpRight,
	ArrowDownRight,
} from "lucide-react";
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
	PieChart,
	Pie,
	Cell,
	Legend,
} from "recharts";
import { api } from "@/lib/api/client";
import {
	cn,
	formatCurrency,
	errandStatusLabel,
	errandCategoryLabel,
} from "@/lib/utils";
import type {
	DashboardStats,
	ErrandDto,
	ErrandStatus,
	ErrandCategory,
} from "@/types";

interface FinanceStats {
	totalRevenue: number;
	commissionEarned: number;
	pendingPayments: number;
	todayRevenue: number;
	totalTransactions: number;
}

const STATUS_COLORS = [
	"#eab308", // Pending - yellow
	"#3b82f6", // Accepted - blue
	"#6366f1", // EnRouteToPickup - indigo
	"#6366f1", // ArrivedAtPickup
	"#8b5cf6", // PackageCollected - purple
	"#6366f1", // EnRouteToDropoff
	"#6366f1", // ArrivedAtDropoff
	"#22c55e", // Delivered - green
	"#ef4444", // Cancelled - red
	"#ef4444", // Failed
];

const CATEGORY_COLORS = [
	"#3b82f6",
	"#f97316",
	"#22c55e",
	"#6366f1",
	"#ec4899",
	"#8b5cf6",
	"#14b8a6",
	"#eab308",
	"#f43f5e",
	"#64748b",
];

export default function AnalyticsPage() {
	const { data: statsRes, isLoading: loadingStats } = useQuery({
		queryKey: ["dashboard-stats"],
		queryFn: () => api.get<DashboardStats>("/admin/dashboard/stats"),
	});

	const { data: financeRes, isLoading: loadingFinance } = useQuery({
		queryKey: ["finance-stats"],
		queryFn: () => api.get<FinanceStats>("/admin/finance/stats"),
	});

	const { data: errandsRes, isLoading: loadingErrands } = useQuery({
		queryKey: ["analytics-errands"],
		queryFn: () =>
			api.get<ErrandDto[]>("/admin/errands", { page: 1, pageSize: 100 }),
	});

	const stats = statsRes?.data;
	const finance = financeRes?.data;
	const errands = errandsRes?.data ?? [];

	// Compute errand status distribution
	const statusCounts = errands.reduce<Record<number, number>>((acc, e) => {
		acc[e.status] = (acc[e.status] ?? 0) + 1;
		return acc;
	}, {});
	const statusData = Object.entries(statusCounts)
		.map(([status, count]) => ({
			name: errandStatusLabel[Number(status)] ?? "Unknown",
			value: count,
			color: STATUS_COLORS[Number(status)] ?? "#64748b",
		}))
		.sort((a, b) => b.value - a.value);

	// Compute errand category distribution
	const categoryCounts = errands.reduce<Record<number, number>>((acc, e) => {
		acc[e.category] = (acc[e.category] ?? 0) + 1;
		return acc;
	}, {});
	const categoryData = Object.entries(categoryCounts)
		.map(([cat, count]) => ({
			name: errandCategoryLabel[Number(cat)] ?? "Unknown",
			value: count,
			color: CATEGORY_COLORS[Number(cat)] ?? "#64748b",
		}))
		.sort((a, b) => b.value - a.value);

	// Revenue breakdown
	const revenueData = [
		{ name: "Total Revenue", value: finance?.totalRevenue ?? 0 },
		{ name: "Commission", value: finance?.commissionEarned ?? 0 },
		{ name: "Pending", value: finance?.pendingPayments ?? 0 },
		{ name: "Today", value: finance?.todayRevenue ?? 0 },
	];

	const isLoading = loadingStats || loadingFinance || loadingErrands;

	const summaryCards = [
		{
			label: "Total Users",
			value: stats?.totalUsers ?? 0,
			icon: Users,
			color: "text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400",
		},
		{
			label: "Active Riders",
			value: stats?.activeRiders ?? 0,
			icon: Bike,
			color:
				"text-green-600 bg-green-50 dark:bg-green-900/30 dark:text-green-400",
		},
		{
			label: "Total Vendors",
			value: stats?.totalVendors ?? 0,
			icon: Store,
			color:
				"text-purple-600 bg-purple-50 dark:bg-purple-900/30 dark:text-purple-400",
			sub:
				(stats?.pendingVendors ?? 0) > 0
					? `${stats?.pendingVendors} pending approval`
					: undefined,
		},
		{
			label: "Today's Errands",
			value: stats?.todaysErrands ?? 0,
			icon: Package,
			color:
				"text-orange-600 bg-orange-50 dark:bg-orange-900/30 dark:text-orange-400",
		},
		{
			label: "Total Revenue",
			value: formatCurrency(finance?.totalRevenue ?? 0),
			icon: DollarSign,
			color:
				"text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400",
		},
		{
			label: "Commission Earned",
			value: formatCurrency(finance?.commissionEarned ?? 0),
			icon: TrendingUp,
			color: "text-teal-600 bg-teal-50 dark:bg-teal-900/30 dark:text-teal-400",
		},
	];

	return (
		<div className="space-y-8">
			{/* Header */}
			<div>
				<h1 className="text-2xl font-bold text-slate-900 dark:text-white">
					Analytics
				</h1>
				<p className="mt-1 text-sm text-slate-500">
					Platform performance overview
				</p>
			</div>

			{/* Summary cards */}
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{summaryCards.map((card) => (
					<div
						key={card.label}
						className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
						{isLoading ? (
							<div className="animate-pulse space-y-3">
								<div className="h-4 w-20 rounded bg-slate-200 dark:bg-slate-700" />
								<div className="h-8 w-28 rounded bg-slate-200 dark:bg-slate-700" />
							</div>
						) : (
							<>
								<div className="flex items-center justify-between">
									<span className="text-sm font-medium text-slate-500 dark:text-slate-400">
										{card.label}
									</span>
									<div className={cn("rounded-lg p-2", card.color)}>
										<card.icon className="h-4 w-4" />
									</div>
								</div>
								<p className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
									{card.value}
								</p>
								{card.sub && (
									<p className="mt-1 text-xs font-medium text-amber-600">
										{card.sub}
									</p>
								)}
							</>
						)}
					</div>
				))}
			</div>

			{/* Charts */}
			<div className="grid gap-6 lg:grid-cols-2">
				{/* Revenue breakdown */}
				<div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
					<h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
						Revenue Breakdown
					</h2>
					{isLoading ? (
						<div className="h-64 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
					) : (
						<ResponsiveContainer width="100%" height={280}>
							<BarChart data={revenueData}>
								<CartesianGrid
									strokeDasharray="3 3"
									className="stroke-slate-200 dark:stroke-slate-700"
								/>
								<XAxis
									dataKey="name"
									tick={{ fontSize: 12 }}
									className="fill-slate-500"
								/>
								<YAxis
									tick={{ fontSize: 12 }}
									className="fill-slate-500"
									tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`}
								/>
								<Tooltip
									formatter={(value: number) => [
										formatCurrency(value),
										"Amount",
									]}
									contentStyle={{
										backgroundColor: "var(--tooltip-bg, #fff)",
										border: "1px solid #e2e8f0",
										borderRadius: "8px",
										fontSize: 13,
									}}
								/>
								<Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} />
							</BarChart>
						</ResponsiveContainer>
					)}
				</div>

				{/* Errand status distribution */}
				<div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
					<h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
						Errand Status Distribution
					</h2>
					{isLoading ? (
						<div className="h-64 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
					) : statusData.length === 0 ? (
						<div className="flex h-64 items-center justify-center text-sm text-slate-500">
							No errand data available
						</div>
					) : (
						<ResponsiveContainer width="100%" height={280}>
							<PieChart>
								<Pie
									data={statusData}
									cx="50%"
									cy="50%"
									innerRadius={60}
									outerRadius={100}
									paddingAngle={2}
									dataKey="value">
									{statusData.map((entry, i) => (
										<Cell key={i} fill={entry.color} />
									))}
								</Pie>
								<Tooltip
									formatter={(value: number, name: string) => [value, name]}
									contentStyle={{
										backgroundColor: "var(--tooltip-bg, #fff)",
										border: "1px solid #e2e8f0",
										borderRadius: "8px",
										fontSize: 13,
									}}
								/>
								<Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" />
							</PieChart>
						</ResponsiveContainer>
					)}
				</div>

				{/* Errand category breakdown */}
				<div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
					<h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
						Errands by Category
					</h2>
					{isLoading ? (
						<div className="h-64 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
					) : categoryData.length === 0 ? (
						<div className="flex h-64 items-center justify-center text-sm text-slate-500">
							No errand data available
						</div>
					) : (
						<ResponsiveContainer width="100%" height={280}>
							<BarChart data={categoryData} layout="vertical">
								<CartesianGrid
									strokeDasharray="3 3"
									className="stroke-slate-200 dark:stroke-slate-700"
								/>
								<XAxis
									type="number"
									tick={{ fontSize: 12 }}
									className="fill-slate-500"
								/>
								<YAxis
									dataKey="name"
									type="category"
									tick={{ fontSize: 11 }}
									className="fill-slate-500"
									width={120}
								/>
								<Tooltip
									contentStyle={{
										backgroundColor: "var(--tooltip-bg, #fff)",
										border: "1px solid #e2e8f0",
										borderRadius: "8px",
										fontSize: 13,
									}}
								/>
								<Bar dataKey="value" radius={[0, 6, 6, 0]}>
									{categoryData.map((entry, i) => (
										<Cell key={i} fill={entry.color} />
									))}
								</Bar>
							</BarChart>
						</ResponsiveContainer>
					)}
				</div>

				{/* Finance summary table */}
				<div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
					<h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
						Finance Summary
					</h2>
					{isLoading ? (
						<div className="animate-pulse space-y-4">
							{Array.from({ length: 5 }).map((_, i) => (
								<div
									key={i}
									className="h-6 rounded bg-slate-200 dark:bg-slate-700"
								/>
							))}
						</div>
					) : (
						<div className="space-y-4">
							{[
								{
									label: "Total Revenue",
									value: formatCurrency(finance?.totalRevenue ?? 0),
									icon: DollarSign,
									color: "text-green-600",
								},
								{
									label: "Commission Earned",
									value: formatCurrency(finance?.commissionEarned ?? 0),
									icon: TrendingUp,
									color: "text-teal-600",
								},
								{
									label: "Pending Payments",
									value: formatCurrency(finance?.pendingPayments ?? 0),
									icon: Package,
									color: "text-yellow-600",
								},
								{
									label: "Today's Revenue",
									value: formatCurrency(finance?.todayRevenue ?? 0),
									icon: ArrowUpRight,
									color: "text-blue-600",
								},
								{
									label: "Total Transactions",
									value: finance?.totalTransactions ?? 0,
									icon: BarChart3,
									color: "text-slate-600",
								},
							].map((item) => (
								<div
									key={item.label}
									className="flex items-center justify-between rounded-lg border border-slate-100 px-4 py-3 dark:border-slate-800">
									<div className="flex items-center gap-3">
										<item.icon className={cn("h-4 w-4", item.color)} />
										<span className="text-sm text-slate-600 dark:text-slate-400">
											{item.label}
										</span>
									</div>
									<span className="text-sm font-semibold text-slate-900 dark:text-white">
										{item.value}
									</span>
								</div>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
