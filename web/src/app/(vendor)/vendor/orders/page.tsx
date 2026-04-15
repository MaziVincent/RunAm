"use client";

import { useState } from "react";
import Link from "next/link";
import {
	CheckCircle,
	ChevronRight,
	Clock,
	ShoppingBag,
	Store,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMarkOrderReady, useVendorOrders } from "@/lib/hooks";
import {
	cn,
	formatCurrency,
	vendorOrderStatusColor,
	vendorOrderStatusLabel,
} from "@/lib/utils";
import { VendorOrderStatus, type VendorOrderDto } from "@/types";
import { toast } from "sonner";

type TabKey = "open" | "ready" | "all";

const TAB_STATUS_MAP: Record<TabKey, string | undefined> = {
	open: "open",
	ready: "ready",
	all: undefined,
};

function parseVendorOrderStatus(
	status: string | null | undefined,
): VendorOrderStatus {
	switch (status) {
		case "Confirmed":
			return VendorOrderStatus.Confirmed;
		case "Preparing":
			return VendorOrderStatus.Preparing;
		case "ReadyForPickup":
			return VendorOrderStatus.ReadyForPickup;
		case "Cancelled":
			return VendorOrderStatus.Cancelled;
		case "Received":
		default:
			return VendorOrderStatus.Received;
	}
}

function canMarkReady(order: VendorOrderDto) {
	const status = parseVendorOrderStatus(order.vendorOrderStatus);
	return (
		status === VendorOrderStatus.Received ||
		status === VendorOrderStatus.Confirmed ||
		status === VendorOrderStatus.Preparing
	);
}

function OrderCard({ order }: { order: VendorOrderDto }) {
	const markReady = useMarkOrderReady();
	const status = parseVendorOrderStatus(order.vendorOrderStatus);

	return (
		<Card>
			<CardContent className="space-y-4 p-4">
				<div className="flex items-start justify-between gap-3">
					<div>
						<div className="flex items-center gap-2">
							<p className="text-sm font-semibold">
								Order #{order.errandId.slice(-6)}
							</p>
							<Badge
								variant="outline"
								className={cn("text-xs", vendorOrderStatusColor[status])}>
								{vendorOrderStatusLabel[status]}
							</Badge>
						</div>
						<p className="mt-1 text-xs text-muted-foreground">
							{order.customerName || "Customer"}
						</p>
						<p className="text-xs text-muted-foreground">
							{new Date(order.createdAt).toLocaleString("en-NG", {
								month: "short",
								day: "numeric",
								hour: "2-digit",
								minute: "2-digit",
							})}
						</p>
					</div>
					<p className="text-sm font-bold">
						{formatCurrency(order.totalAmount)}
					</p>
				</div>

				<p className="text-xs text-muted-foreground">{order.dropoffAddress}</p>

				{order.items.length > 0 && (
					<div className="space-y-1">
						{order.items.slice(0, 4).map((item) => (
							<p key={item.id} className="text-xs text-muted-foreground">
								{item.quantity}x {item.productName}
							</p>
						))}
						{order.items.length > 4 && (
							<p className="text-xs text-muted-foreground">
								+{order.items.length - 4} more items
							</p>
						)}
					</div>
				)}

				<div className="flex items-center gap-2">
					{canMarkReady(order) && (
						<Button
							size="sm"
							className="gap-2"
							onClick={async () => {
								try {
									await markReady.mutateAsync(order.errandId);
									toast.success("Order marked ready for pickup");
								} catch {
									toast.error("Failed to update order status");
								}
							}}
							disabled={markReady.isPending}>
							<CheckCircle className="h-4 w-4" />
							Mark Ready
						</Button>
					)}
					<Link href={`/vendor/orders/${order.errandId}`} className="ml-auto">
						<Button variant="ghost" size="sm">
							Details
							<ChevronRight className="ml-1 h-3.5 w-3.5" />
						</Button>
					</Link>
				</div>
			</CardContent>
		</Card>
	);
}

function OrderList({ tab }: { tab: TabKey }) {
	const [page, setPage] = useState(1);
	const { data, isLoading } = useVendorOrders({
		status: TAB_STATUS_MAP[tab],
		page,
		pageSize: 20,
	});
	const orders = data?.data ?? [];
	const pagination = data?.meta;

	if (isLoading) {
		return (
			<div className="space-y-3">
				{[1, 2, 3].map((index) => (
					<Skeleton key={index} className="h-36 rounded-xl" />
				))}
			</div>
		);
	}

	if (orders.length === 0) {
		return (
			<div className="flex flex-col items-center py-12 text-center">
				<ShoppingBag className="h-10 w-10 text-muted-foreground/30" />
				<p className="mt-3 text-sm text-muted-foreground">
					No {tab === "all" ? "orders" : `${tab} orders`}
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-3">
			{orders.map((order) => (
				<OrderCard key={order.errandId} order={order} />
			))}

			{pagination && pagination.totalPages > 1 && (
				<div className="flex items-center justify-center gap-2 pt-2">
					<Button
						variant="outline"
						size="sm"
						disabled={page <= 1}
						onClick={() => setPage((value) => value - 1)}>
						Previous
					</Button>
					<span className="text-xs text-muted-foreground">
						{page} / {pagination.totalPages}
					</span>
					<Button
						variant="outline"
						size="sm"
						disabled={page >= pagination.totalPages}
						onClick={() => setPage((value) => value + 1)}>
						Next
					</Button>
				</div>
			)}
		</div>
	);
}

export default function VendorOrdersPage() {
	const { data: openData } = useVendorOrders({ status: "open", pageSize: 100 });
	const openCount = openData?.data?.length ?? 0;

	return (
		<div className="space-y-6">
			<h1 className="text-2xl font-bold">Orders</h1>

			<Tabs defaultValue="open">
				<TabsList className="w-full justify-start overflow-x-auto">
					<TabsTrigger value="open" className="gap-1.5">
						<Store className="h-4 w-4" />
						Open
						{openCount > 0 && (
							<Badge
								variant="destructive"
								className="h-5 min-w-5 rounded-full px-1.5 text-[10px]">
								{openCount}
							</Badge>
						)}
					</TabsTrigger>
					<TabsTrigger value="ready" className="gap-1.5">
						<CheckCircle className="h-4 w-4" />
						Ready
					</TabsTrigger>
					<TabsTrigger value="all" className="gap-1.5">
						<Clock className="h-4 w-4" />
						All
					</TabsTrigger>
				</TabsList>
				<TabsContent value="open">
					<OrderList tab="open" />
				</TabsContent>
				<TabsContent value="ready">
					<OrderList tab="ready" />
				</TabsContent>
				<TabsContent value="all">
					<OrderList tab="all" />
				</TabsContent>
			</Tabs>
		</div>
	);
}
