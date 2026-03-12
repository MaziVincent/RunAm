"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function RiderError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		console.error("Rider dashboard error:", error);
	}, [error]);

	return (
		<div className="flex flex-col items-center justify-center py-16 text-center">
			<div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/30">
				<AlertTriangle className="h-8 w-8 text-red-600" />
			</div>
			<h2 className="mt-4 text-xl font-semibold">Something went wrong</h2>
			<p className="mt-2 max-w-sm text-sm text-muted-foreground">
				An error occurred in your rider dashboard. Please try again.
			</p>
			<div className="mt-6 flex gap-3">
				<button
					onClick={reset}
					className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">
					<RefreshCw className="h-3.5 w-3.5" />
					Try Again
				</button>
				<Link
					href="/rider"
					className="inline-flex h-9 items-center gap-2 rounded-md border px-4 text-sm font-medium hover:bg-accent">
					<ArrowLeft className="h-3.5 w-3.5" />
					Back to Dashboard
				</Link>
			</div>
		</div>
	);
}
