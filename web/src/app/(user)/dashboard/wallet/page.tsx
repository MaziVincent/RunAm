"use client";

import { useState } from "react";
import {
	Wallet,
	ArrowUpRight,
	ArrowDownRight,
	Plus,
	TrendingUp,
	TrendingDown,
	Clock,
	Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { useWallet, useWalletTransactions, useTopUpWallet } from "@/lib/hooks";
import { formatCurrency, cn } from "@/lib/utils";
import { TransactionType, TransactionSource } from "@/types";
import { toast } from "sonner";

const sourceLabel: Record<number, string> = {
	0: "Top Up",
	1: "Errand Payment",
	2: "Errand Earning",
	3: "Refund",
	4: "Tip",
	5: "Bonus",
	6: "Withdrawal",
	7: "Commission",
};

const TOP_UP_PRESETS = [1000, 2000, 5000, 10000];

function TopUpDialog() {
	const [amount, setAmount] = useState("");
	const [open, setOpen] = useState(false);
	const topUp = useTopUpWallet();

	async function handleTopUp() {
		const numericAmount = parseInt(amount, 10);
		if (!numericAmount || numericAmount < 100) {
			toast.error("Minimum top-up is ₦100");
			return;
		}
		try {
			await topUp.mutateAsync({ amount: numericAmount, paymentMethod: 0 });
			toast.success(`₦${numericAmount.toLocaleString()} added to wallet`);
			setOpen(false);
			setAmount("");
		} catch {
			toast.error("Top-up failed");
		}
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button className="gap-2">
					<Plus className="h-4 w-4" />
					Top Up
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Top Up Wallet</DialogTitle>
					<DialogDescription>
						Add funds to your wallet balance.
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-4">
					<div className="grid grid-cols-2 gap-2">
						{TOP_UP_PRESETS.map((preset) => (
							<Button
								key={preset}
								variant={amount === String(preset) ? "default" : "outline"}
								onClick={() => setAmount(String(preset))}>
								{formatCurrency(preset)}
							</Button>
						))}
					</div>
					<div className="space-y-2">
						<Label>Custom Amount</Label>
						<Input
							type="number"
							value={amount}
							onChange={(e) => setAmount(e.target.value)}
							placeholder="Enter amount"
							min={100}
						/>
					</div>
					<Button
						className="w-full gap-2"
						disabled={!amount || topUp.isPending}
						onClick={handleTopUp}>
						{topUp.isPending ? (
							<Loader2 className="h-4 w-4 animate-spin" />
						) : (
							<Wallet className="h-4 w-4" />
						)}
						{topUp.isPending
							? "Processing..."
							: `Add ${amount ? formatCurrency(parseInt(amount)) : ""}`}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}

export default function WalletPage() {
	const [txPage, setTxPage] = useState(1);
	const { data: walletData, isLoading: walletLoading } = useWallet();
	const { data: txData, isLoading: txLoading } = useWalletTransactions(txPage);

	const wallet = walletData?.data;
	const transactions = txData?.data ?? [];
	const txPagination = txData?.meta;

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">Wallet</h1>
					<p className="text-sm text-muted-foreground">
						Manage your balance and transactions
					</p>
				</div>
				<TopUpDialog />
			</div>

			{/* Balance Card */}
			<Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
				<CardContent className="p-6">
					<p className="text-sm opacity-90">Available Balance</p>
					{walletLoading ? (
						<Skeleton className="mt-2 h-10 w-40 bg-white/20" />
					) : (
						<p className="mt-1 text-4xl font-bold">
							{formatCurrency(wallet?.balance ?? 0)}
						</p>
					)}
					<p className="mt-2 text-xs opacity-70">
						{wallet?.currency ?? "NGN"} Wallet
					</p>
				</CardContent>
			</Card>

			{/* Transactions */}
			<Card>
				<CardHeader>
					<CardTitle className="text-base">Transaction History</CardTitle>
				</CardHeader>
				<CardContent>
					{txLoading ? (
						<div className="space-y-3">
							{[1, 2, 3, 4].map((i) => (
								<Skeleton key={i} className="h-14 rounded-lg" />
							))}
						</div>
					) : transactions.length === 0 ? (
						<div className="flex flex-col items-center py-12 text-center">
							<Clock className="h-10 w-10 text-muted-foreground/30" />
							<p className="mt-3 text-sm text-muted-foreground">
								No transactions yet
							</p>
						</div>
					) : (
						<div className="divide-y">
							{transactions.map((tx) => (
								<div
									key={tx.id}
									className="flex items-center justify-between py-3">
									<div className="flex items-center gap-3">
										<div
											className={cn(
												"flex h-9 w-9 items-center justify-center rounded-lg",
												tx.type === TransactionType.Credit
													? "bg-green-50 dark:bg-green-950/50"
													: "bg-red-50 dark:bg-red-950/50",
											)}>
											{tx.type === TransactionType.Credit ? (
												<ArrowDownRight className="h-4 w-4 text-green-600" />
											) : (
												<ArrowUpRight className="h-4 w-4 text-red-500" />
											)}
										</div>
										<div>
											<p className="text-sm font-medium">
												{tx.description || sourceLabel[tx.source]}
											</p>
											<p className="text-xs text-muted-foreground">
												{new Date(tx.createdAt).toLocaleDateString("en-NG", {
													month: "short",
													day: "numeric",
													hour: "2-digit",
													minute: "2-digit",
												})}
											</p>
										</div>
									</div>
									<div className="text-right">
										<p
											className={cn(
												"text-sm font-semibold",
												tx.type === TransactionType.Credit
													? "text-green-600"
													: "text-red-500",
											)}>
											{tx.type === TransactionType.Credit ? "+" : "-"}
											{formatCurrency(tx.amount)}
										</p>
										<p className="text-[10px] text-muted-foreground">
											Bal: {formatCurrency(tx.balanceAfter)}
										</p>
									</div>
								</div>
							))}
						</div>
					)}

					{/* Pagination */}
					{txPagination && txPagination.totalPages > 1 && (
						<div className="mt-4 flex items-center justify-center gap-2">
							<Button
								variant="outline"
								size="sm"
								disabled={txPage <= 1}
								onClick={() => setTxPage((p) => p - 1)}>
								Previous
							</Button>
							<span className="text-xs text-muted-foreground">
								{txPage} / {txPagination.totalPages}
							</span>
							<Button
								variant="outline"
								size="sm"
								disabled={txPage >= txPagination.totalPages}
								onClick={() => setTxPage((p) => p + 1)}>
								Next
							</Button>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
