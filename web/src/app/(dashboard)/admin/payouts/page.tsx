"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { api } from "@/lib/api/client";
import { cn, formatCurrency } from "@/lib/utils";
import type { RiderPayoutDto } from "@/types";
import { PayoutStatus } from "@/types";

const payoutStatusLabel: Record<number, string> = {
	[PayoutStatus.Pending]: "Pending",
	[PayoutStatus.Processing]: "Processing",
	[PayoutStatus.Completed]: "Completed",
	[PayoutStatus.Failed]: "Failed",
};

const payoutStatusColor: Record<number, string> = {
	[PayoutStatus.Pending]:
		"bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
	[PayoutStatus.Processing]:
		"bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
	[PayoutStatus.Completed]:
		"bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
	[PayoutStatus.Failed]:
		"bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

export default function PayoutsPage() {
	const queryClient = useQueryClient();
	const [tab, setTab] = useState<"pending" | "all">("pending");

	const { data: res, isLoading } = useQuery({
		queryKey: ["payouts", tab],
		queryFn: () => api.get<RiderPayoutDto[]>("/admin/payouts/pending"),
	});

	const processPayoutMutation = useMutation({
		mutationFn: (id: string) => api.post(`/admin/payouts/${id}/process`),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ["payouts"] }),
	});

	const allPayouts = res?.data ?? [];
	const payouts =
		tab === "pending"
			? allPayouts.filter((p) => p.status === PayoutStatus.Pending)
			: allPayouts;

	return (
		<div className="space-y-6">
			{/* Header */}
			<div>
				<h1 className="text-2xl font-bold text-slate-900 dark:text-white">
					Payouts
				</h1>
				<p className="mt-1 text-sm text-slate-500">
					Manage rider payout processing
				</p>
			</div>

			{/* Tabs */}
			<div className="flex gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
				<button
					onClick={() => setTab("pending")}
					className={cn(
						"rounded-md px-4 py-2 text-sm font-medium transition-colors",
						tab === "pending"
							? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
							: "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white",
					)}>
					Pending
				</button>
				<button
					onClick={() => setTab("all")}
					className={cn(
						"rounded-md px-4 py-2 text-sm font-medium transition-colors",
						tab === "all"
							? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
							: "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white",
					)}>
					All Payouts
				</button>
			</div>

			{/* Table */}
			<div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
				<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b border-slate-200 text-left dark:border-slate-800">
								{[
									"Payout ID",
									"Amount",
									"Bank",
									"Account",
									"Period",
									"Errands",
									"Status",
									"Reference",
									...(tab === "pending" ? ["Action"] : []),
								].map((h) => (
									<th
										key={h}
										className="whitespace-nowrap px-6 py-3 font-medium text-slate-500 dark:text-slate-400">
										{h}
									</th>
								))}
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-200 dark:divide-slate-800">
							{isLoading ? (
								Array.from({ length: 6 }).map((_, i) => (
									<tr key={i}>
										{Array.from({ length: tab === "pending" ? 9 : 8 }).map(
											(_, j) => (
												<td key={j} className="px-6 py-3">
													<div className="h-4 w-20 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
												</td>
											),
										)}
									</tr>
								))
							) : payouts.length === 0 ? (
								<tr>
									<td
										colSpan={tab === "pending" ? 9 : 8}
										className="px-6 py-12 text-center text-slate-500">
										{tab === "pending"
											? "No pending payouts"
											: "No payouts found"}
									</td>
								</tr>
							) : (
								payouts.map((payout) => (
									<tr
										key={payout.id}
										className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
										<td className="whitespace-nowrap px-6 py-4 font-mono text-xs text-slate-900 dark:text-white">
											{payout.id.substring(0, 8)}…
										</td>
										<td className="whitespace-nowrap px-6 py-4 font-semibold text-slate-900 dark:text-white">
											{formatCurrency(payout.amount)}
										</td>
										<td className="whitespace-nowrap px-6 py-4 text-slate-600 dark:text-slate-400">
											{payout.destinationBankName || "—"}
										</td>
										<td className="whitespace-nowrap px-6 py-4 font-mono text-xs text-slate-600 dark:text-slate-400">
											{payout.destinationAccountNumber || "—"}
										</td>
										<td className="whitespace-nowrap px-6 py-4 text-slate-600 dark:text-slate-400">
											{new Date(payout.periodStart).toLocaleDateString()} –{" "}
											{new Date(payout.periodEnd).toLocaleDateString()}
										</td>
										<td className="whitespace-nowrap px-6 py-4 text-center text-slate-600 dark:text-slate-400">
											{payout.errandCount}
										</td>
										<td className="whitespace-nowrap px-6 py-4">
											<span
												className={cn(
													"inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
													payoutStatusColor[payout.status],
												)}>
												{payoutStatusLabel[payout.status]}
											</span>
										</td>
										<td className="whitespace-nowrap px-6 py-4 font-mono text-xs text-slate-500 dark:text-slate-400">
											{payout.paymentReference
												? payout.paymentReference.substring(0, 12) + "…"
												: "—"}
										</td>
										{tab === "pending" && (
											<td className="whitespace-nowrap px-6 py-4">
												{payout.status === PayoutStatus.Pending && (
													<button
														onClick={() =>
															processPayoutMutation.mutate(payout.id)
														}
														disabled={processPayoutMutation.isPending}
														className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50">
														Process
													</button>
												)}
											</td>
										)}
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
