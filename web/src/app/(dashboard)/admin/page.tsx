"use client";

import { useQuery } from "@tanstack/react-query";
import {
	Users,
	Bike,
	Package,
	DollarSign,
	ArrowUpRight,
	Store,
} from "lucide-react";
import { api } from "@/lib/api/client";
import {
	cn,
	errandStatusLabel,
	errandStatusColor,
	errandCategoryLabel,
	formatCurrency,
} from "@/lib/utils";
import type { DashboardStats, ErrandDto } from "@/types";

export default function DashboardPage() {
	const { data: statsRes, isLoading: loadingStats } = useQuery({
		queryKey: ["dashboard-stats"],
		queryFn: () => api.get<DashboardStats>("/admin/dashboard/stats"),
	});

	const { data: errandsRes, isLoading: loadingErrands } = useQuery({
		queryKey: ["recent-errands"],
		queryFn: () =>
			api.get<ErrandDto[]>("/admin/errands", { page: 1, pageSize: 10 }),
	});

	const stats = statsRes?.data;
	const errands = errandsRes?.data ?? [];

	const statCards = [
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
			label: "Vendors",
			value: stats?.totalVendors ?? 0,
			icon: Store,
			color:
				"text-purple-600 bg-purple-50 dark:bg-purple-900/30 dark:text-purple-400",
			badge:
				(stats?.pendingVendors ?? 0) > 0
					? `${stats?.pendingVendors} pending`
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
			label: "Revenue",
			value: formatCurrency(stats?.revenue ?? 0),
			icon: DollarSign,
			color:
				"text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400",
		},
	];

	return (
		<div className="space-y-8">
			{/* Header */}
			<div>
				<h1 className="text-2xl font-bold text-slate-900 dark:text-white">
					Dashboard
				</h1>
				<p className="mt-1 text-sm text-slate-500">Overview of your platform</p>
			</div>

			{/* Stats cards */}
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
				{statCards.map((card) => (
					<div
						key={card.label}
						className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
						{loadingStats ? (
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
								{card.badge && (
									<p className="mt-1 text-xs font-medium text-amber-600">
										{card.badge}
									</p>
								)}
							</>
						)}
					</div>
				))}
			</div>

			{/* Recent errands table */}
			<div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
				<div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
					<h2 className="text-lg font-semibold text-slate-900 dark:text-white">
						Recent Errands
					</h2>
					<a
						href="/errands"
						className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-500">
						View all <ArrowUpRight className="h-3.5 w-3.5" />
					</a>
				</div>

				<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b border-slate-200 text-left dark:border-slate-800">
								<th className="whitespace-nowrap px-6 py-3 font-medium text-slate-500 dark:text-slate-400">
									ID
								</th>
								<th className="whitespace-nowrap px-6 py-3 font-medium text-slate-500 dark:text-slate-400">
									Customer
								</th>
								<th className="whitespace-nowrap px-6 py-3 font-medium text-slate-500 dark:text-slate-400">
									Category
								</th>
								<th className="whitespace-nowrap px-6 py-3 font-medium text-slate-500 dark:text-slate-400">
									Status
								</th>
								<th className="whitespace-nowrap px-6 py-3 font-medium text-slate-500 dark:text-slate-400">
									Amount
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-200 dark:divide-slate-800">
							{loadingErrands ? (
								Array.from({ length: 5 }).map((_, i) => (
									<tr key={i}>
										{Array.from({ length: 5 }).map((_, j) => (
											<td key={j} className="px-6 py-3">
												<div className="h-4 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
											</td>
										))}
									</tr>
								))
							) : errands.length === 0 ? (
								<tr>
									<td
										colSpan={5}
										className="px-6 py-12 text-center text-slate-500">
										No errands found
									</td>
								</tr>
							) : (
								errands.map((errand) => (
									<tr
										key={errand.id}
										className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
										<td className="whitespace-nowrap px-6 py-3 font-mono text-xs text-slate-600 dark:text-slate-400">
											{errand.id.slice(0, 8)}…
										</td>
										<td className="whitespace-nowrap px-6 py-3 text-slate-900 dark:text-white">
											{errand.customerName}
										</td>
										<td className="whitespace-nowrap px-6 py-3 text-slate-600 dark:text-slate-400">
											{errandCategoryLabel[errand.category] ?? "Unknown"}
										</td>
										<td className="whitespace-nowrap px-6 py-3">
											<span
												className={cn(
													"inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
													errandStatusColor[errand.status],
												)}>
												{errandStatusLabel[errand.status] ?? "Unknown"}
											</span>
										</td>
										<td className="whitespace-nowrap px-6 py-3 font-medium text-slate-900 dark:text-white">
											{formatCurrency(errand.totalAmount)}
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}
