"use client";

import { useState } from "react";
import Link from "next/link";
import {
	ShoppingBag,
	Clock,
	CheckCircle,
	Package,
	Loader2,
	ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
	useVendorOrders,
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

type TabKey = "new" | "preparing" | "ready" | "completed" | "all";

const TAB_STATUS_MAP: Record<TabKey, VendorOrderStatus | undefined> = {
	new: VendorOrderStatus.Received,
	preparing: VendorOrderStatus.Preparing,
	ready: VendorOrderStatus.ReadyForPickup,
	completed: undefined, // show all for "completed" — filter client-side
	all: undefined,
};

function OrderCard({
	order,
	tab,
}: {
	order: any;
	tab: TabKey;
}) {
	const confirmOrder = useConfirmVendorOrder();
	const rejectOrder = useRejectVendorOrder();
	const markReady = useMarkOrderReady();

	return (
		<Card>
			<CardContent className="p-4">
				<div className="flex items-start justify-between">
					<div>
						<div className="flex items-center gap-2">
							<p className="text-sm font-semibold">
								Order #{order.id?.slice(-6)}
							</p>
							<Badge
								variant="outline"
								className={cn("text-xs", vendorOrderStatusColor[order.vendorOrderStatus ?? order.status])}>
								{vendorOrderStatusLabel[order.vendorOrderStatus ?? order.status]}
							</Badge>
						</div>
						<p className="mt-0.5 text-xs text-muted-foreground">
							{new Date(order.createdAt).toLocaleString("en-NG", {
								month: "short",
								day: "numeric",
								hour: "2-digit",
								minute: "2-digit",
							})}
						</p>
					</div>
					<p className="text-sm font-bold">
						{formatCurrency(order.totalAmount ?? 0)}
					</p>
				</div>

				{/* Items */}
				{order.items && order.items.length > 0 && (
					<div className="mt-2 space-y-0.5">
						{order.items.slice(0, 4).map((item: any, idx: number) => (
							<p key={idx} className="text-xs text-muted-foreground">
								{item.quantity}× {item.productName}
								{item.selectedVariant && ` (${item.selectedVariant})`}
							</p>
						))}
						{order.items.length > 4 && (
							<p className="text-xs text-muted-foreground">
								+{order.items.length - 4} more items
							</p>
						)}
					</div>
				)}

				{/* Actions */}
				<div className="mt-3 flex items-center gap-2">
					{tab === "new" && (
						<>
							<Button
								size="sm"
								className="flex-1"
								onClick={async () => {
									try {
										await confirmOrder.mutateAsync({ orderId: order.id });
										toast.success("Order accepted");
									} catch {
										toast.error("Failed");
									}
								}}
								disabled={confirmOrder.isPending}>
								{confirmOrder.isPending ? (
									<Loader2 className="h-4 w-4 animate-spin" />
								) : (
									"Accept"
								)}
							</Button>
							<Button
								size="sm"
								variant="outline"
								onClick={async () => {
									try {
										await rejectOrder.mutateAsync({ orderId: order.id, reason: "Vendor rejected" });
										toast.success("Order rejected");
									} catch {
										toast.error("Failed");
									}
								}}
								disabled={rejectOrder.isPending}>
								Reject
							</Button>
						</>
					)}
					{tab === "preparing" && (
						<Button
							size="sm"
							className="flex-1 gap-2"
							onClick={async () => {
								try {
									await markReady.mutateAsync(order.id);
									toast.success("Marked as ready");
								} catch {
									toast.error("Failed");
								}
							}}
							disabled={markReady.isPending}>
							{markReady.isPending ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : (
								<>
									<CheckCircle className="h-4 w-4" />
									Mark Ready
								</>
							)}
						</Button>
					)}
					<Link href={`/vendor/orders/${order.id}`} className="ml-auto">
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

function OrderList({
	tab,
	status,
}: {
	tab: TabKey;
	status?: VendorOrderStatus;
}) {
	const [page, setPage] = useState(1);
	const { data, isLoading } = useVendorOrders({
		status: status !== undefined ? String(status) : undefined,
		page,
		pageSize: 20,
	});
	const orders = data?.data ?? [];
	const pagination = data?.meta;

	if (isLoading) {
		return (
			<div className="space-y-3">
				{[1, 2, 3].map((i) => (
					<Skeleton key={i} className="h-28 rounded-xl" />
				))}
			</div>
		);
	}

	if (orders.length === 0) {
		return (
			<div className="flex flex-col items-center py-12 text-center">
				<ShoppingBag className="h-10 w-10 text-muted-foreground/30" />
				<p className="mt-3 text-sm text-muted-foreground">
					No {tab !== "all" ? tab : ""} orders
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-3">
			{orders.map((order) => (
				<OrderCard key={order.id} order={order} tab={tab} />
			))}

			{pagination && pagination.totalPages > 1 && (
				<div className="flex items-center justify-center gap-2 pt-2">
					<Button
						variant="outline"
						size="sm"
						disabled={page <= 1}
						onClick={() => setPage((p) => p - 1)}>
						Previous
					</Button>
					<span className="text-xs text-muted-foreground">
						{page} / {pagination.totalPages}
					</span>
					<Button
						variant="outline"
						size="sm"
						disabled={page >= pagination.totalPages}
						onClick={() => setPage((p) => p + 1)}>
						Next
					</Button>
				</div>
			)}
		</div>
	);
}

export default function VendorOrdersPage() {
	const [activeTab, setActiveTab] = useState<TabKey>("new");

	// Fetch new orders count for badge
	const { data: newData } = useVendorOrders({
		status: String(VendorOrderStatus.Received),
	});
	const newCount = newData?.data?.length ?? 0;

	return (
		<div className="space-y-6">
			<h1 className="text-2xl font-bold">Orders</h1>

			<Tabs
				value={activeTab}
				onValueChange={(v) => setActiveTab(v as TabKey)}>
				<TabsList className="w-full justify-start overflow-x-auto">
					<TabsTrigger value="new" className="gap-1.5">
						New
						{newCount > 0 && (
							<Badge
								variant="destructive"
								className="h-5 min-w-5 rounded-full px-1.5 text-[10px]">
								{newCount}
							</Badge>
						)}
					</TabsTrigger>
					<TabsTrigger value="preparing">Preparing</TabsTrigger>
					<TabsTrigger value="ready">Ready</TabsTrigger>
					<TabsTrigger value="completed">Completed</TabsTrigger>
					<TabsTrigger value="all">All</TabsTrigger>
				</TabsList>
				{(
					["new", "preparing", "ready", "completed", "all"] as TabKey[]
				).map((tab) => (
					<TabsContent key={tab} value={tab}>
						<OrderList tab={tab} status={TAB_STATUS_MAP[tab]} />
					</TabsContent>
				))}
			</Tabs>
		</div>
	);
}
