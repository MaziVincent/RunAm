"use client";

import { useState } from "react";
import {
	DollarSign,
	TrendingUp,
	Calendar,
	Wallet,
	Loader2,
	ArrowDownToLine,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	useRiderEarnings,
	useRiderPayouts,
	useRequestPayout,
	useRiderWallet,
} from "@/lib/hooks";
import { formatCurrency, cn } from "@/lib/utils";
import { PayoutStatus } from "@/types";
import { toast } from "sonner";

const payoutStatusLabel: Record<number, string> = {
	[PayoutStatus.Pending]: "Pending",
	[PayoutStatus.Processing]: "Processing",
	[PayoutStatus.Completed]: "Completed",
	[PayoutStatus.Failed]: "Failed",
};

const payoutStatusColor: Record<number, string> = {
	[PayoutStatus.Pending]:
		"bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
	[PayoutStatus.Processing]:
		"bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
	[PayoutStatus.Completed]:
		"bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
	[PayoutStatus.Failed]:
		"bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

function EarningsOverview() {
	const { data, isLoading } = useRiderEarnings();
	const earnings = data?.data;

	const cards = [
		{
			label: "Today",
			value: earnings?.todayEarnings ?? 0,
			icon: DollarSign,
			color: "text-green-600 bg-green-50 dark:bg-green-950/50",
		},
		{
			label: "This Week",
			value: earnings?.weekEarnings ?? 0,
			icon: TrendingUp,
			color: "text-blue-600 bg-blue-50 dark:bg-blue-950/50",
		},
		{
			label: "This Month",
			value: earnings?.monthEarnings ?? 0,
			icon: Calendar,
			color: "text-purple-600 bg-purple-50 dark:bg-purple-950/50",
		},
		{
			label: "Pending Payout",
			value: earnings?.pendingPayout ?? 0,
			icon: Wallet,
			color: "text-amber-600 bg-amber-50 dark:bg-amber-950/50",
		},
	];

	return (
		<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
			{cards.map((card) => (
				<Card key={card.label}>
					<CardContent className="flex items-center gap-3 p-4">
						{isLoading ? (
							<Skeleton className="h-12 w-full" />
						) : (
							<>
								<div
									className={cn(
										"flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
										card.color,
									)}>
									<card.icon className="h-5 w-5" />
								</div>
								<div>
									<p className="text-xs text-muted-foreground">{card.label}</p>
									<p className="text-xl font-bold">
										{formatCurrency(card.value)}
									</p>
								</div>
							</>
						)}
					</CardContent>
				</Card>
			))}
		</div>
	);
}

function DailyBreakdown() {
	const { data, isLoading } = useRiderEarnings();
	const dailyData = data?.data?.dailyEarnings ?? [];

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-base">Daily Breakdown</CardTitle>
			</CardHeader>
			<CardContent>
				{isLoading ? (
					<div className="space-y-3">
						{[1, 2, 3, 4, 5].map((i) => (
							<Skeleton key={i} className="h-8" />
						))}
					</div>
				) : dailyData.length === 0 ? (
					<div className="flex flex-col items-center py-8 text-center">
						<DollarSign className="h-8 w-8 text-muted-foreground/30" />
						<p className="mt-2 text-sm text-muted-foreground">
							No earnings data yet
						</p>
					</div>
				) : (
					<div className="space-y-2">
						{/* Simple bar chart */}
						{dailyData.slice(0, 14).map((day) => {
							const maxAmount = Math.max(...dailyData.map((d) => d.amount), 1);
							const width = (day.amount / maxAmount) * 100;
							return (
								<div key={day.date} className="flex items-center gap-3">
									<span className="w-20 shrink-0 text-xs text-muted-foreground">
										{new Date(day.date).toLocaleDateString("en-US", {
											weekday: "short",
											month: "short",
											day: "numeric",
										})}
									</span>
									<div className="flex flex-1 items-center gap-2">
										<div className="relative h-6 flex-1 overflow-hidden rounded bg-muted">
											<div
												className="absolute inset-y-0 left-0 rounded bg-primary/70 transition-all"
												style={{ width: `${width}%` }}
											/>
										</div>
										<span className="w-16 text-right text-xs font-medium">
											{formatCurrency(day.amount)}
										</span>
									</div>
									<span className="w-10 text-right text-[10px] text-muted-foreground">
										{day.taskCount} tasks
									</span>
								</div>
							);
						})}
					</div>
				)}
			</CardContent>
		</Card>
	);
}

function PayoutsHistory() {
	const { data, isLoading } = useRiderPayouts(1);
	const { data: walletData } = useRiderWallet();
	const requestPayout = useRequestPayout();
	const [amount, setAmount] = useState("");
	const [open, setOpen] = useState(false);
	const payouts = data?.data ?? [];
	const wallet = walletData?.data;

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between">
				<CardTitle className="text-base">Payout History</CardTitle>
				<Dialog open={open} onOpenChange={setOpen}>
					<DialogTrigger asChild>
						<Button
							size="sm"
							className="gap-2"
							disabled={requestPayout.isPending || !wallet}>
							{requestPayout.isPending ? (
								<Loader2 className="h-3 w-3 animate-spin" />
							) : (
								<ArrowDownToLine className="h-3 w-3" />
							)}
							Withdraw
						</Button>
					</DialogTrigger>
					<DialogContent className="sm:max-w-sm">
						<DialogHeader>
							<DialogTitle>Withdraw Earnings</DialogTitle>
							<DialogDescription>
								This payout will be sent to the bank account you provided during
								onboarding.
							</DialogDescription>
						</DialogHeader>
						<div className="space-y-4">
							<div className="space-y-2">
								<Input
									type="number"
									min={1}
									value={amount}
									onChange={(event) => setAmount(event.target.value)}
									placeholder="Enter withdrawal amount"
								/>
								<p className="text-xs text-muted-foreground">
									Available: {formatCurrency(wallet?.balance ?? 0)}
								</p>
							</div>
							<Button
								className="w-full"
								disabled={!amount || requestPayout.isPending}
								onClick={async () => {
									const numericAmount = Number(amount);
									if (!numericAmount || numericAmount <= 0) {
										toast.error("Enter a valid withdrawal amount.");
										return;
									}

									try {
										await requestPayout.mutateAsync(numericAmount);
										toast.success("Withdrawal requested.");
										setAmount("");
										setOpen(false);
									} catch (error: any) {
										toast.error(error?.message || "Failed to request payout");
									}
								}}>
								Submit Withdrawal
							</Button>
						</div>
					</DialogContent>
				</Dialog>
			</CardHeader>
			<CardContent>
				{isLoading ? (
					<div className="space-y-3">
						{[1, 2, 3].map((i) => (
							<Skeleton key={i} className="h-16 rounded-lg" />
						))}
					</div>
				) : payouts.length === 0 ? (
					<div className="flex flex-col items-center py-8 text-center">
						<Wallet className="h-8 w-8 text-muted-foreground/30" />
						<p className="mt-2 text-sm text-muted-foreground">No payouts yet</p>
					</div>
				) : (
					<div className="space-y-3">
						{payouts.map((payout) => (
							<div
								key={payout.id}
								className="flex items-center gap-3 rounded-lg border p-3">
								<div className="min-w-0 flex-1">
									<div className="flex items-center gap-2">
										<p className="text-sm font-semibold">
											{formatCurrency(payout.amount)}
										</p>
										<span
											className={cn(
												"rounded-full px-2 py-0.5 text-[10px] font-medium",
												payoutStatusColor[payout.status],
											)}>
											{payoutStatusLabel[payout.status]}
										</span>
									</div>
									<p className="text-xs text-muted-foreground">
										{payout.errandCount} deliveries •{" "}
										{new Date(payout.createdAt).toLocaleDateString()}
									</p>
									<p className="text-[10px] text-muted-foreground">
										{payout.destinationBankName} • ****
										{payout.destinationAccountNumber.slice(-4)}
									</p>
									{payout.periodStart && payout.periodEnd && (
										<p className="text-[10px] text-muted-foreground">
											{new Date(payout.periodStart).toLocaleDateString()} –{" "}
											{new Date(payout.periodEnd).toLocaleDateString()}
										</p>
									)}
								</div>
							</div>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	);
}

export default function RiderEarningsPage() {
	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold">Earnings</h1>
				<p className="text-sm text-muted-foreground">
					Track your delivery earnings and payouts
				</p>
			</div>

			<EarningsOverview />

			<div className="grid gap-6 lg:grid-cols-2">
				<DailyBreakdown />
				<PayoutsHistory />
			</div>
		</div>
	);
}
