"use client";

import { useState, useDeferredValue } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Search, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { api } from "@/lib/api/client";
import {
	cn,
	errandStatusLabel,
	errandStatusColor,
	errandCategoryLabel,
	formatCurrency,
	vendorOrderStatusLabel,
	vendorOrderStatusColor,
} from "@/lib/utils";
import type { ErrandDto } from "@/types";
import { format } from "date-fns";

export default function ErrandsPage() {
	const router = useRouter();
	const [page, setPage] = useState(1);
	const [search, setSearch] = useState("");
	const deferredSearch = useDeferredValue(search);
	const [statusFilter, setStatusFilter] = useState<string>("");
	const pageSize = 20;

	const { data: res, isLoading } = useQuery({
		queryKey: ["admin-errands", page, deferredSearch, statusFilter],
		queryFn: () =>
			api.get<ErrandDto[]>("/admin/errands", {
				page,
				pageSize,
				...(deferredSearch && { search: deferredSearch }),
				...(statusFilter && { status: statusFilter }),
			}),
	});

	const errands = res?.data ?? [];
	const meta = res?.meta;

	return (
		<div className="space-y-6">
			{/* Header */}
			<div>
				<h1 className="text-2xl font-bold text-slate-900 dark:text-white">
					Errands
				</h1>
				<p className="mt-1 text-sm text-slate-500">
					Track and manage all errands
				</p>
			</div>

			{/* Filters */}
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
					<input
						type="text"
						placeholder="Search errands…"
						value={search}
						onChange={(e) => {
							setSearch(e.target.value);
							setPage(1);
						}}
						className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
					/>
				</div>
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
						<option value="1">Accepted</option>
						<option value="2">En Route to Pickup</option>
						<option value="4">Package Collected</option>
						<option value="5">En Route to Dropoff</option>
						<option value="7">Delivered</option>
						<option value="8">Cancelled</option>
						<option value="9">Failed</option>
					</select>
				</div>
			</div>

			{/* Table */}
			<div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
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
									Rider
								</th>
								<th className="whitespace-nowrap px-6 py-3 font-medium text-slate-500 dark:text-slate-400">
									Category
								</th>
								<th className="whitespace-nowrap px-6 py-3 font-medium text-slate-500 dark:text-slate-400">
									Vendor
								</th>
								<th className="whitespace-nowrap px-6 py-3 font-medium text-slate-500 dark:text-slate-400">
									Status
								</th>
								<th className="whitespace-nowrap px-6 py-3 font-medium text-slate-500 dark:text-slate-400">
									Amount
								</th>
								<th className="whitespace-nowrap px-6 py-3 font-medium text-slate-500 dark:text-slate-400">
									Created
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-200 dark:divide-slate-800">
							{isLoading ? (
								Array.from({ length: 8 }).map((_, i) => (
									<tr key={i}>
										{Array.from({ length: 8 }).map((_, j) => (
											<td key={j} className="px-6 py-3">
												<div className="h-4 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
											</td>
										))}
									</tr>
								))
							) : errands.length === 0 ? (
								<tr>
									<td
										colSpan={8}
										className="px-6 py-12 text-center text-slate-500">
										No errands found
									</td>
								</tr>
							) : (
								errands.map((errand) => (
									<tr
										key={errand.id}
										onClick={() => router.push(`/admin/errands/${errand.id}`)}
										className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
										<td className="whitespace-nowrap px-6 py-3 font-mono text-xs text-slate-600 dark:text-slate-400">
											{errand.id.slice(0, 8)}…
										</td>
										<td className="whitespace-nowrap px-6 py-3 text-slate-900 dark:text-white">
											{errand.customerName}
										</td>
										<td className="whitespace-nowrap px-6 py-3 text-slate-600 dark:text-slate-400">
											{errand.riderName ?? "—"}
										</td>
										<td className="whitespace-nowrap px-6 py-3 text-slate-600 dark:text-slate-400">
											{errandCategoryLabel[errand.category] ?? "Unknown"}
										</td>
										<td className="whitespace-nowrap px-6 py-3">
											{errand.vendorName ? (
												<div>
													<span className="text-slate-900 dark:text-white">
														{errand.vendorName}
													</span>
													{errand.vendorOrderStatus != null && (
														<span
															className={cn(
																"ml-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium",
																vendorOrderStatusColor[
																	errand.vendorOrderStatus
																],
															)}>
															{vendorOrderStatusLabel[
																errand.vendorOrderStatus
															] ?? ""}
														</span>
													)}
												</div>
											) : (
												<span className="text-slate-400">—</span>
											)}
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
										<td className="whitespace-nowrap px-6 py-3 text-slate-600 dark:text-slate-400">
											{format(new Date(errand.createdAt), "MMM d, yyyy")}
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
							errands
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
