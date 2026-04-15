"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api/client";
import { PaymentStatus, type PaymentDto } from "@/types";

const POLL_INTERVAL_MS = 3000;
const MAX_POLLS = 20;

type VerificationState = "loading" | "success" | "failed" | "timeout";

function LogisticsPaymentCallbackContent() {
	const params = useParams<{ errandId: string }>();
	const router = useRouter();
	const errandId = params?.errandId;
	const [state, setState] = useState<VerificationState>("loading");

	useEffect(() => {
		if (!errandId) {
			setState("failed");
			return;
		}

		let cancelled = false;
		let pollCount = 0;
		let timer: ReturnType<typeof setTimeout> | null = null;

		const pollStatus = async () => {
			try {
				const response = await api.get<PaymentDto | null>(
					`/payments/errand/${errandId}/status`,
				);
				const payment = response.data;

				if (cancelled) {
					return;
				}

				if (payment?.status === PaymentStatus.Completed) {
					setState("success");
					return;
				}

				if (payment?.status === PaymentStatus.Failed) {
					setState("failed");
					return;
				}

				pollCount += 1;
				if (pollCount >= MAX_POLLS) {
					setState("timeout");
					return;
				}

				timer = setTimeout(pollStatus, POLL_INTERVAL_MS);
			} catch {
				if (!cancelled) {
					setState("failed");
				}
			}
		};

		void pollStatus();

		return () => {
			cancelled = true;
			if (timer) {
				clearTimeout(timer);
			}
		};
	}, [errandId]);

	return (
		<div className="container mx-auto max-w-lg px-4 py-12 text-center">
			{state === "loading" && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					className="flex flex-col items-center gap-4">
					<Loader2 className="h-16 w-16 animate-spin text-primary" />
					<h1 className="text-2xl font-bold">Confirming Payment...</h1>
					<p className="text-muted-foreground">
						Please wait while we verify your errand payment.
					</p>
				</motion.div>
			)}

			{state === "success" && (
				<motion.div
					initial={{ scale: 0.8, opacity: 0 }}
					animate={{ scale: 1, opacity: 1 }}
					className="flex flex-col items-center gap-4">
					<div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
						<CheckCircle2 className="h-12 w-12 text-primary" />
					</div>
					<h1 className="text-2xl font-bold">Payment Successful</h1>
					<p className="text-muted-foreground">
						Your errand payment has been confirmed and the request is active.
					</p>
					<Button
						className="mt-4"
						onClick={() => router.push(`/dashboard/errands/${errandId}`)}>
						View Errand
					</Button>
				</motion.div>
			)}

			{(state === "failed" || state === "timeout") && (
				<motion.div
					initial={{ scale: 0.8, opacity: 0 }}
					animate={{ scale: 1, opacity: 1 }}
					className="flex flex-col items-center gap-4">
					<div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
						<XCircle className="h-12 w-12 text-destructive" />
					</div>
					<h1 className="text-2xl font-bold">
						{state === "timeout"
							? "Verification Timed Out"
							: "Payment Not Confirmed"}
					</h1>
					<p className="text-muted-foreground">
						{state === "timeout"
							? "We could not confirm the payment yet. Check the errand status and retry payment if needed."
							: "We could not confirm the payment. You can reopen the errand and retry payment."}
					</p>
					<div className="mt-4 flex gap-3">
						<Button
							variant="outline"
							onClick={() => router.push("/errands/new")}>
							Back to Errands
						</Button>
						<Button
							onClick={() => router.push(`/dashboard/errands/${errandId}`)}>
							Check Errand
						</Button>
					</div>
				</motion.div>
			)}
		</div>
	);
}

export default function LogisticsPaymentCallbackPage() {
	return (
		<Suspense
			fallback={
				<div className="container mx-auto max-w-lg px-4 py-12 text-center">
					<Loader2 className="mx-auto h-16 w-16 animate-spin text-primary" />
				</div>
			}>
			<LogisticsPaymentCallbackContent />
		</Suspense>
	);
}
