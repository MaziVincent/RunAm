"use client";

import {
	Banknote,
	Clock,
	CheckCircle,
	AlertCircle,
	DollarSign,
	Building,
	Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, cn } from "@/lib/utils";

// Placeholder data — backend vendor payout entity needed
const PAYOUTS = [
	{
		id: "p1",
		period: "Dec 1 – Dec 7, 2024",
		amount: 45600,
		status: "completed",
		reference: "PAY-20241208-001",
		date: "2024-12-08",
	},
	{
		id: "p2",
		period: "Dec 8 – Dec 14, 2024",
		amount: 38200,
		status: "completed",
		reference: "PAY-20241215-001",
		date: "2024-12-15",
	},
	{
		id: "p3",
		period: "Dec 15 – Dec 21, 2024",
		amount: 52100,
		status: "pending",
		reference: "PAY-20241222-001",
		date: "2024-12-22",
	},
];

const statusIcon: Record<string, React.ReactNode> = {
	completed: <CheckCircle className="h-4 w-4 text-green-500" />,
	pending: <Clock className="h-4 w-4 text-amber-500" />,
	failed: <AlertCircle className="h-4 w-4 text-red-500" />,
};

const statusBadge: Record<string, string> = {
	completed: "bg-green-50 text-green-700 dark:bg-green-950/50 dark:text-green-400",
	pending: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
	failed: "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400",
};

export default function VendorPayoutsPage() {
	const pendingBalance = PAYOUTS.filter((p) => p.status === "pending").reduce(
		(sum, p) => sum + p.amount,
		0,
	);
	const totalPaid = PAYOUTS.filter((p) => p.status === "completed").reduce(
		(sum, p) => sum + p.amount,
		0,
	);

	return (
		<div className="space-y-6">
			<h1 className="text-2xl font-bold">Payouts</h1>

			{/* Summary Cards */}
			<div className="grid gap-3 sm:grid-cols-3">
				<Card>
					<CardContent className="flex items-center gap-3 p-4">
						<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/50">
							<Clock className="h-5 w-5" />
						</div>
						<div>
							<p className="text-xs text-muted-foreground">Pending</p>
							<p className="text-xl font-bold">
								{formatCurrency(pendingBalance)}
							</p>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="flex items-center gap-3 p-4">
						<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-600 dark:bg-green-950/50">
							<DollarSign className="h-5 w-5" />
						</div>
						<div>
							<p className="text-xs text-muted-foreground">Total Paid</p>
							<p className="text-xl font-bold">
								{formatCurrency(totalPaid)}
							</p>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="flex items-center gap-3 p-4">
						<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/50">
							<Building className="h-5 w-5" />
						</div>
						<div>
							<p className="text-xs text-muted-foreground">Bank Account</p>
							<p className="text-sm font-medium">GTBank ••••4521</p>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Info */}
			<Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
				<CardContent className="flex items-start gap-3 p-4">
					<Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
					<p className="text-sm text-blue-800 dark:text-blue-300">
						Payouts are processed weekly on Mondays. Earnings are available for
						withdrawal 48 hours after order completion.
					</p>
				</CardContent>
			</Card>

			{/* Payout History */}
			<Card>
				<CardHeader>
					<CardTitle className="text-base">Payout History</CardTitle>
				</CardHeader>
				<CardContent>
					{PAYOUTS.length === 0 ? (
						<div className="flex flex-col items-center py-8 text-center">
							<Banknote className="h-10 w-10 text-muted-foreground/30" />
							<p className="mt-3 text-sm text-muted-foreground">
								No payouts yet
							</p>
						</div>
					) : (
						<div className="divide-y">
							{PAYOUTS.map((payout) => (
								<div
									key={payout.id}
									className="flex items-center justify-between py-3">
									<div className="flex items-center gap-3">
										{statusIcon[payout.status]}
										<div>
											<p className="text-sm font-medium">{payout.period}</p>
											<p className="text-xs text-muted-foreground">
												{payout.reference}
											</p>
										</div>
									</div>
									<div className="text-right">
										<p className="text-sm font-bold">
											{formatCurrency(payout.amount)}
										</p>
										<Badge
											variant="outline"
											className={cn(
												"text-[10px]",
												statusBadge[payout.status],
											)}>
											{payout.status}
										</Badge>
									</div>
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>

			{/* Request Payout */}
			{pendingBalance > 0 && (
				<Button className="w-full gap-2">
					<Banknote className="h-4 w-4" />
					Request Payout — {formatCurrency(pendingBalance)}
				</Button>
			)}
		</div>
	);
}
