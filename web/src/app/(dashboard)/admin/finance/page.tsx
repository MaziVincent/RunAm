"use client";

import { useQuery } from "@tanstack/react-query";
import {
	DollarSign,
	TrendingUp,
	Clock,
	ArrowUpDown,
	Tag,
	Wallet,
	ArrowRight,
} from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { cn, formatCurrency } from "@/lib/utils";
import { PaymentStatus, PaymentMethod } from "@/types";

interface FinanceStats {
	totalRevenue: number;
	commissionEarned: number;
	pendingPayments: number;
	todayRevenue: number;
	totalTransactions: number;
}

interface AdminPayment {
	id: string;
	errandId: string;
	payerName: string;
	amount: number;
	currency: string;
	paymentMethod: number;
	paymentGatewayRef: string | null;
	status: number;
	createdAt: string;
}

const paymentStatusLabel: Record<number, string> = {
	[PaymentStatus.Pending]: "Pending",
	[PaymentStatus.Completed]: "Completed",
	[PaymentStatus.Failed]: "Failed",
	[PaymentStatus.Refunded]: "Refunded",
};

const paymentStatusColor: Record<number, string> = {
	[PaymentStatus.Pending]:
		"bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
	[PaymentStatus.Completed]:
		"bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
	[PaymentStatus.Failed]:
		"bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
	[PaymentStatus.Refunded]:
		"bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
};

const paymentMethodLabel: Record<number, string> = {
	[PaymentMethod.Wallet]: "Wallet",
	[PaymentMethod.Card]: "Card",
	[PaymentMethod.MobileMoney]: "Mobile Money",
	[PaymentMethod.BankTransfer]: "Bank Transfer",
	[PaymentMethod.Cash]: "Cash",
};

export default function FinancePage() {
	const router = useRouter();
	const [paymentPage, setPaymentPage] = useState(1);
	const [statusFilter, setStatusFilter] = useState<number | undefined>(
		undefined,
	);

	// Finance Stats
	const { data: financeRes } = useQuery({
		queryKey: ["finance-stats"],
		queryFn: () => api.get<FinanceStats>("/admin/finance/stats"),
	});

	// Payments
	const { data: paymentsRes, isLoading: loadingPayments } = useQuery({
		queryKey: ["admin-payments", paymentPage, statusFilter],
		queryFn: () =>
			api.get<AdminPayment[]>("/admin/payments", {
				page: paymentPage,
				pageSize: 15,
				...(statusFilter !== undefined && { status: statusFilter }),
			}),
	});

	const financeStats = financeRes?.data;
	const payments = paymentsRes?.data ?? [];
	const paymentsMeta = paymentsRes?.meta;

	return (
		<div className="space-y-8">
			{/* Header */}
			<div>
				<h1 className="text-2xl font-bold text-slate-900 dark:text-white">
					Finance
				</h1>
				<p className="mt-1 text-sm text-slate-500">
					Manage payments, promo codes, and rider payouts
				</p>
			</div>

			{/* Summary Cards */}
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
				{[
					{
						label: "Total Revenue",
						value: formatCurrency(financeStats?.totalRevenue ?? 0),
						icon: DollarSign,
						color: "text-green-600 bg-green-50 dark:bg-green-900/30",
					},
					{
						label: "Today's Revenue",
						value: formatCurrency(financeStats?.todayRevenue ?? 0),
						icon: TrendingUp,
						color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30",
					},
					{
						label: "Commission Earned",
						value: formatCurrency(financeStats?.commissionEarned ?? 0),
						icon: TrendingUp,
						color: "text-blue-600 bg-blue-50 dark:bg-blue-900/30",
					},
					{
						label: "Pending Payments",
						value: formatCurrency(financeStats?.pendingPayments ?? 0),
						icon: Clock,
						color: "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/30",
					},
					{
						label: "Total Transactions",
						value: financeStats?.totalTransactions ?? 0,
						icon: ArrowUpDown,
						color: "text-purple-600 bg-purple-50 dark:bg-purple-900/30",
					},
				].map((card) => (
					<div
						key={card.label}
						className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
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
					</div>
				))}
			</div>

			{/* Payments / Financial Records */}
			<div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
				<div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
					<h2 className="text-lg font-semibold text-slate-900 dark:text-white">
						Financial Records
					</h2>
					<select
						value={statusFilter ?? ""}
						onChange={(e) =>
							setStatusFilter(
								e.target.value === "" ? undefined : Number(e.target.value),
							)
						}
						className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white">
						<option value="">All Statuses</option>
						<option value={PaymentStatus.Pending}>Pending</option>
						<option value={PaymentStatus.Completed}>Completed</option>
						<option value={PaymentStatus.Failed}>Failed</option>
						<option value={PaymentStatus.Refunded}>Refunded</option>
					</select>
				</div>
				<div className="overflow-x-auto">
					<table className="w-full">
						<thead>
							<tr className="border-b border-slate-200 dark:border-slate-800">
								{[
									"Payer",
									"Amount",
									"Method",
									"Reference",
									"Status",
									"Date",
								].map((h) => (
									<th
										key={h}
										className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
										{h}
									</th>
								))}
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-200 dark:divide-slate-800">
							{loadingPayments ? (
								<tr>
									<td
										colSpan={6}
										className="px-6 py-8 text-center text-slate-500">
										Loading...
									</td>
								</tr>
							) : payments.length === 0 ? (
								<tr>
									<td
										colSpan={6}
										className="px-6 py-8 text-center text-slate-500">
										No financial records found
									</td>
								</tr>
							) : (
								payments.map((payment) => (
									<tr
										key={payment.id}
										onClick={() => router.push(`/admin/finance/${payment.id}`)}
										className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
										<td className="px-6 py-4 text-sm text-slate-900 dark:text-white">
											{payment.payerName}
										</td>
										<td className="px-6 py-4 text-sm font-semibold text-slate-900 dark:text-white">
											{formatCurrency(payment.amount)}
										</td>
										<td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
											{paymentMethodLabel[payment.paymentMethod] ?? "Unknown"}
										</td>
										<td className="px-6 py-4 font-mono text-xs text-slate-500 dark:text-slate-400">
											{payment.paymentGatewayRef
												? payment.paymentGatewayRef.substring(0, 12) + "…"
												: "—"}
										</td>
										<td className="px-6 py-4">
											<span
												className={cn(
													"inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
													paymentStatusColor[payment.status],
												)}>
												{paymentStatusLabel[payment.status]}
											</span>
										</td>
										<td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
											{new Date(payment.createdAt).toLocaleDateString()}
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
				{paymentsMeta && paymentsMeta.totalPages > 1 && (
					<div className="flex items-center justify-between border-t border-slate-200 px-6 py-3 dark:border-slate-800">
						<span className="text-sm text-slate-500">
							Page {paymentsMeta.page} of {paymentsMeta.totalPages} (
							{paymentsMeta.totalCount} records)
						</span>
						<div className="flex gap-2">
							<button
								onClick={() => setPaymentPage((p) => Math.max(1, p - 1))}
								disabled={paymentPage <= 1}
								className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-50 dark:border-slate-600 dark:text-white">
								Previous
							</button>
							<button
								onClick={() =>
									setPaymentPage((p) =>
										Math.min(paymentsMeta.totalPages, p + 1),
									)
								}
								disabled={paymentPage >= paymentsMeta.totalPages}
								className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-50 dark:border-slate-600 dark:text-white">
								Next
							</button>
						</div>
					</div>
				)}
			</div>

			{/* Quick Links */}
			<div className="grid gap-4 sm:grid-cols-2">
				<Link
					href="/admin/promo-codes"
					className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white p-6 transition-colors hover:border-blue-300 hover:bg-blue-50/50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-800 dark:hover:bg-blue-900/10">
					<div className="flex items-center gap-4">
						<div className="rounded-lg bg-purple-50 p-3 text-purple-600 dark:bg-purple-900/30">
							<Tag className="h-5 w-5" />
						</div>
						<div>
							<h3 className="font-semibold text-slate-900 dark:text-white">
								Promo Codes
							</h3>
							<p className="text-sm text-slate-500">
								Create and manage discount codes
							</p>
						</div>
					</div>
					<ArrowRight className="h-5 w-5 text-slate-400 transition-transform group-hover:translate-x-1" />
				</Link>
				<Link
					href="/admin/payouts"
					className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white p-6 transition-colors hover:border-blue-300 hover:bg-blue-50/50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-800 dark:hover:bg-blue-900/10">
					<div className="flex items-center gap-4">
						<div className="rounded-lg bg-green-50 p-3 text-green-600 dark:bg-green-900/30">
							<Wallet className="h-5 w-5" />
						</div>
						<div>
							<h3 className="font-semibold text-slate-900 dark:text-white">
								Payouts
							</h3>
							<p className="text-sm text-slate-500">
								Process rider payout requests
							</p>
						</div>
					</div>
					<ArrowRight className="h-5 w-5 text-slate-400 transition-transform group-hover:translate-x-1" />
				</Link>
			</div>
		</div>
	);
}
