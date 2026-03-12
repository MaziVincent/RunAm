"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
	ArrowLeft,
	MapPin,
	Phone,
	MessageCircle,
	Star,
	Truck,
	Clock,
	CheckCircle2,
	XCircle,
	Package,
	Copy,
	Navigation,
	User,
	Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useErrandDetail } from "@/lib/hooks";
import {
	formatCurrency,
	errandStatusLabel,
	errandStatusColor,
	errandCategoryLabel,
} from "@/lib/utils";
import { ErrandStatus } from "@/types";
import { toast } from "sonner";

/* ------------------------------------------------------------------ */
/*  Status Timeline                                                   */
/* ------------------------------------------------------------------ */
function StatusTimeline({
	history,
}: {
	history: { status: number; createdAt: string; notes: string | null }[];
}) {
	return (
		<div className="space-y-0">
			{history.map((entry, i) => (
				<div key={i} className="flex gap-3">
					<div className="flex flex-col items-center">
						<div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white">
							<CheckCircle2 className="h-3.5 w-3.5" />
						</div>
						{i < history.length - 1 && (
							<div className="w-px flex-1 bg-border" />
						)}
					</div>
					<div className="pb-4">
						<p className="text-sm font-medium">
							{errandStatusLabel[entry.status] ?? `Status ${entry.status}`}
						</p>
						<p className="text-xs text-muted-foreground">
							{new Date(entry.createdAt).toLocaleString("en-NG", {
								month: "short",
								day: "numeric",
								hour: "2-digit",
								minute: "2-digit",
							})}
						</p>
						{entry.notes && (
							<p className="mt-0.5 text-xs text-muted-foreground italic">
								{entry.notes}
							</p>
						)}
					</div>
				</div>
			))}
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */
export default function ErrandDetailPage() {
	const { id } = useParams();
	const router = useRouter();
	const { data, isLoading, error } = useErrandDetail(id as string);
	const errand = data?.data;

	if (isLoading) {
		return (
			<div className="space-y-4">
				<Skeleton className="h-8 w-48" />
				<Skeleton className="h-40 rounded-xl" />
				<Skeleton className="h-60 rounded-xl" />
			</div>
		);
	}

	if (error || !errand) {
		return (
			<div className="flex flex-col items-center py-20 text-center">
				<Package className="h-16 w-16 text-muted-foreground/30" />
				<h2 className="mt-4 text-lg font-semibold">Errand not found</h2>
				<Button
					variant="outline"
					className="mt-4"
					onClick={() => router.back()}>
					Go Back
				</Button>
			</div>
		);
	}

	const isActive =
		errand.status !== ErrandStatus.Delivered &&
		errand.status !== ErrandStatus.Cancelled &&
		errand.status !== ErrandStatus.Failed;

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center gap-3">
				<Button variant="ghost" size="icon" onClick={() => router.back()}>
					<ArrowLeft className="h-5 w-5" />
				</Button>
				<div className="flex-1">
					<h1 className="text-xl font-bold">
						{errand.vendorName
							? `Order from ${errand.vendorName}`
							: errandCategoryLabel[errand.category]}
					</h1>
					<div className="flex items-center gap-2 mt-1">
						<Badge className={errandStatusColor[errand.status]}>
							{errandStatusLabel[errand.status]}
						</Badge>
						<span className="text-xs text-muted-foreground">
							#{errand.id.slice(0, 8)}
						</span>
					</div>
				</div>
			</div>

			{/* Map placeholder for active errands */}
			{isActive && (
				<Card>
					<CardContent className="flex flex-col items-center justify-center p-6">
						<div className="flex h-40 w-full items-center justify-center rounded-lg bg-muted">
							<Navigation className="h-12 w-12 text-muted-foreground/30" />
						</div>
						<p className="mt-3 text-sm text-muted-foreground">
							Live tracking map coming soon
						</p>
					</CardContent>
				</Card>
			)}

			{/* Location details */}
			<Card>
				<CardHeader className="pb-3">
					<CardTitle className="text-base">Delivery Details</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex gap-3">
						<div className="flex flex-col items-center">
							<div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50">
								<MapPin className="h-3.5 w-3.5 text-green-600" />
							</div>
							<div className="mt-1 h-8 w-px border-l-2 border-dashed" />
							<div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/50">
								<MapPin className="h-3.5 w-3.5 text-red-500" />
							</div>
						</div>
						<div className="flex-1 space-y-4">
							<div>
								<p className="text-xs text-muted-foreground">Pickup</p>
								<p className="text-sm font-medium">{errand.pickupAddress}</p>
							</div>
							<div>
								<p className="text-xs text-muted-foreground">Dropoff</p>
								<p className="text-sm font-medium">{errand.dropoffAddress}</p>
							</div>
						</div>
					</div>

					{errand.specialInstructions && (
						<>
							<Separator />
							<div>
								<p className="text-xs text-muted-foreground mb-1">
									Special Instructions
								</p>
								<p className="text-sm">{errand.specialInstructions}</p>
							</div>
						</>
					)}
				</CardContent>
			</Card>

			{/* Rider info */}
			{errand.riderName && (
				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-base">Your Rider</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="flex items-center gap-3">
							<div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
								<User className="h-6 w-6 text-primary" />
							</div>
							<div className="flex-1">
								<p className="text-sm font-semibold">{errand.riderName}</p>
								<p className="text-xs text-muted-foreground">Assigned rider</p>
							</div>
							{isActive && (
								<Button variant="outline" size="icon">
									<Phone className="h-4 w-4" />
								</Button>
							)}
						</div>
					</CardContent>
				</Card>
			)}

			{/* Status Timeline */}
			{errand.statusHistory && errand.statusHistory.length > 0 && (
				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-base">Order Timeline</CardTitle>
					</CardHeader>
					<CardContent>
						<StatusTimeline history={errand.statusHistory} />
					</CardContent>
				</Card>
			)}

			{/* Payment */}
			<Card>
				<CardHeader className="pb-3">
					<CardTitle className="text-base">Payment Summary</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-2">
						<div className="flex justify-between text-sm">
							<span className="text-muted-foreground">Total Amount</span>
							<span className="font-bold text-lg">
								{formatCurrency(errand.totalAmount)}
							</span>
						</div>
						<div className="flex justify-between text-xs text-muted-foreground">
							<span>Order ID</span>
							<button
								className="flex items-center gap-1 hover:text-foreground"
								onClick={() => {
									navigator.clipboard.writeText(errand.id);
									toast.success("Order ID copied");
								}}>
								{errand.id.slice(0, 8)}...
								<Copy className="h-3 w-3" />
							</button>
						</div>
						<div className="flex justify-between text-xs text-muted-foreground">
							<span>Placed on</span>
							<span>
								{new Date(errand.createdAt).toLocaleString("en-NG", {
									month: "long",
									day: "numeric",
									year: "numeric",
									hour: "2-digit",
									minute: "2-digit",
								})}
							</span>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Actions */}
			{errand.status === ErrandStatus.Delivered && (
				<Button asChild className="w-full gap-2">
					<Link href={`/dashboard/errands/new?reorder=${errand.id}`}>
						<Package className="h-4 w-4" />
						Reorder
					</Link>
				</Button>
			)}
		</div>
	);
}
