"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api/client";
import type { ApiResponse, PaymentDto, PaymentStatus } from "@/types";
import { motion } from "framer-motion";

const POLL_INTERVAL = 3000;
const MAX_POLLS = 20; // 60 seconds total

type Status = "loading" | "success" | "failed" | "timeout";

function PaymentCallbackContent() {
	const { errandId } = useParams<{ errandId: string }>();
	const router = useRouter();
	const [status, setStatus] = useState<Status>("loading");

	useEffect(() => {
		if (!errandId) {
			setStatus("failed");
			return;
		}

		let pollCount = 0;
		let cancelled = false;

		async function checkPayment() {
			try {
				const res = await api.get<PaymentDto | null>(
					`/payments/errand/${errandId}/status`,
				);
				const payment = res?.data;

				if (cancelled) return;

				if (payment && payment.status === (1 as PaymentStatus)) {
					// PaymentStatus.Completed = 1
					setStatus("success");
					return;
				}

				if (payment && payment.status === (2 as PaymentStatus)) {
					// PaymentStatus.Failed = 2
					setStatus("failed");
					return;
				}

				// Still pending — poll again
				pollCount++;
				if (pollCount >= MAX_POLLS) {
					setStatus("timeout");
					return;
				}
				setTimeout(checkPayment, POLL_INTERVAL);
			} catch {
				if (!cancelled) setStatus("failed");
			}
		}

		checkPayment();
		return () => {
			cancelled = true;
		};
	}, [errandId]);

	return (
		<div className="container mx-auto max-w-lg px-4 py-12 text-center">
			{status === "loading" && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					className="flex flex-col items-center gap-4">
					<Loader2 className="h-16 w-16 animate-spin text-primary" />
					<h1 className="text-2xl font-bold">Confirming Payment...</h1>
					<p className="text-muted-foreground">
						Please wait while we verify your payment. This may take a few
						seconds.
					</p>
				</motion.div>
			)}

			{status === "success" && (
				<motion.div
					initial={{ scale: 0.8, opacity: 0 }}
					animate={{ scale: 1, opacity: 1 }}
					className="flex flex-col items-center gap-4">
					<div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
						<CheckCircle2 className="h-12 w-12 text-primary" />
					</div>
					<h1 className="text-2xl font-bold">Payment Successful!</h1>
					<p className="text-muted-foreground">
						Your payment has been confirmed. Your order is being processed.
					</p>
					<Button
						className="mt-4"
						onClick={() =>
							router.push(
								`/shop/order-confirmation${errandId ? `?id=${errandId}` : ""}`,
							)
						}>
						View Order
					</Button>
				</motion.div>
			)}

			{(status === "failed" || status === "timeout") && (
				<motion.div
					initial={{ scale: 0.8, opacity: 0 }}
					animate={{ scale: 1, opacity: 1 }}
					className="flex flex-col items-center gap-4">
					<div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
						<XCircle className="h-12 w-12 text-destructive" />
					</div>
					<h1 className="text-2xl font-bold">
						{status === "timeout"
							? "Payment Verification Timed Out"
							: "Payment Failed"}
					</h1>
					<p className="text-muted-foreground">
						{status === "timeout"
							? "We couldn't confirm your payment in time. If money was deducted, it will be refunded automatically."
							: "Something went wrong with your payment. Please try again."}
					</p>
					<div className="mt-4 flex gap-3">
						<Button variant="outline" onClick={() => router.push("/shop")}>
							Back to Shop
						</Button>
						{errandId && (
							<Button
								onClick={() =>
									router.push(`/shop/order-confirmation?id=${errandId}`)
								}>
								Check Order Status
							</Button>
						)}
					</div>
				</motion.div>
			)}
		</div>
	);
}

export default function PaymentCallbackPage() {
	return (
		<Suspense
			fallback={
				<div className="container mx-auto max-w-lg px-4 py-12 text-center">
					<Loader2 className="mx-auto h-16 w-16 animate-spin text-primary" />
				</div>
			}>
			<PaymentCallbackContent />
		</Suspense>
	);
}
