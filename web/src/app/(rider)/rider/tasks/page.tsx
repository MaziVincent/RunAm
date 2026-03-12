"use client";

import { useState } from "react";
import Link from "next/link";
import {
	Truck,
	Clock,
	CheckCircle2,
	MapPin,
	Loader2,
	ChevronRight,
	Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
	useAvailableTasks,
	useActiveTasks,
	useTaskHistory,
	useAcceptTask,
} from "@/lib/hooks";
import { formatCurrency, cn } from "@/lib/utils";
import { ErrandStatus, ErrandPriority } from "@/types";
import type { ErrandDto } from "@/types";
import { toast } from "sonner";

const errandStatusLabel: Record<number, string> = {
	[ErrandStatus.Pending]: "Pending",
	[ErrandStatus.Accepted]: "Accepted",
	[ErrandStatus.EnRouteToPickup]: "En Route to Pickup",
	[ErrandStatus.ArrivedAtPickup]: "At Pickup",
	[ErrandStatus.PackageCollected]: "Collected",
	[ErrandStatus.EnRouteToDropoff]: "En Route to Dropoff",
	[ErrandStatus.ArrivedAtDropoff]: "At Dropoff",
	[ErrandStatus.Delivered]: "Delivered",
	[ErrandStatus.Cancelled]: "Cancelled",
	[ErrandStatus.Failed]: "Failed",
};

const errandStatusColor: Record<number, string> = {
	[ErrandStatus.Pending]: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
	[ErrandStatus.Accepted]: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
	[ErrandStatus.EnRouteToPickup]: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
	[ErrandStatus.ArrivedAtPickup]: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
	[ErrandStatus.PackageCollected]: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
	[ErrandStatus.EnRouteToDropoff]: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300",
	[ErrandStatus.ArrivedAtDropoff]: "bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300",
	[ErrandStatus.Delivered]: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
	[ErrandStatus.Cancelled]: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
	[ErrandStatus.Failed]: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

const priorityLabel: Record<number, string> = {
	[ErrandPriority.Standard]: "Standard",
	[ErrandPriority.Express]: "Express",
	[ErrandPriority.Scheduled]: "Scheduled",
};

type Tab = "available" | "active" | "history";

const TABS: { key: Tab; label: string; icon: typeof Truck }[] = [
	{ key: "available", label: "Available", icon: Truck },
	{ key: "active", label: "Active", icon: Clock },
	{ key: "history", label: "History", icon: CheckCircle2 },
];

function TaskCard({
	task,
	showAccept,
}: {
	task: ErrandDto;
	showAccept?: boolean;
}) {
	const acceptTask = useAcceptTask();

	return (
		<div className="rounded-lg border transition-colors hover:bg-accent/30">
			<Link
				href={`/rider/tasks/${task.id}`}
				className="flex items-start gap-3 p-4">
				<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
					<MapPin className="h-5 w-5 text-primary" />
				</div>
				<div className="min-w-0 flex-1 space-y-1">
					<div className="flex items-start justify-between gap-2">
						<p className="text-sm font-medium leading-tight">
							{task.pickupAddress}
						</p>
						<span className="shrink-0 text-sm font-bold text-primary">
							{formatCurrency(task.totalAmount)}
						</span>
					</div>
					<p className="text-xs text-muted-foreground">
						→ {task.dropoffAddress}
					</p>
					<div className="flex flex-wrap items-center gap-2 pt-1">
						<span
							className={cn(
								"inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium",
								errandStatusColor[task.status],
							)}>
							{errandStatusLabel[task.status]}
						</span>
						{task.priority === ErrandPriority.Express && (
							<Badge
								variant="destructive"
								className="text-[10px] px-1.5 py-0">
								Express
							</Badge>
						)}
						{task.estimatedDistance && (
							<span className="text-[10px] text-muted-foreground">
								~{task.estimatedDistance.toFixed(1)} km
							</span>
						)}
						{task.estimatedDuration && (
							<span className="text-[10px] text-muted-foreground">
								~{task.estimatedDuration} min
							</span>
						)}
					</div>
				</div>
				<ChevronRight className="mt-2 h-4 w-4 shrink-0 text-muted-foreground" />
			</Link>
			{showAccept && (
				<div className="border-t px-4 py-2">
					<Button
						size="sm"
						className="w-full"
						disabled={acceptTask.isPending}
						onClick={async (e) => {
							e.preventDefault();
							try {
								await acceptTask.mutateAsync(task.id);
								toast.success("Task accepted!");
							} catch {
								toast.error("Failed to accept task");
							}
						}}>
						{acceptTask.isPending && (
							<Loader2 className="mr-2 h-3 w-3 animate-spin" />
						)}
						Accept Task
					</Button>
				</div>
			)}
		</div>
	);
}

function AvailableTab() {
	const { data, isLoading } = useAvailableTasks();
	const tasks = data?.data ?? [];

	if (isLoading) {
		return (
			<div className="space-y-3">
				{[1, 2, 3].map((i) => (
					<Skeleton key={i} className="h-28 rounded-lg" />
				))}
			</div>
		);
	}

	if (tasks.length === 0) {
		return (
			<div className="flex flex-col items-center py-16 text-center">
				<Truck className="h-12 w-12 text-muted-foreground/30" />
				<p className="mt-3 text-sm font-medium">No tasks available</p>
				<p className="mt-1 text-xs text-muted-foreground">
					New tasks will appear here when customers place orders
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-3">
			{tasks.map((task) => (
				<TaskCard key={task.id} task={task} showAccept />
			))}
		</div>
	);
}

function ActiveTab() {
	const { data, isLoading } = useActiveTasks();
	const tasks = data?.data ?? [];

	if (isLoading) {
		return (
			<div className="space-y-3">
				{[1, 2].map((i) => (
					<Skeleton key={i} className="h-24 rounded-lg" />
				))}
			</div>
		);
	}

	if (tasks.length === 0) {
		return (
			<div className="flex flex-col items-center py-16 text-center">
				<Clock className="h-12 w-12 text-muted-foreground/30" />
				<p className="mt-3 text-sm font-medium">No active tasks</p>
				<p className="mt-1 text-xs text-muted-foreground">
					Accept an available task to get started
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-3">
			{tasks.map((task) => (
				<TaskCard key={task.id} task={task} />
			))}
		</div>
	);
}

function HistoryTab() {
	const [page, setPage] = useState(1);
	const { data, isLoading } = useTaskHistory(page);
	const tasks = data?.data ?? [];

	if (isLoading) {
		return (
			<div className="space-y-3">
				{[1, 2, 3].map((i) => (
					<Skeleton key={i} className="h-24 rounded-lg" />
				))}
			</div>
		);
	}

	if (tasks.length === 0) {
		return (
			<div className="flex flex-col items-center py-16 text-center">
				<CheckCircle2 className="h-12 w-12 text-muted-foreground/30" />
				<p className="mt-3 text-sm font-medium">No completed tasks</p>
				<p className="mt-1 text-xs text-muted-foreground">
					Your delivery history will appear here
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-3">
			{tasks.map((task) => (
				<TaskCard key={task.id} task={task} />
			))}
			{tasks.length >= 20 && (
				<div className="flex justify-center gap-2 pt-4">
					<Button
						variant="outline"
						size="sm"
						disabled={page <= 1}
						onClick={() => setPage((p) => p - 1)}>
						Previous
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => setPage((p) => p + 1)}>
						Next
					</Button>
				</div>
			)}
		</div>
	);
}

export default function RiderTasksPage() {
	const [tab, setTab] = useState<Tab>("available");

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold">Tasks</h1>
				<p className="text-sm text-muted-foreground">
					Browse, accept, and manage your delivery tasks
				</p>
			</div>

			{/* Tab bar */}
			<div className="flex gap-1 rounded-lg bg-muted p-1">
				{TABS.map((t) => (
					<button
						key={t.key}
						onClick={() => setTab(t.key)}
						className={cn(
							"flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
							tab === t.key
								? "bg-background text-foreground shadow-sm"
								: "text-muted-foreground hover:text-foreground",
						)}>
						<t.icon className="h-4 w-4" />
						{t.label}
					</button>
				))}
			</div>

			{/* Tab content */}
			<Card>
				<CardContent className="p-4">
					{tab === "available" && <AvailableTab />}
					{tab === "active" && <ActiveTab />}
					{tab === "history" && <HistoryTab />}
				</CardContent>
			</Card>
		</div>
	);
}
