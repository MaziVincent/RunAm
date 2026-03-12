"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
	CheckCircle2,
	Clock,
	MapPin,
	ArrowRight,
	ShoppingBag,
	Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useErrandDetail } from "@/lib/hooks";
import { formatCurrency, cn } from "@/lib/utils";
import { motion } from "framer-motion";

function OrderConfirmationContent() {
	const searchParams = useSearchParams();
	const errandId = searchParams.get("id");

	const { data, isLoading } = useErrandDetail(errandId ?? "");
	const errand = data?.data;

	return (
		<div className="container mx-auto max-w-lg px-4 py-12 text-center">
			{/* Success animation */}
			<motion.div
				initial={{ scale: 0, opacity: 0 }}
				animate={{ scale: 1, opacity: 1 }}
				transition={{
					type: "spring",
					stiffness: 200,
					damping: 15,
					delay: 0.1,
				}}>
				<div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
					<CheckCircle2 className="h-12 w-12 text-primary" />
				</div>
			</motion.div>

			<motion.div
				initial={{ y: 20, opacity: 0 }}
				animate={{ y: 0, opacity: 1 }}
				transition={{ delay: 0.3 }}>
				<h1 className="mt-6 text-2xl font-bold">Order Placed!</h1>
				<p className="mt-2 text-muted-foreground">
					Your order has been placed successfully. We&apos;re on it!
				</p>
			</motion.div>

			{/* Order Details Card */}
			{errand && (
				<motion.div
					initial={{ y: 20, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					transition={{ delay: 0.5 }}>
					<Card className="mt-8 text-left">
						<CardContent className="space-y-4 pt-6">
							{/* Order ID */}
							<div>
								<p className="text-xs text-muted-foreground">Order ID</p>
								<p className="font-mono text-sm font-medium">
									{errand.id.slice(0, 8).toUpperCase()}
								</p>
							</div>

							<Separator />

							{/* Status */}
							<div className="flex items-center gap-3">
								<div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
									<Clock className="h-5 w-5 text-blue-500" />
								</div>
								<div>
									<p className="text-sm font-semibold">
										Finding a rider for you
									</p>
									<p className="text-xs text-muted-foreground">
										Your order is being prepared while we match you with a rider
									</p>
								</div>
							</div>

							{/* Delivery Address */}
							<div className="flex items-start gap-3">
								<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
									<MapPin className="h-5 w-5 text-primary" />
								</div>
								<div>
									<p className="text-sm font-semibold">Delivery to</p>
									<p className="text-xs text-muted-foreground">
										{errand.dropoffAddress}
									</p>
								</div>
							</div>

							{/* Cost */}
							<Separator />
							<div className="flex justify-between">
								<span className="text-sm text-muted-foreground">
									Total Paid
								</span>
								<span className="font-bold">
									{formatCurrency(errand.totalAmount)}
								</span>
							</div>
						</CardContent>
					</Card>
				</motion.div>
			)}

			{/* Actions */}
			<motion.div
				initial={{ y: 20, opacity: 0 }}
				animate={{ y: 0, opacity: 1 }}
				transition={{ delay: 0.7 }}
				className="mt-8 space-y-3">
				{errandId && (
					<Button asChild className="w-full gap-2" size="lg">
						<Link href={`/dashboard/errands/${errandId}`}>
							<Package className="h-4 w-4" />
							Track Order
							<ArrowRight className="h-4 w-4" />
						</Link>
					</Button>
				)}
				<Button variant="outline" asChild className="w-full gap-2" size="lg">
					<Link href="/shop">
						<ShoppingBag className="h-4 w-4" />
						Continue Shopping
					</Link>
				</Button>
			</motion.div>
		</div>
	);
}

export default function OrderConfirmationPage() {
	return (
		<Suspense
			fallback={
				<div className="container mx-auto max-w-lg px-4 py-12 text-center">
					<Skeleton className="mx-auto h-20 w-20 rounded-full" />
					<Skeleton className="mx-auto mt-6 h-8 w-48" />
					<Skeleton className="mx-auto mt-2 h-4 w-64" />
				</div>
			}>
			<OrderConfirmationContent />
		</Suspense>
	);
}
