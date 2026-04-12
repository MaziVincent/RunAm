"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
	Search,
	CheckCircle,
	XCircle,
	ChevronLeft,
	ChevronRight,
} from "lucide-react";
import { api } from "@/lib/api/client";
import { cn, approvalStatusLabel } from "@/lib/utils";
import type { RiderProfileDto, ApproveRiderRequest } from "@/types";
import { ApprovalStatus } from "@/types";
import { format } from "date-fns";

const vehicleTypeLabel: Record<number, string> = {
	0: "On Foot",
	1: "Bicycle",
	2: "Motorcycle",
	3: "Car",
};

const approvalColors: Record<number, string> = {
	0: "bg-yellow-100 text-yellow-800",
	1: "bg-green-100 text-green-800",
	2: "bg-red-100 text-red-800",
};

export default function RidersPage() {
	const queryClient = useQueryClient();
	const [page, setPage] = useState(1);
	const [search, setSearch] = useState("");
	const [tab, setTab] = useState<"all" | "pending">("pending");
	const pageSize = 20;

	const { data: res, isLoading } = useQuery({
		queryKey: ["riders", page, search, tab],
		queryFn: () =>
			api.get<RiderProfileDto[]>("/admin/riders", {
				page,
				pageSize,
				...(search && { search }),
				...(tab === "pending" && { approvalStatus: "0" }),
			}),
	});

	const riders = res?.data ?? [];
	const meta = res?.meta;

	const approveMutation = useMutation({
		mutationFn: ({
			riderId,
			body,
		}: {
			riderId: string;
			body: ApproveRiderRequest;
		}) => api.patch(`/admin/riders/${riderId}/approve`, body),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["riders"] });
		},
	});

	const handleApprove = (riderId: string) => {
		approveMutation.mutate({
			riderId,
			body: { status: ApprovalStatus.Approved },
		});
	};

	const handleReject = (riderId: string) => {
		const reason = window.prompt("Reason for rejection (optional):");
		approveMutation.mutate({
			riderId,
			body: { status: ApprovalStatus.Rejected, reason: reason ?? undefined },
		});
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div>
				<h1 className="text-2xl font-bold text-slate-900 dark:text-white">
					Riders
				</h1>
				<p className="mt-1 text-sm text-slate-500">
					Manage and approve rider accounts
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
					All Riders
				</button>
			</div>

			{/* Search */}
			<div className="relative max-w-md">
				<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
				<input
					type="text"
					placeholder="Search riders…"
					value={search}
					onChange={(e) => {
						setSearch(e.target.value);
						setPage(1);
					}}
					className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
				/>
			</div>

			{/* Table */}
			<div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
				<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b border-slate-200 text-left dark:border-slate-800">
								<th className="whitespace-nowrap px-6 py-3 font-medium text-slate-500 dark:text-slate-400">
									Rider
								</th>
								<th className="whitespace-nowrap px-6 py-3 font-medium text-slate-500 dark:text-slate-400">
									Vehicle
								</th>
								<th className="whitespace-nowrap px-6 py-3 font-medium text-slate-500 dark:text-slate-400">
									Rating
								</th>
								<th className="whitespace-nowrap px-6 py-3 font-medium text-slate-500 dark:text-slate-400">
									Completed
								</th>
								<th className="whitespace-nowrap px-6 py-3 font-medium text-slate-500 dark:text-slate-400">
									Status
								</th>
								<th className="whitespace-nowrap px-6 py-3 font-medium text-slate-500 dark:text-slate-400">
									Online
								</th>
								<th className="whitespace-nowrap px-6 py-3 font-medium text-slate-500 dark:text-slate-400">
									Joined
								</th>
								{tab === "pending" && (
									<th className="whitespace-nowrap px-6 py-3 font-medium text-slate-500 dark:text-slate-400">
										Actions
									</th>
								)}
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-200 dark:divide-slate-800">
							{isLoading ? (
								Array.from({ length: 6 }).map((_, i) => (
									<tr key={i}>
										{Array.from({ length: tab === "pending" ? 8 : 7 }).map(
											(_, j) => (
												<td key={j} className="px-6 py-3">
													<div className="h-4 w-20 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
												</td>
											),
										)}
									</tr>
								))
							) : riders.length === 0 ? (
								<tr>
									<td
										colSpan={tab === "pending" ? 8 : 7}
										className="px-6 py-12 text-center text-slate-500">
										{tab === "pending"
											? "No riders pending approval"
											: "No riders found"}
									</td>
								</tr>
							) : (
								riders.map((rider) => (
									<tr
										key={rider.id}
										className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
										<td className="whitespace-nowrap px-6 py-3">
											<div className="flex items-center gap-3">
												<div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-xs font-semibold text-green-700 dark:bg-green-900/50 dark:text-green-400">
													{rider.riderName
														.split(" ")
														.map((n) => n[0])
														.join("")
														.slice(0, 2)}
												</div>
												<span className="font-medium text-slate-900 dark:text-white">
													{rider.riderName}
												</span>
											</div>
										</td>
										<td className="whitespace-nowrap px-6 py-3 text-slate-600 dark:text-slate-400">
											{vehicleTypeLabel[rider.vehicleType] ?? "Unknown"}
										</td>
										<td className="whitespace-nowrap px-6 py-3 text-slate-600 dark:text-slate-400">
											⭐ {rider.rating.toFixed(1)}
										</td>
										<td className="whitespace-nowrap px-6 py-3 text-slate-600 dark:text-slate-400">
											{rider.totalCompletedTasks}
										</td>
										<td className="whitespace-nowrap px-6 py-3">
											<span
												className={cn(
													"inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
													approvalColors[rider.approvalStatus] ??
														"bg-slate-100 text-slate-800",
												)}>
												{approvalStatusLabel[rider.approvalStatus] ?? "Unknown"}
											</span>
										</td>
										<td className="whitespace-nowrap px-6 py-3">
											<span
												className={cn(
													"inline-flex h-2.5 w-2.5 rounded-full",
													rider.isOnline
														? "bg-green-500"
														: "bg-slate-300 dark:bg-slate-600",
												)}
											/>
										</td>
										<td className="whitespace-nowrap px-6 py-3 text-slate-600 dark:text-slate-400">
											{format(new Date(rider.createdAt), "MMM d, yyyy")}
										</td>
										{tab === "pending" && (
											<td className="whitespace-nowrap px-6 py-3">
												<div className="flex items-center gap-2">
													<button
														onClick={() => handleApprove(rider.id)}
														disabled={approveMutation.isPending}
														className="inline-flex items-center gap-1 rounded-lg bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 transition-colors hover:bg-green-100 disabled:opacity-50 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50">
														<CheckCircle className="h-3.5 w-3.5" />
														Approve
													</button>
													<button
														onClick={() => handleReject(rider.id)}
														disabled={approveMutation.isPending}
														className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50">
														<XCircle className="h-3.5 w-3.5" />
														Reject
													</button>
												</div>
											</td>
										)}
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
							riders
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
