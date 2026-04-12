"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { api } from "@/lib/api/client";
import { cn, formatCurrency } from "@/lib/utils";
import type { PromoCodeDto } from "@/types";
import { DiscountType } from "@/types";

export default function PromoCodesPage() {
	const queryClient = useQueryClient();
	const [showForm, setShowForm] = useState(false);
	const [page, setPage] = useState(1);
	const [search, setSearch] = useState("");
	const pageSize = 20;

	const { data: res, isLoading } = useQuery({
		queryKey: ["promo-codes", page],
		queryFn: () =>
			api.get<PromoCodeDto[]>("/payments/promo", { page, pageSize }),
	});

	const promoCodes = res?.data ?? [];
	const meta = res?.meta;

	// Client-side search filter
	const filtered = search
		? promoCodes.filter((p) =>
				p.code.toLowerCase().includes(search.toLowerCase()),
			)
		: promoCodes;

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold text-slate-900 dark:text-white">
						Promo Codes
					</h1>
					<p className="mt-1 text-sm text-slate-500">
						Create and manage discount codes
					</p>
				</div>
				<button
					onClick={() => setShowForm(!showForm)}
					className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
					<Plus className="h-4 w-4" />
					Add Code
				</button>
			</div>

			{/* Create Form */}
			{showForm && <PromoCodeForm onClose={() => setShowForm(false)} />}

			{/* Search */}
			<div className="relative max-w-md">
				<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
				<input
					type="text"
					placeholder="Search codes…"
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
				/>
			</div>

			{/* Table */}
			<div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
				<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b border-slate-200 text-left dark:border-slate-800">
								{[
									"Code",
									"Type",
									"Value",
									"Usage",
									"Min Order",
									"Max Discount",
									"Expires",
									"Status",
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
										{Array.from({ length: 8 }).map((_, j) => (
											<td key={j} className="px-6 py-3">
												<div className="h-4 w-20 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
											</td>
										))}
									</tr>
								))
							) : filtered.length === 0 ? (
								<tr>
									<td
										colSpan={8}
										className="px-6 py-12 text-center text-slate-500">
										{search ? "No matching promo codes" : "No promo codes yet"}
									</td>
								</tr>
							) : (
								filtered.map((promo) => (
									<tr
										key={promo.id}
										className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
										<td className="whitespace-nowrap px-6 py-4 font-mono font-semibold text-slate-900 dark:text-white">
											{promo.code}
										</td>
										<td className="whitespace-nowrap px-6 py-4 text-slate-600 dark:text-slate-400">
											{promo.discountType === DiscountType.Percentage
												? "Percentage"
												: "Flat Amount"}
										</td>
										<td className="whitespace-nowrap px-6 py-4 text-slate-600 dark:text-slate-400">
											{promo.discountType === DiscountType.Percentage
												? `${promo.discountValue}%`
												: formatCurrency(promo.discountValue)}
										</td>
										<td className="whitespace-nowrap px-6 py-4 text-slate-600 dark:text-slate-400">
											{promo.usedCount}/{promo.usageLimit || "∞"}
										</td>
										<td className="whitespace-nowrap px-6 py-4 text-slate-600 dark:text-slate-400">
											{promo.minOrderAmount
												? formatCurrency(promo.minOrderAmount)
												: "—"}
										</td>
										<td className="whitespace-nowrap px-6 py-4 text-slate-600 dark:text-slate-400">
											{promo.maxDiscount
												? formatCurrency(promo.maxDiscount)
												: "—"}
										</td>
										<td className="whitespace-nowrap px-6 py-4 text-slate-600 dark:text-slate-400">
											{promo.expiresAt
												? new Date(promo.expiresAt).toLocaleDateString()
												: "Never"}
										</td>
										<td className="whitespace-nowrap px-6 py-4">
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

				{/* Pagination */}
				{meta && meta.totalPages > 1 && (
					<div className="flex items-center justify-between border-t border-slate-200 px-6 py-3 dark:border-slate-800">
						<p className="text-sm text-slate-500">
							Page {meta.page} of {meta.totalPages} &middot; {meta.totalCount}{" "}
							codes
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
		<div className="rounded-xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-800/50">
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
