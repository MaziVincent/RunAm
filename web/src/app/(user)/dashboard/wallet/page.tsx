"use client";

import { useState } from "react";
import {
	Wallet,
	ArrowUpRight,
	ArrowDownRight,
	Plus,
	Clock,
	Loader2,
	Building2,
	ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
import { useCreateWallet, useWallet, useWalletTransactions } from "@/lib/hooks";
import { formatCurrency, cn } from "@/lib/utils";
import { TransactionType } from "@/types";
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

function CreateWalletDialog() {
	const [nin, setNin] = useState("");
	const [open, setOpen] = useState(false);
	const createWallet = useCreateWallet();

	async function handleCreateWallet() {
		const normalizedNin = nin.replace(/\D/g, "");
		if (normalizedNin.length !== 11) {
			toast.error("NIN must be exactly 11 digits");
			return;
		}
		try {
			await createWallet.mutateAsync({ nin: normalizedNin });
			toast.success(
				"Wallet created. Fund it using the reserved account below.",
			);
			setOpen(false);
			setNin("");
		} catch (error: any) {
			toast.error(error?.message || "Wallet creation failed");
		}
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button className="gap-2">
					<Plus className="h-4 w-4" />
					Create Wallet
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Create Monnify Wallet</DialogTitle>
					<DialogDescription>
						RunAm creates one reserved Monnify account per wallet. NIN is
						required before that account can be provisioned.
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-4">
					<div className="space-y-2">
						<Label>NIN</Label>
						<Input
							inputMode="numeric"
							maxLength={11}
							value={nin}
							onChange={(e) => setNin(e.target.value.replace(/\D/g, ""))}
							placeholder="Enter your 11-digit NIN"
						/>
					</div>
					<Button
						className="w-full gap-2"
						disabled={nin.length !== 11 || createWallet.isPending}
						onClick={handleCreateWallet}>
						{createWallet.isPending ? (
							<Loader2 className="h-4 w-4 animate-spin" />
						) : (
							<ShieldCheck className="h-4 w-4" />
						)}
						{createWallet.isPending ? "Creating..." : "Create Wallet"}
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
	const walletReady = !!wallet?.isActive;

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">Wallet</h1>
					<p className="text-sm text-muted-foreground">
						Manage your balance, funding account, and transactions
					</p>
				</div>
				{!walletReady && <CreateWalletDialog />}
			</div>

			{/* Balance Card */}
			<Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
				<CardContent className="p-6">
					<p className="text-sm opacity-90">Available Balance</p>
					{walletLoading ? (
						<Skeleton className="mt-2 h-10 w-40 bg-white/20" />
					) : (
						<p className="mt-1 text-4xl font-bold">
							{formatCurrency(walletReady ? (wallet?.balance ?? 0) : 0)}
						</p>
					)}
					<p className="mt-2 text-xs opacity-70">
						{wallet?.currency ?? "NGN"} Wallet
					</p>
				</CardContent>
			</Card>

			{walletReady ? (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-base">
							<Building2 className="h-4 w-4 text-primary" />
							Fund Your Wallet
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3 text-sm">
						<p className="text-muted-foreground">
							Transfer to this reserved Monnify account from your bank app. The
							balance changes only after webhook settlement succeeds.
						</p>
						<div className="grid gap-3 sm:grid-cols-2">
							<div className="rounded-lg border p-3">
								<p className="text-xs text-muted-foreground">Bank</p>
								<p className="font-semibold">{wallet.bankName}</p>
							</div>
							<div className="rounded-lg border p-3">
								<p className="text-xs text-muted-foreground">Account Number</p>
								<p className="font-semibold tracking-wide">
									{wallet.accountNumber}
								</p>
							</div>
							<div className="rounded-lg border p-3">
								<p className="text-xs text-muted-foreground">Account Name</p>
								<p className="font-semibold">{wallet.accountName}</p>
							</div>
							<div className="rounded-lg border p-3">
								<p className="text-xs text-muted-foreground">Reference</p>
								<p className="font-semibold">{wallet.accountReference}</p>
							</div>
						</div>
					</CardContent>
				</Card>
			) : (
				<Card>
					<CardContent className="flex flex-col items-center py-10 text-center">
						<ShieldCheck className="h-10 w-10 text-primary/70" />
						<p className="mt-3 text-sm font-medium">
							Create your wallet to start funding and spending.
						</p>
						<p className="mt-1 max-w-md text-sm text-muted-foreground">
							RunAm wallets are Monnify-backed. Once created, the same reserved
							account is reused for all dashboard funding.
						</p>
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
