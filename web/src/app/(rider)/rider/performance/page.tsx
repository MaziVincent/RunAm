"use client";

import {
	TrendingUp,
	Star,
	Zap,
	Clock,
	Truck,
	Target,
	Award,
	Medal,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
	useRiderPerformance,
	useRiderProfile,
	useRiderReviewSummary,
} from "@/lib/hooks";
import { cn } from "@/lib/utils";

function MetricCard({
	label,
	value,
	suffix,
	icon: Icon,
	color,
	description,
}: {
	label: string;
	value: string;
	suffix?: string;
	icon: typeof Star;
	color: string;
	description: string;
}) {
	return (
		<Card>
			<CardContent className="p-4">
				<div className="flex items-start justify-between">
					<div>
						<p className="text-xs text-muted-foreground">{label}</p>
						<div className="mt-1 flex items-baseline gap-1">
							<span className="text-2xl font-bold">{value}</span>
							{suffix && (
								<span className="text-sm text-muted-foreground">{suffix}</span>
							)}
						</div>
						<p className="mt-1 text-xs text-muted-foreground">{description}</p>
					</div>
					<div
						className={cn(
							"flex h-10 w-10 items-center justify-center rounded-lg",
							color,
						)}>
						<Icon className="h-5 w-5" />
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

function RatingBreakdown({
	rating,
	distribution,
}: {
	rating: number;
	distribution: { 5: number; 4: number; 3: number; 2: number; 1: number };
}) {
	const stars = [5, 4, 3, 2, 1];
	const total = Object.values(distribution).reduce((a, b) => a + b, 0);

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-base">Rating Breakdown</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="flex items-center gap-6">
					<div className="text-center">
						<p className="text-4xl font-bold">{rating.toFixed(1)}</p>
						<div className="mt-1 flex gap-0.5">
							{[1, 2, 3, 4, 5].map((s) => (
								<Star
									key={s}
									className={cn(
										"h-4 w-4",
										s <= Math.round(rating)
											? "fill-amber-400 text-amber-400"
											: "text-muted-foreground/30",
									)}
								/>
							))}
						</div>
						<p className="mt-1 text-xs text-muted-foreground">
							{total} review{total !== 1 ? "s" : ""}
						</p>
					</div>
					<div className="flex-1 space-y-1.5">
						{stars.map((star) => {
							const count = distribution[star as keyof typeof distribution];
							const pct = total > 0 ? (count / total) * 100 : 0;
							return (
								<div key={star} className="flex items-center gap-2">
									<span className="w-3 text-xs text-muted-foreground">
										{star}
									</span>
									<Star className="h-3 w-3 text-amber-400" />
									<div className="relative h-2 flex-1 overflow-hidden rounded-full bg-muted">
										<div
											className="absolute inset-y-0 left-0 rounded-full bg-amber-400"
											style={{ width: `${pct}%` }}
										/>
									</div>
									<span className="w-8 text-right text-[10px] text-muted-foreground">
										{Math.round(pct)}%
									</span>
								</div>
							);
						})}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

function PerformanceGauge({
	label,
	value,
	color,
}: {
	label: string;
	value: number;
	color: string;
}) {
	const pct = Math.round(value * 100);
	const circumference = 2 * Math.PI * 40;
	const offset = circumference * (1 - value);

	return (
		<div className="flex flex-col items-center gap-2">
			<div className="relative h-24 w-24">
				<svg
					viewBox="0 0 100 100"
					className="h-full w-full -rotate-90"
					aria-label={`${label}: ${pct}%`}>
					<circle
						cx="50"
						cy="50"
						r="40"
						fill="none"
						stroke="currentColor"
						className="text-muted"
						strokeWidth="8"
					/>
					<circle
						cx="50"
						cy="50"
						r="40"
						fill="none"
						stroke="currentColor"
						className={color}
						strokeWidth="8"
						strokeLinecap="round"
						strokeDasharray={circumference}
						strokeDashoffset={offset}
					/>
				</svg>
				<div className="absolute inset-0 flex items-center justify-center">
					<span className="text-lg font-bold">{pct}%</span>
				</div>
			</div>
			<span className="text-xs text-muted-foreground">{label}</span>
		</div>
	);
}

function BadgesSection({
	totalDeliveries,
	rating,
}: {
	totalDeliveries: number;
	rating: number;
}) {
	const badges = [
		{
			icon: Truck,
			label: "First Delivery",
			earned: totalDeliveries >= 1,
			description: "Complete your first delivery",
		},
		{
			icon: Medal,
			label: "50 Deliveries",
			earned: totalDeliveries >= 50,
			description: "Complete 50 deliveries",
		},
		{
			icon: Award,
			label: "100 Club",
			earned: totalDeliveries >= 100,
			description: "Complete 100 deliveries",
		},
		{
			icon: Star,
			label: "Top Rated",
			earned: rating >= 4.8,
			description: "Maintain 4.8+ rating",
		},
		{
			icon: Zap,
			label: "Speed Demon",
			earned: totalDeliveries >= 200,
			description: "Complete 200 deliveries",
		},
		{
			icon: Target,
			label: "500 Master",
			earned: totalDeliveries >= 500,
			description: "Complete 500 deliveries",
		},
	];

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-base">Badges</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
					{badges.map((badge) => (
						<div
							key={badge.label}
							className={cn(
								"flex flex-col items-center gap-1.5 rounded-lg p-3 text-center transition-colors",
								badge.earned
									? "bg-primary/5 text-primary"
									: "bg-muted/50 text-muted-foreground/40",
							)}>
							<badge.icon
								className={cn("h-6 w-6", badge.earned && "fill-primary/20")}
							/>
							<span className="text-[10px] font-medium leading-tight">
								{badge.label}
							</span>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}

export default function RiderPerformancePage() {
	const { data, isLoading } = useRiderPerformance();
	const { data: profileData } = useRiderProfile();
	const { data: reviewSummaryData } = useRiderReviewSummary();
	const perf = data?.data;
	const profile = profileData?.data;
	const summary = reviewSummaryData?.data;

	if (isLoading) {
		return (
			<div className="space-y-6">
				<div>
					<h1 className="text-2xl font-bold">Performance</h1>
					<p className="text-sm text-muted-foreground">
						Track your delivery metrics and achievements
					</p>
				</div>
				<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
					{[1, 2, 3, 4, 5, 6].map((i) => (
						<Skeleton key={i} className="h-28 rounded-lg" />
					))}
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold">Performance</h1>
				<p className="text-sm text-muted-foreground">
					Track your delivery metrics and achievements
				</p>
			</div>

			{/* Key metrics */}
			<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
				<MetricCard
					label="Average Rating"
					value={(perf?.averageRating ?? 0).toFixed(1)}
					suffix="/ 5.0"
					icon={Star}
					color="text-amber-600 bg-amber-50 dark:bg-amber-950/50"
					description="Based on customer reviews"
				/>
				<MetricCard
					label="Completion Rate"
					value={`${Math.round((perf?.completionRate ?? 0) * 100)}`}
					suffix="%"
					icon={Target}
					color="text-green-600 bg-green-50 dark:bg-green-950/50"
					description="Successfully delivered tasks"
				/>
				<MetricCard
					label="On-Time Rate"
					value={`${Math.round((perf?.onTimeRate ?? 0) * 100)}`}
					suffix="%"
					icon={Clock}
					color="text-blue-600 bg-blue-50 dark:bg-blue-950/50"
					description="Delivered within estimated time"
				/>
				<MetricCard
					label="Total Deliveries"
					value={String(perf?.totalDeliveries ?? 0)}
					icon={Truck}
					color="text-purple-600 bg-purple-50 dark:bg-purple-950/50"
					description="All-time completed deliveries"
				/>
				<MetricCard
					label="Monthly Deliveries"
					value={String(perf?.monthlyDeliveries ?? 0)}
					icon={TrendingUp}
					color="text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50"
					description="Completed this month"
				/>
				<MetricCard
					label="Avg Response Time"
					value={
						perf?.averageResponseTime
							? `${Math.round(perf.averageResponseTime / 60)}`
							: "—"
					}
					suffix="min"
					icon={Zap}
					color="text-orange-600 bg-orange-50 dark:bg-orange-950/50"
					description="Time to accept new tasks"
				/>
			</div>

			{/* Gauges */}
			<Card>
				<CardHeader>
					<CardTitle className="text-base">Key Rates</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex justify-around">
						<PerformanceGauge
							label="Completion"
							value={perf?.completionRate ?? 0}
							color="text-green-500"
						/>
						<PerformanceGauge
							label="On-Time"
							value={perf?.onTimeRate ?? 0}
							color="text-blue-500"
						/>
						<PerformanceGauge
							label="Rating"
							value={(perf?.averageRating ?? 0) / 5}
							color="text-amber-500"
						/>
					</div>
				</CardContent>
			</Card>

			{/* Rating breakdown */}
			<RatingBreakdown
				rating={perf?.averageRating ?? 0}
				distribution={{
					5: summary?.fiveStarCount ?? 0,
					4: summary?.fourStarCount ?? 0,
					3: summary?.threeStarCount ?? 0,
					2: summary?.twoStarCount ?? 0,
					1: summary?.oneStarCount ?? 0,
				}}
			/>

			{/* Badges */}
			<BadgesSection
				totalDeliveries={perf?.totalDeliveries ?? 0}
				rating={perf?.averageRating ?? 0}
			/>
		</div>
	);
}
