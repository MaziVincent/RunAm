"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
	ArrowLeft,
	MapPin,
	Phone,
	Clock,
	Package,
	User,
	Loader2,
	CheckCircle2,
	Truck,
	Navigation,
	Camera,
	AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
	useTaskDetail,
	useUpdateTaskStatus,
	useAcceptTask,
} from "@/lib/hooks";
import { formatCurrency, cn } from "@/lib/utils";
import { ErrandStatus, ErrandPriority } from "@/types";
import { toast } from "sonner";

const errandStatusLabel: Record<number, string> = {
	[ErrandStatus.Pending]: "Pending",
	[ErrandStatus.Accepted]: "Accepted",
	[ErrandStatus.EnRouteToPickup]: "En Route to Pickup",
	[ErrandStatus.ArrivedAtPickup]: "Arrived at Pickup",
	[ErrandStatus.PackageCollected]: "Package Collected",
	[ErrandStatus.EnRouteToDropoff]: "En Route to Dropoff",
	[ErrandStatus.ArrivedAtDropoff]: "Arrived at Dropoff",
	[ErrandStatus.Delivered]: "Delivered",
	[ErrandStatus.Cancelled]: "Cancelled",
	[ErrandStatus.Failed]: "Failed",
};

const errandStatusColor: Record<number, string> = {
	[ErrandStatus.Pending]: "bg-gray-100 text-gray-700",
	[ErrandStatus.Accepted]: "bg-blue-100 text-blue-700",
	[ErrandStatus.EnRouteToPickup]: "bg-blue-100 text-blue-700",
	[ErrandStatus.ArrivedAtPickup]: "bg-amber-100 text-amber-700",
	[ErrandStatus.PackageCollected]: "bg-purple-100 text-purple-700",
	[ErrandStatus.EnRouteToDropoff]: "bg-indigo-100 text-indigo-700",
	[ErrandStatus.ArrivedAtDropoff]: "bg-teal-100 text-teal-700",
	[ErrandStatus.Delivered]: "bg-green-100 text-green-700",
	[ErrandStatus.Cancelled]: "bg-red-100 text-red-700",
	[ErrandStatus.Failed]: "bg-red-100 text-red-700",
};

// The next status a rider can transition to
const nextStatusMap: Partial<Record<ErrandStatus, ErrandStatus>> = {
	[ErrandStatus.Accepted]: ErrandStatus.EnRouteToPickup,
	[ErrandStatus.EnRouteToPickup]: ErrandStatus.ArrivedAtPickup,
	[ErrandStatus.ArrivedAtPickup]: ErrandStatus.PackageCollected,
	[ErrandStatus.PackageCollected]: ErrandStatus.EnRouteToDropoff,
	[ErrandStatus.EnRouteToDropoff]: ErrandStatus.ArrivedAtDropoff,
	[ErrandStatus.ArrivedAtDropoff]: ErrandStatus.Delivered,
};

const nextStatusAction: Partial<Record<ErrandStatus, string>> = {
	[ErrandStatus.Accepted]: "Start Pickup",
	[ErrandStatus.EnRouteToPickup]: "Arrived at Pickup",
	[ErrandStatus.ArrivedAtPickup]: "Collected Package",
	[ErrandStatus.PackageCollected]: "Start Dropoff",
	[ErrandStatus.EnRouteToDropoff]: "Arrived at Dropoff",
	[ErrandStatus.ArrivedAtDropoff]: "Confirm Delivery",
};

function StatusTimeline({
	history,
}: {
	history: { status: ErrandStatus; createdAt: string; notes: string | null }[];
}) {
	return (
		<div className="space-y-0">
			{history.map((entry, i) => (
				<div key={i} className="flex gap-3">
					<div className="flex flex-col items-center">
						<div
							className={cn(
								"h-3 w-3 rounded-full",
								i === 0 ? "bg-primary" : "bg-muted-foreground/30",
							)}
						/>
						{i < history.length - 1 && (
							<div className="w-px flex-1 bg-muted-foreground/20" />
						)}
					</div>
					<div className="pb-4">
						<p className="text-sm font-medium">
							{errandStatusLabel[entry.status] ?? `Status ${entry.status}`}
						</p>
						<p className="text-xs text-muted-foreground">
							{new Date(entry.createdAt).toLocaleString()}
						</p>
						{entry.notes && (
							<p className="mt-0.5 text-xs text-muted-foreground">
								{entry.notes}
							</p>
						)}
					</div>
				</div>
			))}
		</div>
	);
}

export default function RiderTaskDetailPage() {
	const params = useParams();
	const router = useRouter();
	const id = params.id as string;
	const { data, isLoading } = useTaskDetail(id);
	const updateStatus = useUpdateTaskStatus();
	const acceptTask = useAcceptTask();
	const task = data?.data;

	if (isLoading) {
		return (
			<div className="space-y-4">
				<Skeleton className="h-8 w-48" />
				<Skeleton className="h-64 rounded-lg" />
				<Skeleton className="h-48 rounded-lg" />
			</div>
		);
	}

	if (!task) {
		return (
			<div className="flex flex-col items-center py-16 text-center">
				<AlertTriangle className="h-12 w-12 text-muted-foreground/30" />
				<p className="mt-3 text-sm font-medium">Task not found</p>
				<Link href="/rider/tasks" className="mt-4">
					<Button variant="outline">Back to Tasks</Button>
				</Link>
			</div>
		);
	}

	const nextStatus = nextStatusMap[task.status as ErrandStatus];
	const actionLabel = nextStatusAction[task.status as ErrandStatus];
	const isTerminal =
		task.status === ErrandStatus.Delivered ||
		task.status === ErrandStatus.Cancelled ||
		task.status === ErrandStatus.Failed;
	const isPending = task.status === ErrandStatus.Pending;

	async function handleStatusUpdate() {
		if (!nextStatus) return;
		try {
			await updateStatus.mutateAsync({ taskId: task!.id, status: nextStatus });
			toast.success(`Status updated: ${errandStatusLabel[nextStatus]}`);
		} catch {
			toast.error("Failed to update status");
		}
	}

	async function handleAccept() {
		try {
			await acceptTask.mutateAsync(task!.id);
			toast.success("Task accepted!");
		} catch {
			toast.error("Failed to accept task");
		}
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center gap-3">
				<Button
					variant="ghost"
					size="icon"
					onClick={() => router.back()}>
					<ArrowLeft className="h-5 w-5" />
				</Button>
				<div>
					<h1 className="text-xl font-bold">Task Details</h1>
					<p className="text-xs text-muted-foreground">
						#{task.id.slice(0, 8)}
					</p>
				</div>
				<span
					className={cn(
						"ml-auto rounded-full px-3 py-1 text-xs font-medium",
						errandStatusColor[task.status],
					)}>
					{errandStatusLabel[task.status]}
				</span>
			</div>

			{/* Action buttons */}
			{isPending && (
				<Card className="border-primary/30 bg-primary/5">
					<CardContent className="flex items-center gap-3 p-4">
						<div className="flex-1">
							<p className="text-sm font-semibold">Accept this task?</p>
							<p className="text-xs text-muted-foreground">
								Earn {formatCurrency(task.totalAmount)} for this delivery
							</p>
						</div>
						<Button
							onClick={handleAccept}
							disabled={acceptTask.isPending}>
							{acceptTask.isPending && (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							)}
							Accept
						</Button>
					</CardContent>
				</Card>
			)}

			{!isTerminal && !isPending && actionLabel && (
				<Button
					className="w-full gap-2"
					size="lg"
					onClick={handleStatusUpdate}
					disabled={updateStatus.isPending}>
					{updateStatus.isPending ? (
						<Loader2 className="h-4 w-4 animate-spin" />
					) : (
						<Navigation className="h-4 w-4" />
					)}
					{actionLabel}
				</Button>
			)}

			{/* Locations */}
			<Card>
				<CardHeader>
					<CardTitle className="text-base">Locations</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex gap-3">
						<div className="flex flex-col items-center">
							<div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100">
								<div className="h-2 w-2 rounded-full bg-green-600" />
							</div>
							<div className="w-px flex-1 border-l-2 border-dashed border-muted-foreground/20" />
						</div>
						<div className="flex-1 pb-4">
							<p className="text-xs font-medium text-muted-foreground">
								PICKUP
							</p>
							<p className="text-sm font-medium">{task.pickupAddress}</p>
							{task.vendorName && (
								<p className="text-xs text-muted-foreground">
									From: {task.vendorName}
								</p>
							)}
						</div>
					</div>

					{task.stops?.map((stop, i) => (
						<div key={stop.id} className="flex gap-3">
							<div className="flex flex-col items-center">
								<div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100">
									<span className="text-[10px] font-bold text-blue-700">
										{i + 1}
									</span>
								</div>
								<div className="w-px flex-1 border-l-2 border-dashed border-muted-foreground/20" />
							</div>
							<div className="flex-1 pb-4">
								<p className="text-xs font-medium text-muted-foreground">
									STOP {i + 1}
								</p>
								<p className="text-sm font-medium">{stop.address}</p>
								{stop.contactName && (
									<p className="text-xs text-muted-foreground">
										{stop.contactName}
									</p>
								)}
							</div>
						</div>
					))}

					<div className="flex gap-3">
						<div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100">
							<div className="h-2 w-2 rounded-full bg-red-600" />
						</div>
						<div className="flex-1">
							<p className="text-xs font-medium text-muted-foreground">
								DROPOFF
							</p>
							<p className="text-sm font-medium">{task.dropoffAddress}</p>
							{task.recipientName && (
								<p className="text-xs text-muted-foreground">
									To: {task.recipientName}
								</p>
							)}
							{task.recipientPhone && (
								<a
									href={`tel:${task.recipientPhone}`}
									className="mt-1 inline-flex items-center gap-1 text-xs text-primary">
									<Phone className="h-3 w-3" />
									{task.recipientPhone}
								</a>
							)}
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Details */}
			<Card>
				<CardHeader>
					<CardTitle className="text-base">Details</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-2 gap-4 text-sm">
						<div>
							<p className="text-muted-foreground">Customer</p>
							<p className="font-medium">{task.customerName}</p>
						</div>
						<div>
							<p className="text-muted-foreground">Amount</p>
							<p className="font-medium">{formatCurrency(task.totalAmount)}</p>
						</div>
						<div>
							<p className="text-muted-foreground">Priority</p>
							<Badge
								variant={
									task.priority === ErrandPriority.Express
										? "destructive"
										: "secondary"
								}>
								{task.priority === ErrandPriority.Express
									? "Express"
									: task.priority === ErrandPriority.Scheduled
										? "Scheduled"
										: "Standard"}
							</Badge>
						</div>
						{task.estimatedDistance && (
							<div>
								<p className="text-muted-foreground">Distance</p>
								<p className="font-medium">
									{task.estimatedDistance.toFixed(1)} km
								</p>
							</div>
						)}
						{task.packageSize !== null && (
							<div>
								<p className="text-muted-foreground">Package Size</p>
								<p className="font-medium">
									{["Small", "Medium", "Large", "Extra Large"][
										task.packageSize
									] ?? "Unknown"}
								</p>
							</div>
						)}
						{task.isFragile && (
							<div className="col-span-2">
								<Badge variant="outline" className="gap-1 text-amber-600">
									<AlertTriangle className="h-3 w-3" />
									Fragile Package
								</Badge>
							</div>
						)}
					</div>
					{task.specialInstructions && (
						<>
							<Separator className="my-4" />
							<div>
								<p className="text-sm text-muted-foreground">
									Special Instructions
								</p>
								<p className="mt-1 text-sm">{task.specialInstructions}</p>
							</div>
						</>
					)}
					{task.description && (
						<>
							<Separator className="my-4" />
							<div>
								<p className="text-sm text-muted-foreground">Description</p>
								<p className="mt-1 text-sm">{task.description}</p>
							</div>
						</>
					)}
				</CardContent>
			</Card>

			{/* Status Timeline */}
			{task.statusHistory && task.statusHistory.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle className="text-base">Status History</CardTitle>
					</CardHeader>
					<CardContent>
						<StatusTimeline
							history={[...task.statusHistory].reverse()}
						/>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
