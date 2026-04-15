"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
	AlertCircle,
	ArrowLeft,
	CheckCircle,
	Clock,
	MapPin,
	Package,
	User,
} from "lucide-react";

import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useMarkOrderReady, useVendorOrderDetail } from "@/lib/hooks";
import { formatCurrency } from "@/lib/utils";
import { VendorOrderStatus } from "@/types";
import { toast } from "sonner";

const ACTIVE_VENDOR_STATUSES = new Set<VendorOrderStatus>([
	VendorOrderStatus.Received,
	VendorOrderStatus.Confirmed,
	VendorOrderStatus.Preparing,
]);

export default function VendorOrderDetailPage() {
	const params = useParams();
	const router = useRouter();
	const orderId = params.id as string;
	const { data, isLoading } = useVendorOrderDetail(orderId);
	const markReady = useMarkOrderReady();

	const order = data?.data;
	const vendorStatus = order?.vendorOrderStatus ?? VendorOrderStatus.Confirmed;
	const canMarkReady = ACTIVE_VENDOR_STATUSES.has(vendorStatus);

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

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-3">
				<Button variant="ghost" size="icon" onClick={() => router.back()}>
					<ArrowLeft className="h-4 w-4" />
				</Button>
				<div className="flex-1">
					<h1 className="text-xl font-bold">Order #{orderId.slice(-6)}</h1>
					<p className="text-xs text-muted-foreground">
						{new Date(order.createdAt).toLocaleString("en-NG")}
					</p>
				</div>
				<StatusBadge
					status={vendorStatus}
					kind="vendorOrder"
					className="rounded-full px-3 py-1"
				/>
			</div>

			{canMarkReady && (
				<Button
					className="w-full gap-2"
					onClick={async () => {
						try {
							await markReady.mutateAsync(orderId);
							toast.success("Marked ready for pickup");
						} catch {
							toast.error("Failed to update order");
						}
					}}
					disabled={markReady.isPending}>
					<CheckCircle className="h-4 w-4" />
					Mark Ready for Pickup
				</Button>
			)}

			<Card>
				<CardHeader>
					<CardTitle className="text-base">Order Summary</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					<div>
						<p className="text-xs text-muted-foreground">Pickup</p>
						<p className="text-sm">{order.pickupAddress}</p>
					</div>
					<div>
						<p className="text-xs text-muted-foreground">Drop-off</p>
						<p className="text-sm">{order.dropoffAddress}</p>
					</div>
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
							{formatCurrency(order.totalAmount)}
						</span>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className="text-base">Delivery Details</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					<div className="flex items-center gap-3">
						<User className="h-4 w-4 text-muted-foreground" />
						<span className="text-sm">{order.customerName || "Customer"}</span>
					</div>
					<div className="flex items-start gap-3">
						<MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
						<span className="text-sm">{order.dropoffAddress}</span>
					</div>
					<div className="flex items-center gap-3">
						<Package className="h-4 w-4 text-muted-foreground" />
						<span className="text-sm">
							Rider: {order.riderName || "Waiting for rider assignment"}
						</span>
					</div>
					<div className="flex items-center gap-3">
						<Clock className="h-4 w-4 text-muted-foreground" />
						<span className="text-sm">
							Placed{" "}
							{new Date(order.createdAt).toLocaleString("en-NG", {
								dateStyle: "medium",
								timeStyle: "short",
							})}
						</span>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
