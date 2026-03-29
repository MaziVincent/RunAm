"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
	Search,
	ChevronLeft,
	ChevronRight,
	CheckCircle,
	XCircle,
	Eye,
	Filter,
} from "lucide-react";
import { api } from "@/lib/api/client";
import {
	cn,
	vendorStatusLabel,
	vendorStatusColor,
	formatCurrency,
} from "@/lib/utils";
import type { VendorDto, ServiceCategoryDto } from "@/types";
import { VendorStatus } from "@/types";
import { format } from "date-fns";
import Link from "next/link";

export default function VendorsPage() {
	const queryClient = useQueryClient();
	const [page, setPage] = useState(1);
	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>("");
	const [tab, setTab] = useState<"all" | "pending">("pending");
	const pageSize = 20;

	const { data: res, isLoading } = useQuery({
		queryKey: ["vendors", page, search, statusFilter, tab],
		queryFn: () =>
			api.get<VendorDto[]>("/vendors", {
				page,
				pageSize,
				...(search && { search }),
				...(tab === "pending"
					? { status: "0" }
					: statusFilter
						? { status: statusFilter }
						: {}),
			}),
	});

	const { data: categoriesRes } = useQuery({
		queryKey: ["service-categories"],
		queryFn: () => api.get<ServiceCategoryDto[]>("/service-categories"),
	});

	const vendors = res?.data ?? [];
	const meta = res?.meta;

	const approveMutation = useMutation({
		mutationFn: (vendorId: string) =>
			api.put(`/vendors/${vendorId}/approve?approve=true`),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["vendors"] });
		},
	});

	const handleApprove = (vendorId: string) => {
		approveMutation.mutate(vendorId);
	};

	const handleSuspend = (vendorId: string) => {
		const reason = window.prompt("Reason for suspension (optional):");
		api.put(`/vendors/${vendorId}/approve?approve=false`).then(() => {
			queryClient.invalidateQueries({ queryKey: ["vendors"] });
		});
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div>
				<h1 className="text-2xl font-bold text-slate-900 dark:text-white">
					Vendors
				</h1>
				<p className="mt-1 text-sm text-slate-500">
					Manage marketplace vendors and approve registrations
				</p>
			</div>

			{/* Tabs */}
			<div className="flex gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
				<button
					onClick={() => {
						setTab("pending");
						setPage(1);
					}}
					className={cn(
						"rounded-md px-4 py-2 text-sm font-medium transition-colors",
						tab === "pending"
							? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
							: "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white",
					)}>
					Pending Approval
				</button>
				<button
					onClick={() => {
						setTab("all");
						setPage(1);
					}}
					className={cn(
						"rounded-md px-4 py-2 text-sm font-medium transition-colors",
						tab === "all"
							? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
							: "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white",
					)}>
					All Vendors
				</button>
			</div>

			{/* Filters */}
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
					<input
						type="text"
						placeholder="Search vendors…"
						value={search}
						onChange={(e) => {
							setSearch(e.target.value);
							setPage(1);
						}}
						className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
					/>
				</div>
				{tab === "all" && (
					<div className="flex items-center gap-2">
						<Filter className="h-4 w-4 text-slate-400" />
						<select
							value={statusFilter}
							onChange={(e) => {
								setStatusFilter(e.target.value);
								setPage(1);
							}}
							className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white">
							<option value="">All Statuses</option>
							<option value="0">Pending</option>
							<option value="1">Active</option>
							<option value="2">Suspended</option>
							<option value="3">Closed</option>
						</select>
					</div>
				)}
			</div>

			{/* Table */}
			<div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
				<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b border-slate-200 text-left dark:border-slate-800">
								<th className="whitespace-nowrap px-6 py-3 font-medium text-slate-500 dark:text-slate-400">
									Business
								</th>
								<th className="whitespace-nowrap px-6 py-3 font-medium text-slate-500 dark:text-slate-400">
									Categories
								</th>
								<th className="whitespace-nowrap px-6 py-3 font-medium text-slate-500 dark:text-slate-400">
									Rating
								</th>
								<th className="whitespace-nowrap px-6 py-3 font-medium text-slate-500 dark:text-slate-400">
									Orders
								</th>
								<th className="whitespace-nowrap px-6 py-3 font-medium text-slate-500 dark:text-slate-400">
									Status
								</th>
								<th className="whitespace-nowrap px-6 py-3 font-medium text-slate-500 dark:text-slate-400">
									Open
								</th>
								<th className="whitespace-nowrap px-6 py-3 font-medium text-slate-500 dark:text-slate-400">
									Joined
								</th>
								<th className="whitespace-nowrap px-6 py-3 font-medium text-slate-500 dark:text-slate-400">
									Actions
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-200 dark:divide-slate-800">
							{isLoading ? (
								Array.from({ length: 6 }).map((_, i) => (
									<tr key={i}>
										{Array.from({ length: 8 }).map((_, j) => (
											<td key={j} className="px-6 py-3">
												<div className="h-4 w-20 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
											</td>
										))}
									</tr>
								))
							) : vendors.length === 0 ? (
								<tr>
									<td
										colSpan={8}
										className="px-6 py-12 text-center text-slate-500">
										{tab === "pending"
											? "No vendors pending approval"
											: "No vendors found"}
									</td>
								</tr>
							) : (
								vendors.map((vendor) => (
									<tr
										key={vendor.id}
										className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
										<td className="whitespace-nowrap px-6 py-3">
											<div className="flex items-center gap-3">
												<div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-100 text-sm font-semibold text-purple-700 dark:bg-purple-900/50 dark:text-purple-400">
													{vendor.businessName
														.split(" ")
														.map((n) => n[0])
														.join("")
														.slice(0, 2)}
												</div>
												<div>
													<span className="font-medium text-slate-900 dark:text-white">
														{vendor.businessName}
													</span>
													<p className="text-xs text-slate-500 truncate max-w-[200px]">
														{vendor.address}
													</p>
												</div>
											</div>
										</td>
										<td className="whitespace-nowrap px-6 py-3">
											<div className="flex flex-wrap gap-1">
												{vendor.serviceCategories?.slice(0, 2).map((sc) => (
													<span
														key={sc.id}
														className="inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
														{sc.name}
													</span>
												))}
												{(vendor.serviceCategories?.length ?? 0) > 2 && (
													<span className="text-xs text-slate-400">
														+{vendor.serviceCategories.length - 2}
													</span>
												)}
											</div>
										</td>
										<td className="whitespace-nowrap px-6 py-3 text-slate-600 dark:text-slate-400">
											⭐ {vendor.rating.toFixed(1)} ({vendor.totalReviews})
										</td>
										<td className="whitespace-nowrap px-6 py-3 text-slate-600 dark:text-slate-400">
											{vendor.totalOrders}
										</td>
										<td className="whitespace-nowrap px-6 py-3">
											<span
												className={cn(
													"inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
													vendorStatusColor[vendor.status] ??
														"bg-slate-100 text-slate-800",
												)}>
												{vendorStatusLabel[vendor.status] ?? "Unknown"}
											</span>
										</td>
										<td className="whitespace-nowrap px-6 py-3">
											<span
												className={cn(
													"inline-flex h-2.5 w-2.5 rounded-full",
													vendor.isOpen
														? "bg-green-500"
														: "bg-slate-300 dark:bg-slate-600",
												)}
											/>
										</td>
										<td className="whitespace-nowrap px-6 py-3 text-slate-600 dark:text-slate-400">
											{format(new Date(vendor.createdAt), "MMM d, yyyy")}
										</td>
										<td className="whitespace-nowrap px-6 py-3">
											<div className="flex items-center gap-1">
												<Link
													href={`/admin/vendors/${vendor.id}`}
													className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-600 dark:hover:bg-slate-800">
													<Eye className="h-4 w-4" />
												</Link>
												{tab === "pending" && (
													<>
														<button
															onClick={() => handleApprove(vendor.id)}
															disabled={approveMutation.isPending}
															className="inline-flex items-center gap-1 rounded-lg bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 transition-colors hover:bg-green-100 disabled:opacity-50 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50">
															<CheckCircle className="h-3.5 w-3.5" />
															Approve
														</button>
														<button
															onClick={() => handleSuspend(vendor.id)}
															className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50">
															<XCircle className="h-3.5 w-3.5" />
															Reject
														</button>
													</>
												)}
												{tab === "all" &&
													vendor.status === VendorStatus.Active && (
														<button
															onClick={() => handleSuspend(vendor.id)}
															className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400">
															<XCircle className="h-3.5 w-3.5" />
															Suspend
														</button>
													)}
											</div>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>

				{/* Pagination */}
				{meta && meta.totalPages > 1 && (
					<div className="flex items-center justify-between border-t border-slate-200 px-6 py-3 dark:border-slate-800">
						<p className="text-sm text-slate-500">
							Page {meta.page} of {meta.totalPages} &middot; {meta.totalCount}{" "}
							vendors
						</p>
						<div className="flex items-center gap-2">
							<button
								onClick={() => setPage((p) => Math.max(1, p - 1))}
								disabled={page === 1}
								className="rounded-lg border border-slate-300 p-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800">
								<ChevronLeft className="h-4 w-4" />
							</button>
							<button
								onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
								disabled={page === meta.totalPages}
								className="rounded-lg border border-slate-300 p-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800">
								<ChevronRight className="h-4 w-4" />
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
