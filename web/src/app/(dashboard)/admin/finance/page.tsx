"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
	DollarSign,
	TrendingUp,
	ArrowDownRight,
	ArrowUpRight,
	Clock,
	CreditCard,
	Tag,
	Plus,
} from "lucide-react";
import { useState } from "react";
import { api } from "@/lib/api/client";
import { cn, formatCurrency } from "@/lib/utils";
import type {
	PromoCodeDto,
	RiderPayoutDto,
	WalletTransactionDto,
} from "@/types";
import { PayoutStatus, DiscountType } from "@/types";

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

export default function FinancePage() {
	const queryClient = useQueryClient();
	const [showPromoForm, setShowPromoForm] = useState(false);

	// Finance Stats
	const { data: financeRes } = useQuery({
		queryKey: ["finance-stats"],
		queryFn: () =>
			api.get<{ totalRevenue: number; commissionEarned: number }>(
				"/admin/finance/stats",
			),
	});

	// Promo Codes
	const { data: promoRes, isLoading: loadingPromos } = useQuery({
		queryKey: ["promo-codes"],
		queryFn: () =>
			api.get<PromoCodeDto[]>("/payments/promo", { page: 1, pageSize: 50 }),
	});

	// Pending Payouts
	const { data: payoutsRes, isLoading: loadingPayouts } = useQuery({
		queryKey: ["pending-payouts"],
		queryFn: () => api.get<RiderPayoutDto[]>("/admin/payouts/pending"),
	});

	const processPayoutMutation = useMutation({
		mutationFn: (id: string) => api.post(`/admin/payouts/${id}/process`),
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: ["pending-payouts"] }),
	});

	const promoCodes = promoRes?.data ?? [];
	const payouts = payoutsRes?.data ?? [];
	const financeStats = financeRes?.data;

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
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{[
					{
						label: "Total Revenue",
						value: formatCurrency(financeStats?.totalRevenue ?? 0),
						icon: DollarSign,
						color: "text-green-600 bg-green-50 dark:bg-green-900/30",
					},
					{
						label: "Commission Earned",
						value: formatCurrency(financeStats?.commissionEarned ?? 0),
						icon: TrendingUp,
						color: "text-blue-600 bg-blue-50 dark:bg-blue-900/30",
					},
					{
						label: "Pending Payouts",
						value: payouts.length,
						icon: Clock,
						color: "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/30",
					},
					{
						label: "Active Promos",
						value: promoCodes.filter((p) => p.isActive).length,
						icon: Tag,
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

			{/* Promo Codes */}
			<div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
				<div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
					<h2 className="text-lg font-semibold text-slate-900 dark:text-white">
						Promo Codes
					</h2>
					<button
						onClick={() => setShowPromoForm(!showPromoForm)}
						className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">
						<Plus className="h-4 w-4" />
						Add Code
					</button>
				</div>

				{showPromoForm && (
					<PromoCodeForm onClose={() => setShowPromoForm(false)} />
				)}

				<div className="overflow-x-auto">
					<table className="w-full">
						<thead>
							<tr className="border-b border-slate-200 dark:border-slate-800">
								{[
									"Code",
									"Type",
									"Value",
									"Usage",
									"Min Order",
									"Expires",
									"Status",
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
							{loadingPromos ? (
								<tr>
									<td
										colSpan={7}
										className="px-6 py-8 text-center text-slate-500">
										Loading...
									</td>
								</tr>
							) : promoCodes.length === 0 ? (
								<tr>
									<td
										colSpan={7}
										className="px-6 py-8 text-center text-slate-500">
										No promo codes
									</td>
								</tr>
							) : (
								promoCodes.map((promo) => (
									<tr
										key={promo.id}
										className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
										<td className="px-6 py-4 font-mono text-sm font-semibold text-slate-900 dark:text-white">
											{promo.code}
										</td>
										<td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
											{promo.discountType === DiscountType.Percentage
												? "%"
												: "Flat"}
										</td>
										<td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
											{promo.discountType === DiscountType.Percentage
												? `${promo.discountValue}%`
												: formatCurrency(promo.discountValue)}
										</td>
										<td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
											{promo.usedCount}/{promo.usageLimit || "∞"}
										</td>
										<td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
											{promo.minOrderAmount
												? formatCurrency(promo.minOrderAmount)
												: "—"}
										</td>
										<td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
											{promo.expiresAt
												? new Date(promo.expiresAt).toLocaleDateString()
												: "Never"}
										</td>
										<td className="px-6 py-4">
											<span
												className={cn(
													"inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
													promo.isActive
														? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
														: "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-400",
												)}>
												{promo.isActive ? "Active" : "Inactive"}
											</span>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			</div>

			{/* Pending Payouts */}
			<div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
				<div className="border-b border-slate-200 px-6 py-4 dark:border-slate-800">
					<h2 className="text-lg font-semibold text-slate-900 dark:text-white">
						Pending Payouts
					</h2>
				</div>
				<div className="overflow-x-auto">
					<table className="w-full">
						<thead>
							<tr className="border-b border-slate-200 dark:border-slate-800">
								{[
									"Rider",
									"Amount",
									"Period",
									"Errands",
									"Status",
									"Action",
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
							{loadingPayouts ? (
								<tr>
									<td
										colSpan={6}
										className="px-6 py-8 text-center text-slate-500">
										Loading...
									</td>
								</tr>
							) : payouts.length === 0 ? (
								<tr>
									<td
										colSpan={6}
										className="px-6 py-8 text-center text-slate-500">
										No pending payouts
									</td>
								</tr>
							) : (
								payouts.map((payout) => (
									<tr
										key={payout.id}
										className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
										<td className="px-6 py-4 text-sm text-slate-900 dark:text-white">
											{payout.id.substring(0, 8)}
										</td>
										<td className="px-6 py-4 text-sm font-semibold text-slate-900 dark:text-white">
											{formatCurrency(payout.amount)}
										</td>
										<td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
											{new Date(payout.periodStart).toLocaleDateString()} –{" "}
											{new Date(payout.periodEnd).toLocaleDateString()}
										</td>
										<td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
											{payout.errandCount}
										</td>
										<td className="px-6 py-4">
											<span
												className={cn(
													"inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
													payoutStatusColor[payout.status],
												)}>
												{payoutStatusLabel[payout.status]}
											</span>
										</td>
										<td className="px-6 py-4">
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

function PromoCodeForm({ onClose }: { onClose: () => void }) {
	const queryClient = useQueryClient();
	const [formData, setFormData] = useState({
		code: "",
		discountType: DiscountType.Percentage,
		discountValue: 10,
		maxDiscount: "",
		minOrderAmount: "",
		usageLimit: 100,
		expiresAt: "",
	});

	const createMutation = useMutation({
		mutationFn: (data: typeof formData) =>
			api.post("/payments/promo", {
				...data,
				maxDiscount: data.maxDiscount ? Number(data.maxDiscount) : null,
				minOrderAmount: data.minOrderAmount
					? Number(data.minOrderAmount)
					: null,
				expiresAt: data.expiresAt || null,
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["promo-codes"] });
			onClose();
		},
	});

	return (
		<div className="border-b border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-800/50">
			<div className="grid gap-4 sm:grid-cols-3">
				<div>
					<label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
						Code
					</label>
					<input
						type="text"
						value={formData.code}
						onChange={(e) =>
							setFormData({ ...formData, code: e.target.value.toUpperCase() })
						}
						className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white"
						placeholder="SAVE20"
					/>
				</div>
				<div>
					<label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
						Discount Type
					</label>
					<select
						value={formData.discountType}
						onChange={(e) =>
							setFormData({
								...formData,
								discountType: Number(e.target.value) as DiscountType,
							})
						}
						className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white">
						<option value={DiscountType.Percentage}>Percentage</option>
						<option value={DiscountType.FlatAmount}>Flat Amount</option>
					</select>
				</div>
				<div>
					<label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
						Value
					</label>
					<input
						type="number"
						value={formData.discountValue}
						onChange={(e) =>
							setFormData({
								...formData,
								discountValue: Number(e.target.value),
							})
						}
						className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white"
					/>
				</div>
				<div>
					<label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
						Max Discount (optional)
					</label>
					<input
						type="number"
						value={formData.maxDiscount}
						onChange={(e) =>
							setFormData({ ...formData, maxDiscount: e.target.value })
						}
						className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white"
					/>
				</div>
				<div>
					<label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
						Usage Limit
					</label>
					<input
						type="number"
						value={formData.usageLimit}
						onChange={(e) =>
							setFormData({ ...formData, usageLimit: Number(e.target.value) })
						}
						className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white"
					/>
				</div>
				<div>
					<label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
						Expires At (optional)
					</label>
					<input
						type="date"
						value={formData.expiresAt}
						onChange={(e) =>
							setFormData({ ...formData, expiresAt: e.target.value })
						}
						className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white"
					/>
				</div>
			</div>
			<div className="mt-4 flex gap-3">
				<button
					onClick={() => createMutation.mutate(formData)}
					disabled={createMutation.isPending || !formData.code}
					className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
					{createMutation.isPending ? "Creating..." : "Create Promo"}
				</button>
				<button
					onClick={onClose}
					className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700">
					Cancel
				</button>
			</div>
		</div>
	);
}
