"use client";

import {
	Banknote,
	Clock,
	DollarSign,
	Info,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

export default function VendorPayoutsPage() {
	return (
		<div className="space-y-6">
			<h1 className="text-2xl font-bold">Payouts</h1>

			{/* Summary Cards */}
			<div className="grid gap-3 sm:grid-cols-2">
				<Card>
					<CardContent className="flex items-center gap-3 p-4">
						<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/50">
							<Clock className="h-5 w-5" />
						</div>
						<div>
							<p className="text-xs text-muted-foreground">Pending</p>
							<p className="text-xl font-bold">{formatCurrency(0)}</p>
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
							<p className="text-xl font-bold">{formatCurrency(0)}</p>
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
					<div className="flex flex-col items-center py-8 text-center">
						<Banknote className="h-10 w-10 text-muted-foreground/30" />
						<p className="mt-3 text-sm text-muted-foreground">
							No payouts yet
						</p>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
