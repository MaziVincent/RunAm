"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
	ArrowLeft,
	CheckCircle,
	Clock,
	Package,
	User,
	MapPin,
	Phone,
	Loader2,
	AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
	useVendorOrderDetail,
	useConfirmVendorOrder,
	useRejectVendorOrder,
	useMarkOrderReady,
} from "@/lib/hooks";
import {
	formatCurrency,
	cn,
	vendorOrderStatusLabel,
	vendorOrderStatusColor,
} from "@/lib/utils";
import { VendorOrderStatus } from "@/types";
import { toast } from "sonner";

const STATUS_TIMELINE = [
	{ status: VendorOrderStatus.Received, label: "Order Received", icon: Clock },
	{
		status: VendorOrderStatus.Confirmed,
		label: "Confirmed",
		icon: Package,
	},
	{
		status: VendorOrderStatus.Preparing,
		label: "Preparing",
		icon: Package,
	},
	{
		status: VendorOrderStatus.ReadyForPickup,
		label: "Ready for Pickup",
		icon: CheckCircle,
	},
];

export default function VendorOrderDetailPage() {
	const params = useParams();
	const router = useRouter();
	const orderId = params.id as string;
	const { data, isLoading } = useVendorOrderDetail(orderId);
	const confirmOrder = useConfirmVendorOrder();
	const rejectOrder = useRejectVendorOrder();
	const markReady = useMarkOrderReady();

	const order = data?.data;

	if (isLoading) {
		return (
			<div className="space-y-4">
				<Skeleton className="h-8 w-32" />
				<Skeleton className="h-64 rounded-xl" />
			</div>
		);
	}

	if (!order) {
		return (
			<div className="flex flex-col items-center py-16 text-center">
				<AlertCircle className="h-12 w-12 text-muted-foreground/30" />
				<p className="mt-3 font-medium">Order not found</p>
				<Link href="/vendor/orders">
					<Button variant="outline" className="mt-4">
						Back to Orders
					</Button>
				</Link>
			</div>
		);
	}

	const currentStatus = order.vendorOrderStatus ?? order.status ?? 0;
	const currentIdx = STATUS_TIMELINE.findIndex(
		(s) => s.status === currentStatus,
	);

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center gap-3">
				<Button
					variant="ghost"
					size="icon"
					onClick={() => router.back()}>
					<ArrowLeft className="h-4 w-4" />
				</Button>
				<div className="flex-1">
					<h1 className="text-xl font-bold">
						Order #{orderId.slice(-6)}
					</h1>
					<p className="text-xs text-muted-foreground">
						{new Date(order.createdAt).toLocaleString("en-NG")}
					</p>
				</div>
				<Badge
					className={cn(
						"text-xs",
						vendorOrderStatusColor[currentStatus],
					)}>
					{vendorOrderStatusLabel[currentStatus]}
				</Badge>
			</div>

			{/* Status Timeline */}
			<Card>
				<CardContent className="p-4">
					<div className="flex items-center justify-between">
						{STATUS_TIMELINE.map((step, i) => {
							const isComplete = i <= currentIdx;
							const isCurrent = i === currentIdx;
							return (
								<div key={i} className="flex flex-1 items-center">
									<div className="flex flex-col items-center">
										<div
											className={cn(
												"flex h-8 w-8 items-center justify-center rounded-full border-2",
												isComplete
													? "border-primary bg-primary text-primary-foreground"
													: "border-muted text-muted-foreground",
											)}>
											<step.icon className="h-4 w-4" />
										</div>
										<span
											className={cn(
												"mt-1 text-[10px]",
												isCurrent ? "font-semibold" : "text-muted-foreground",
											)}>
											{step.label}
										</span>
									</div>
									{i < STATUS_TIMELINE.length - 1 && (
										<div
											className={cn(
												"mx-1 h-0.5 flex-1",
												i < currentIdx ? "bg-primary" : "bg-muted",
											)}
										/>
									)}
								</div>
							);
						})}
					</div>
				</CardContent>
			</Card>

			{/* Actions */}
			{currentStatus === VendorOrderStatus.Received && (
				<div className="flex gap-3">
					<Button
						className="flex-1 gap-2"
						onClick={async () => {
							try {
								await confirmOrder.mutateAsync({ orderId });
								toast.success("Order accepted");
							} catch {
								toast.error("Failed");
							}
						}}
						disabled={confirmOrder.isPending}>
						{confirmOrder.isPending && (
							<Loader2 className="h-4 w-4 animate-spin" />
						)}
						Accept Order
					</Button>
					<Button
						variant="destructive"
						onClick={async () => {
							try {
								await rejectOrder.mutateAsync({ orderId, reason: "Vendor rejected" });
								toast.success("Order rejected");
								router.push("/vendor/orders");
							} catch {
								toast.error("Failed");
							}
						}}
						disabled={rejectOrder.isPending}>
						Reject
					</Button>
				</div>
			)}
			{currentStatus === VendorOrderStatus.Confirmed && (
				<Button
					className="w-full gap-2"
					onClick={async () => {
						try {
							await markReady.mutateAsync(orderId);
							toast.success("Marked as ready for pickup");
						} catch {
							toast.error("Failed");
						}
					}}
					disabled={markReady.isPending}>
					{markReady.isPending && (
						<Loader2 className="h-4 w-4 animate-spin" />
					)}
					<CheckCircle className="h-4 w-4" />
					Mark Ready for Pickup
				</Button>
			)}

			{/* Order Summary */}
			<Card>
				<CardHeader>
					<CardTitle className="text-base">Order Summary</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					{order.description && (
						<div>
							<p className="text-xs text-muted-foreground">Description</p>
							<p className="text-sm">{order.description}</p>
						</div>
					)}
					{order.specialInstructions && (
						<div>
							<p className="text-xs text-muted-foreground">
								Special Instructions
							</p>
							<p className="text-sm text-amber-600 dark:text-amber-400">
								{order.specialInstructions}
							</p>
						</div>
					)}
					<Separator />
					<div className="flex justify-between text-sm">
						<span className="text-muted-foreground">Total</span>
						<span className="font-semibold">
							{formatCurrency(order.totalAmount ?? 0)}
						</span>
					</div>
				</CardContent>
			</Card>

			{/* Customer & Delivery */}
			<Card>
				<CardHeader>
					<CardTitle className="text-base">Delivery Details</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					{order.customerName && (
						<div className="flex items-center gap-3">
							<User className="h-4 w-4 text-muted-foreground" />
							<span className="text-sm">{order.customerName}</span>
						</div>
					)}
					{order.dropoffAddress && (
						<div className="flex items-start gap-3">
							<MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
							<span className="text-sm">{order.dropoffAddress}</span>
						</div>
					)}
					{order.riderName && (
						<div className="flex items-center gap-3">
							<Package className="h-4 w-4 text-muted-foreground" />
							<span className="text-sm">
								Rider: {order.riderName}
							</span>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
