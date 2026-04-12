"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CreditCard, MapPin, User, Package } from "lucide-react";
import { api } from "@/lib/api/client";
import { cn, formatCurrency } from "@/lib/utils";
import { PaymentStatus, PaymentMethod } from "@/types";

interface AdminPaymentDetail {
	id: string;
	errandId: string;
	payerId: string;
	payerName: string;
	payerEmail: string;
	amount: number;
	currency: string;
	paymentMethod: number;
	paymentGatewayRef: string | null;
	status: number;
	createdAt: string;
	errandDescription: string | null;
	errandStatus: number;
	pickupAddress: string | null;
	dropoffAddress: string | null;
	riderName: string | null;
	errandTotalAmount: number | null;
	commissionAmount: number | null;
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

const errandStatusLabel: Record<number, string> = {
	0: "Pending",
	1: "Accepted",
	2: "Picked Up",
	3: "In Transit",
	4: "Delivered",
	5: "Cancelled",
};

export default function PaymentDetailPage() {
	const { id } = useParams<{ id: string }>();
	const router = useRouter();

	const { data: res, isLoading } = useQuery({
		queryKey: ["payment-detail", id],
		queryFn: () => api.get<AdminPaymentDetail>(`/admin/payments/${id}`),
		enabled: !!id,
	});

	const payment = res?.data;

	if (isLoading) {
		return (
			<div className="space-y-6">
				<div className="h-8 w-48 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
				<div className="grid gap-6 lg:grid-cols-2">
					{Array.from({ length: 4 }).map((_, i) => (
						<div
							key={i}
							className="h-48 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-700"
						/>
					))}
				</div>
			</div>
		);
	}

	if (!payment) {
		return (
			<div className="flex flex-col items-center justify-center py-20">
				<p className="text-lg text-slate-500">Payment not found</p>
				<button
					onClick={() => router.back()}
					className="mt-4 text-sm text-blue-600 hover:underline">
					Go back
				</button>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center gap-4">
				<button
					onClick={() => router.back()}
					className="rounded-lg border border-slate-300 p-2 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800">
					<ArrowLeft className="h-4 w-4" />
				</button>
				<div>
					<h1 className="text-2xl font-bold text-slate-900 dark:text-white">
						Transaction Details
					</h1>
					<p className="mt-0.5 font-mono text-sm text-slate-500">
						{payment.id}
					</p>
				</div>
				<span
					className={cn(
						"ml-auto inline-flex rounded-full px-3 py-1 text-sm font-medium",
						paymentStatusColor[payment.status],
					)}>
					{paymentStatusLabel[payment.status]}
				</span>
			</div>

			<div className="grid gap-6 lg:grid-cols-2">
				{/* Payment Info */}
				<div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
					<div className="flex items-center gap-2 border-b border-slate-200 px-6 py-4 dark:border-slate-800">
						<CreditCard className="h-5 w-5 text-slate-500" />
						<h2 className="text-lg font-semibold text-slate-900 dark:text-white">
							Payment Information
						</h2>
					</div>
					<div className="space-y-4 p-6">
						<InfoRow label="Amount" value={formatCurrency(payment.amount)} />
						<InfoRow label="Currency" value={payment.currency} />
						<InfoRow
							label="Method"
							value={paymentMethodLabel[payment.paymentMethod] ?? "Unknown"}
						/>
						<InfoRow
							label="Gateway Reference"
							value={payment.paymentGatewayRef ?? "—"}
							mono
						/>
						<InfoRow
							label="Date"
							value={new Date(payment.createdAt).toLocaleString()}
						/>
						{payment.commissionAmount != null && (
							<InfoRow
								label="Commission"
								value={formatCurrency(payment.commissionAmount)}
							/>
						)}
					</div>
				</div>

				{/* Payer Info */}
				<div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
					<div className="flex items-center gap-2 border-b border-slate-200 px-6 py-4 dark:border-slate-800">
						<User className="h-5 w-5 text-slate-500" />
						<h2 className="text-lg font-semibold text-slate-900 dark:text-white">
							Payer Details
						</h2>
					</div>
					<div className="space-y-4 p-6">
						<InfoRow label="Name" value={payment.payerName} />
						<InfoRow label="Email" value={payment.payerEmail} />
						<InfoRow label="Payer ID" value={payment.payerId} mono />
					</div>
				</div>

				{/* Errand Info */}
				<div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
					<div className="flex items-center gap-2 border-b border-slate-200 px-6 py-4 dark:border-slate-800">
						<Package className="h-5 w-5 text-slate-500" />
						<h2 className="text-lg font-semibold text-slate-900 dark:text-white">
							Errand Details
						</h2>
					</div>
					<div className="space-y-4 p-6">
						<InfoRow label="Errand ID" value={payment.errandId} mono />
						<InfoRow
							label="Status"
							value={errandStatusLabel[payment.errandStatus] ?? "Unknown"}
						/>
						{payment.errandDescription && (
							<InfoRow
								label="Description"
								value={payment.errandDescription}
							/>
						)}
						{payment.errandTotalAmount != null && (
							<InfoRow
								label="Total Amount"
								value={formatCurrency(payment.errandTotalAmount)}
							/>
						)}
						{payment.riderName && (
							<InfoRow label="Rider" value={payment.riderName} />
						)}
					</div>
				</div>

				{/* Addresses */}
				{(payment.pickupAddress || payment.dropoffAddress) && (
					<div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
						<div className="flex items-center gap-2 border-b border-slate-200 px-6 py-4 dark:border-slate-800">
							<MapPin className="h-5 w-5 text-slate-500" />
							<h2 className="text-lg font-semibold text-slate-900 dark:text-white">
								Addresses
							</h2>
						</div>
						<div className="space-y-4 p-6">
							{payment.pickupAddress && (
								<InfoRow label="Pickup" value={payment.pickupAddress} />
							)}
							{payment.dropoffAddress && (
								<InfoRow label="Dropoff" value={payment.dropoffAddress} />
							)}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

function InfoRow({
	label,
	value,
	mono,
}: {
	label: string;
	value: string | number;
	mono?: boolean;
}) {
	return (
		<div className="flex items-start justify-between gap-4">
			<span className="text-sm text-slate-500 dark:text-slate-400">
				{label}
			</span>
			<span
				className={cn(
					"text-right text-sm font-medium text-slate-900 dark:text-white",
					mono && "font-mono text-xs",
				)}>
				{value}
			</span>
		</div>
	);
}
