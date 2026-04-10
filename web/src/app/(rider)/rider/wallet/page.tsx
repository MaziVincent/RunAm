"use client";

import { useState } from "react";
import {
	Wallet,
	ArrowUpRight,
	ArrowDownLeft,
	Loader2,
	Plus,
	CreditCard,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useRiderWallet, useRiderWalletTransactions } from "@/lib/hooks";
import { formatCurrency, cn } from "@/lib/utils";

export default function RiderWalletPage() {
	const [page, setPage] = useState(1);
	const { data: walletData, isLoading: walletLoading } = useRiderWallet();
	const { data: txData, isLoading: txLoading } =
		useRiderWalletTransactions(page);
	const wallet = walletData?.data;
	const transactions = txData?.data ?? [];
	const walletReady = !!wallet?.isActive;

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold">Wallet</h1>
				<p className="text-sm text-muted-foreground">
					Manage your rider wallet and transactions
				</p>
			</div>

			{/* Balance */}
			<Card className="bg-gradient-to-br from-primary/10 via-background to-primary/5">
				<CardContent className="p-6">
					{walletLoading ? (
						<Skeleton className="h-20" />
					) : (
						<div className="space-y-2">
							<p className="text-sm text-muted-foreground">Available Balance</p>
							<p className="text-3xl font-bold">
								{formatCurrency(walletReady ? (wallet?.balance ?? 0) : 0)}
							</p>
							<p className="text-xs text-muted-foreground">
								{wallet?.currency ?? "NGN"} Wallet
							</p>
							{walletReady && wallet.bankName && wallet.accountNumber && (
								<p className="text-xs text-muted-foreground">
									Fund via {wallet.bankName} • {wallet.accountNumber}
								</p>
							)}
						</div>
					)}
				</CardContent>
			</Card>

			{!walletReady && !walletLoading && (
				<Card>
					<CardContent className="py-8 text-center text-sm text-muted-foreground">
						Your rider wallet is created during onboarding. If this account
						predates that flow, complete onboarding again or contact support.
					</CardContent>
				</Card>
			)}

			{/* Transactions */}
			<Card>
				<CardHeader>
					<CardTitle className="text-base">Transaction History</CardTitle>
				</CardHeader>
				<CardContent>
					{txLoading ? (
						<div className="space-y-3">
							{[1, 2, 3, 4, 5].map((i) => (
								<Skeleton key={i} className="h-14 rounded-lg" />
							))}
						</div>
					) : transactions.length === 0 ? (
						<div className="flex flex-col items-center py-12 text-center">
							<CreditCard className="h-10 w-10 text-muted-foreground/30" />
							<p className="mt-3 text-sm text-muted-foreground">
								No transactions yet
							</p>
						</div>
					) : (
						<div className="space-y-2">
							{transactions.map((tx) => {
								const isCredit = tx.amount > 0;
								return (
									<div
										key={tx.id}
										className="flex items-center gap-3 rounded-lg border p-3">
										<div
											className={cn(
												"flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
												isCredit
													? "bg-green-50 text-green-600 dark:bg-green-950/30"
													: "bg-red-50 text-red-600 dark:bg-red-950/30",
											)}>
											{isCredit ? (
												<ArrowDownLeft className="h-4 w-4" />
											) : (
												<ArrowUpRight className="h-4 w-4" />
											)}
										</div>
										<div className="min-w-0 flex-1">
											<p className="truncate text-sm font-medium">
												{tx.description ?? (isCredit ? "Credit" : "Debit")}
											</p>
											<p className="text-xs text-muted-foreground">
												{new Date(tx.createdAt).toLocaleDateString()}
											</p>
										</div>
										<span
											className={cn(
												"text-sm font-semibold",
												isCredit ? "text-green-600" : "text-red-600",
											)}>
											{isCredit ? "+" : ""}
											{formatCurrency(Math.abs(tx.amount))}
										</span>
									</div>
								);
							})}

							{transactions.length >= 20 && (
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
					)}
				</CardContent>
			</Card>
		</div>
	);
}
