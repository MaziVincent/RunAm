"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ArrowLeft, MapPin, User, Bike } from "lucide-react";
import { api } from "@/lib/api/client";
import {
	cn,
	errandStatusLabel,
	errandStatusColor,
	errandCategoryLabel,
	formatCurrency,
} from "@/lib/utils";
import type { ErrandDto, RiderProfileDto } from "@/types";
import { useState } from "react";
import { toast } from "sonner";

export default function AdminErrandDetailPage() {
	const { id } = useParams<{ id: string }>();
	const router = useRouter();
	const queryClient = useQueryClient();
	const [showAssign, setShowAssign] = useState(false);

	const { data: errandRes, isLoading } = useQuery({
		queryKey: ["admin-errand", id],
		queryFn: () => api.get<ErrandDto>(`/admin/errands/${id}`),
		enabled: !!id,
	});

	const { data: ridersRes } = useQuery({
		queryKey: ["available-riders"],
		queryFn: () => api.get<RiderProfileDto[]>("/admin/riders/available"),
		enabled: showAssign,
	});

	const assignMutation = useMutation({
		mutationFn: async (riderId: string) => {
			const response = await api.patch<ErrandDto>(
				`/admin/errands/${id}/assign-rider`,
				{ riderId },
			);

			if (!response.success) {
				throw new Error(response.error?.message ?? "Failed to assign rider");
			}

			return response.data;
		},
		onSuccess: () => {
			toast.success("Rider assigned successfully");
			queryClient.invalidateQueries({ queryKey: ["admin-errand", id] });
			setShowAssign(false);
		},
		onError: (error) =>
			toast.error(
				error instanceof Error ? error.message : "Failed to assign rider",
			),
	});

	const errand = errandRes?.data;

	if (isLoading) {
		return (
			<div className="space-y-6">
				<div className="h-8 w-48 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
				<div className="h-64 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-700" />
			</div>
		);
	}

	if (!errand) {
		return (
			<div className="py-20 text-center text-slate-500">Errand not found</div>
		);
	}

	const riders = ridersRes?.data ?? [];

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center gap-4">
				<button
					onClick={() => router.back()}
					className="rounded-lg border border-slate-300 p-2 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">
					<ArrowLeft className="h-4 w-4" />
				</button>
				<div className="flex-1">
					<h1 className="text-2xl font-bold text-slate-900 dark:text-white">
						Errand Details
					</h1>
					<p className="mt-0.5 font-mono text-sm text-slate-500">{errand.id}</p>
				</div>
				<span
					className={cn(
						"rounded-full px-3 py-1 text-sm font-medium",
						errandStatusColor[errand.status],
					)}>
					{errandStatusLabel[errand.status]}
				</span>
			</div>

			<div className="grid gap-6 lg:grid-cols-2">
				{/* Left column */}
				<div className="space-y-6">
					{/* Overview */}
					<div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
						<h2 className="text-lg font-semibold text-slate-900 dark:text-white">
							Overview
						</h2>
						<dl className="mt-4 space-y-3 text-sm">
							<div className="flex justify-between">
								<dt className="text-slate-500">Category</dt>
								<dd className="font-medium text-slate-900 dark:text-white">
									{errandCategoryLabel[errand.category]}
								</dd>
							</div>
							<div className="flex justify-between">
								<dt className="text-slate-500">Amount</dt>
								<dd className="font-medium text-slate-900 dark:text-white">
									{formatCurrency(errand.totalAmount)}
								</dd>
							</div>
							{errand.description && (
								<div className="flex justify-between">
									<dt className="text-slate-500">Description</dt>
									<dd className="max-w-[60%] text-right font-medium text-slate-900 dark:text-white">
										{errand.description}
									</dd>
								</div>
							)}
							{errand.specialInstructions && (
								<div className="flex justify-between">
									<dt className="text-slate-500">Special Instructions</dt>
									<dd className="max-w-[60%] text-right font-medium text-slate-900 dark:text-white">
										{errand.specialInstructions}
									</dd>
								</div>
							)}
							<div className="flex justify-between">
								<dt className="text-slate-500">Created</dt>
								<dd className="font-medium text-slate-900 dark:text-white">
									{format(new Date(errand.createdAt), "PPp")}
								</dd>
							</div>
							{errand.scheduledAt && (
								<div className="flex justify-between">
									<dt className="text-slate-500">Scheduled</dt>
									<dd className="font-medium text-slate-900 dark:text-white">
										{format(new Date(errand.scheduledAt), "PPp")}
									</dd>
								</div>
							)}
							{errand.vendorName && (
								<div className="flex justify-between">
									<dt className="text-slate-500">Vendor</dt>
									<dd className="font-medium text-slate-900 dark:text-white">
										{errand.vendorName}
									</dd>
								</div>
							)}
						</dl>
					</div>

					{/* Locations */}
					<div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
						<h2 className="text-lg font-semibold text-slate-900 dark:text-white">
							Locations
						</h2>
						<div className="mt-4 space-y-4">
							<div className="flex items-start gap-3">
								<div className="mt-0.5 rounded-full bg-green-100 p-1.5 dark:bg-green-900/30">
									<MapPin className="h-4 w-4 text-green-600" />
								</div>
								<div>
									<p className="text-xs font-medium text-slate-500">Pickup</p>
									<p className="text-sm text-slate-900 dark:text-white">
										{errand.pickupAddress}
									</p>
								</div>
							</div>
							<div className="flex items-start gap-3">
								<div className="mt-0.5 rounded-full bg-red-100 p-1.5 dark:bg-red-900/30">
									<MapPin className="h-4 w-4 text-red-600" />
								</div>
								<div>
									<p className="text-xs font-medium text-slate-500">Dropoff</p>
									<p className="text-sm text-slate-900 dark:text-white">
										{errand.dropoffAddress}
									</p>
								</div>
							</div>
						</div>
						{errand.recipientName && (
							<div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-700">
								<p className="text-xs font-medium text-slate-500">Recipient</p>
								<p className="text-sm text-slate-900 dark:text-white">
									{errand.recipientName}
									{errand.recipientPhone && ` · ${errand.recipientPhone}`}
								</p>
							</div>
						)}
					</div>
				</div>

				{/* Right column */}
				<div className="space-y-6">
					{/* Customer & Rider */}
					<div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
						<h2 className="text-lg font-semibold text-slate-900 dark:text-white">
							People
						</h2>
						<div className="mt-4 space-y-4">
							<div className="flex items-center gap-3">
								<div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900/30">
									<User className="h-4 w-4 text-blue-600" />
								</div>
								<div>
									<p className="text-xs font-medium text-slate-500">Customer</p>
									<p className="text-sm font-medium text-slate-900 dark:text-white">
										{errand.customerName}
									</p>
								</div>
							</div>

							<div className="flex items-center gap-3">
								<div className="rounded-full bg-green-100 p-2 dark:bg-green-900/30">
									<Bike className="h-4 w-4 text-green-600" />
								</div>
								<div className="flex-1">
									<p className="text-xs font-medium text-slate-500">Rider</p>
									{errand.riderName ? (
										<p className="text-sm font-medium text-slate-900 dark:text-white">
											{errand.riderName}
										</p>
									) : (
										<p className="text-sm text-slate-400">Not assigned</p>
									)}
								</div>
								{!errand.riderId && (
									<button
										onClick={() => setShowAssign(true)}
										className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700">
										Assign Rider
									</button>
								)}
							</div>
						</div>

						{/* Rider Assignment Panel */}
						{showAssign && (
							<div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-700">
								<p className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">
									Select a rider to assign
								</p>
								{riders.length === 0 ? (
									<p className="text-sm text-slate-500">
										No available riders online
									</p>
								) : (
									<div className="max-h-48 space-y-2 overflow-y-auto">
										{riders.map((rider) => (
											<button
												key={rider.id}
												onClick={() => assignMutation.mutate(rider.userId)}
												disabled={assignMutation.isPending}
												className="flex w-full items-center justify-between rounded-lg border border-slate-200 p-3 text-left hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800">
												<div>
													<p className="text-sm font-medium text-slate-900 dark:text-white">
														{rider.riderName}
													</p>
													<p className="text-xs text-slate-500">
														{rider.vehicleType === 0
															? "On Foot"
															: rider.vehicleType === 1
																? "Bicycle"
																: rider.vehicleType === 2
																	? "Motorcycle"
																	: "Car"}{" "}
														· Rating: {rider.rating.toFixed(1)} ·{" "}
														{rider.totalCompletedTasks} deliveries
													</p>
												</div>
												<span className="text-xs font-medium text-blue-600">
													Assign
												</span>
											</button>
										))}
									</div>
								)}
								<button
									onClick={() => setShowAssign(false)}
									className="mt-2 text-xs text-slate-500 hover:text-slate-700">
									Cancel
								</button>
							</div>
						)}
					</div>

					{/* Timeline */}
					<div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
						<h2 className="text-lg font-semibold text-slate-900 dark:text-white">
							Timeline
						</h2>
						<div className="mt-4 space-y-3">
							<TimelineItem label="Created" time={errand.createdAt} />
							{errand.acceptedAt && (
								<TimelineItem label="Accepted" time={errand.acceptedAt} />
							)}
							{errand.pickedUpAt && (
								<TimelineItem label="Picked Up" time={errand.pickedUpAt} />
							)}
							{errand.deliveredAt && (
								<TimelineItem label="Delivered" time={errand.deliveredAt} />
							)}
							{errand.cancelledAt && (
								<TimelineItem
									label="Cancelled"
									time={errand.cancelledAt}
									reason={errand.cancellationReason}
								/>
							)}
						</div>

						{errand.statusHistory && errand.statusHistory.length > 0 && (
							<details className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-700">
								<summary className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-500">
									Full status history ({errand.statusHistory.length} events)
								</summary>
								<div className="mt-3 space-y-2">
									{errand.statusHistory.map((h) => (
										<div
											key={h.id}
											className="flex items-center justify-between text-xs">
											<span
												className={cn(
													"rounded-full px-2 py-0.5 font-medium",
													errandStatusColor[h.status],
												)}>
												{errandStatusLabel[h.status]}
											</span>
											<span className="text-slate-500">
												{format(new Date(h.createdAt), "PPp")}
											</span>
										</div>
									))}
								</div>
							</details>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

function TimelineItem({
	label,
	time,
	reason,
}: {
	label: string;
	time: string;
	reason?: string | null;
}) {
	return (
		<div className="flex items-start gap-3">
			<div className="mt-1.5 h-2 w-2 rounded-full bg-slate-400" />
			<div>
				<p className="text-sm font-medium text-slate-900 dark:text-white">
					{label}
				</p>
				<p className="text-xs text-slate-500">
					{format(new Date(time), "PPp")}
				</p>
				{reason && (
					<p className="mt-0.5 text-xs text-red-500">Reason: {reason}</p>
				)}
			</div>
		</div>
	);
}
