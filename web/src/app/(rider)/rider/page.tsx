"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
	Truck,
	DollarSign,
	Clock,
	Star,
	ChevronRight,
	AlertCircle,
	CheckCircle2,
	Loader2,
	MapPin,
	Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
	useRiderProfile,
	useRiderEarnings,
	useActiveTasks,
	useAvailableTasks,
	useRiderPerformance,
} from "@/lib/hooks";
import { formatCurrency, cn, approvalStatusLabel } from "@/lib/utils";
import { ApprovalStatus, ErrandStatus } from "@/types";

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

function PendingApproval() {
	return (
		<div className="flex flex-col items-center py-12 text-center">
			<div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950/30">
				<Clock className="h-8 w-8 text-amber-600" />
			</div>
			<h2 className="mt-4 text-xl font-semibold">Application Under Review</h2>
			<p className="mt-2 max-w-sm text-sm text-muted-foreground">
				Your rider application is being reviewed. This typically takes 1-2
				business days. We&apos;ll notify you once approved.
			</p>
		</div>
	);
}

function RejectedStatus() {
	return (
		<div className="flex flex-col items-center py-12 text-center">
			<div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/30">
				<AlertCircle className="h-8 w-8 text-red-600" />
			</div>
			<h2 className="mt-4 text-xl font-semibold">Application Rejected</h2>
			<p className="mt-2 max-w-sm text-sm text-muted-foreground">
				Unfortunately your rider application was not approved. Please contact
				support for more details.
			</p>
			<Link href="/rider/onboarding" className="mt-4">
				<Button>Re-apply</Button>
			</Link>
		</div>
	);
}

function StatsCards() {
	const { data: earningsData, isLoading: earningsLoading } = useRiderEarnings();
	const { data: perfData, isLoading: perfLoading } = useRiderPerformance();
	const earnings = earningsData?.data;
	const perf = perfData?.data;
	const isLoading = earningsLoading || perfLoading;

	const stats = [
		{
			label: "Today's Earnings",
			value: formatCurrency(earnings?.todayEarnings ?? 0),
			icon: DollarSign,
			color: "text-green-600 bg-green-50 dark:bg-green-950/50",
		},
		{
			label: "Active Tasks",
			value: "—",
			icon: Truck,
			color: "text-blue-600 bg-blue-50 dark:bg-blue-950/50",
			href: "/rider/tasks",
		},
		{
			label: "Rating",
			value: perf?.averageRating?.toFixed(1) ?? "—",
			icon: Star,
			color: "text-amber-600 bg-amber-50 dark:bg-amber-950/50",
		},
		{
			label: "Completion Rate",
			value: perf ? `${Math.round(perf.completionRate * 100)}%` : "—",
			icon: Zap,
			color: "text-purple-600 bg-purple-50 dark:bg-purple-950/50",
		},
	];

	return (
		<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
			{stats.map((stat) => (
				<Card key={stat.label}>
					<CardContent className="flex items-center gap-3 p-4">
						{isLoading ? (
							<Skeleton className="h-12 w-full" />
						) : (
							<>
								<div
									className={cn(
										"flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
										stat.color,
									)}>
									<stat.icon className="h-5 w-5" />
								</div>
								<div>
									<p className="text-xs text-muted-foreground">{stat.label}</p>
									<p className="text-xl font-bold">{stat.value}</p>
								</div>
								{stat.href && (
									<Link href={stat.href} className="ml-auto">
										<ChevronRight className="h-4 w-4 text-muted-foreground" />
									</Link>
								)}
							</>
						)}
					</CardContent>
				</Card>
			))}
		</div>
	);
}

function ActiveTaskCard() {
	const { data, isLoading } = useActiveTasks();
	const tasks = data?.data ?? [];

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between">
				<CardTitle className="text-base">Active Tasks</CardTitle>
				<Link href="/rider/tasks">
					<Button variant="ghost" size="sm">
						View All
					</Button>
				</Link>
			</CardHeader>
			<CardContent>
				{isLoading ? (
					<div className="space-y-3">
						{[1, 2].map((i) => (
							<Skeleton key={i} className="h-20 rounded-lg" />
						))}
					</div>
				) : tasks.length === 0 ? (
					<div className="flex flex-col items-center py-8 text-center">
						<Truck className="h-8 w-8 text-muted-foreground/30" />
						<p className="mt-2 text-sm text-muted-foreground">
							No active tasks
						</p>
						<Link href="/rider/tasks" className="mt-3">
							<Button size="sm" variant="outline">
								Browse Available Tasks
							</Button>
						</Link>
					</div>
				) : (
					<div className="space-y-3">
						{tasks.slice(0, 3).map((task) => (
							<Link
								key={task.id}
								href={`/rider/tasks/${task.id}`}
								className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent/50">
								<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
									<MapPin className="h-5 w-5 text-primary" />
								</div>
								<div className="min-w-0 flex-1">
									<p className="truncate text-sm font-medium">
										{task.pickupAddress}
									</p>
									<p className="truncate text-xs text-muted-foreground">
										→ {task.dropoffAddress}
									</p>
								</div>
								<Badge variant="secondary" className="shrink-0 text-xs">
									{errandStatusLabel[task.status] ?? "Unknown"}
								</Badge>
							</Link>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	);
}

function AvailableTasksCard() {
	const { data, isLoading } = useAvailableTasks();
	const tasks = data?.data ?? [];

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between">
				<CardTitle className="text-base">
					Available Tasks
					{tasks.length > 0 && (
						<Badge className="ml-2" variant="default">
							{tasks.length}
						</Badge>
					)}
				</CardTitle>
				<Link href="/rider/tasks">
					<Button variant="ghost" size="sm">
						View All
					</Button>
				</Link>
			</CardHeader>
			<CardContent>
				{isLoading ? (
					<div className="space-y-3">
						{[1, 2].map((i) => (
							<Skeleton key={i} className="h-20 rounded-lg" />
						))}
					</div>
				) : tasks.length === 0 ? (
					<div className="flex flex-col items-center py-8 text-center">
						<CheckCircle2 className="h-8 w-8 text-muted-foreground/30" />
						<p className="mt-2 text-sm text-muted-foreground">
							No tasks available right now
						</p>
					</div>
				) : (
					<div className="space-y-3">
						{tasks.slice(0, 5).map((task) => (
							<Link
								key={task.id}
								href={`/rider/tasks/${task.id}`}
								className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent/50">
								<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/30">
									<Truck className="h-5 w-5 text-blue-600" />
								</div>
								<div className="min-w-0 flex-1">
									<p className="truncate text-sm font-medium">
										{task.pickupAddress}
									</p>
									<p className="truncate text-xs text-muted-foreground">
										→ {task.dropoffAddress}
									</p>
								</div>
								<span className="shrink-0 text-sm font-semibold text-primary">
									{formatCurrency(task.totalAmount)}
								</span>
							</Link>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	);
}

function EarningsSummary() {
	const { data, isLoading } = useRiderEarnings();
	const earnings = data?.data;

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between">
				<CardTitle className="text-base">Earnings Summary</CardTitle>
				<Link href="/rider/earnings">
					<Button variant="ghost" size="sm">
						Details
					</Button>
				</Link>
			</CardHeader>
			<CardContent>
				{isLoading ? (
					<Skeleton className="h-32" />
				) : (
					<div className="space-y-3">
						{[
							{
								label: "Today",
								value: formatCurrency(earnings?.todayEarnings ?? 0),
							},
							{
								label: "This Week",
								value: formatCurrency(earnings?.weekEarnings ?? 0),
							},
							{
								label: "This Month",
								value: formatCurrency(earnings?.monthEarnings ?? 0),
							},
							{
								label: "Pending Payout",
								value: formatCurrency(earnings?.pendingPayout ?? 0),
							},
						].map((item) => (
							<div
								key={item.label}
								className="flex items-center justify-between">
								<span className="text-sm text-muted-foreground">
									{item.label}
								</span>
								<span className="text-sm font-semibold">{item.value}</span>
							</div>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	);
}

export default function RiderDashboardPage() {
	const { data, isLoading } = useRiderProfile();
	const profile = data?.data;
	const router = useRouter();

	// Auto-redirect to onboarding if no profile
	useEffect(() => {
		if (!isLoading && !profile) {
			router.replace("/rider/onboarding");
		}
	}, [isLoading, profile, router]);

	if (isLoading || !profile) {
		return (
			<div className="flex items-center justify-center py-20">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (profile.approvalStatus === ApprovalStatus.Pending) {
		return <PendingApproval />;
	}

	if (profile.approvalStatus === ApprovalStatus.Rejected) {
		return <RejectedStatus />;
	}

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold">
					Welcome back, {profile.riderName?.split(" ")[0] ?? "Rider"}
				</h1>
				<p className="text-sm text-muted-foreground">
					{profile.isOnline
						? "You're online and receiving tasks"
						: "Go online to start receiving tasks"}
				</p>
			</div>

			<StatsCards />

			<div className="grid gap-6 lg:grid-cols-2">
				<ActiveTaskCard />
				<AvailableTasksCard />
			</div>

			<EarningsSummary />
		</div>
	);
}
