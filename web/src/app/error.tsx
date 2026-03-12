"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		console.error("Application error:", error);
	}, [error]);

	return (
		<div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
			<div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/30">
				<AlertTriangle className="h-10 w-10 text-red-600" />
			</div>
			<h1 className="mt-6 text-3xl font-bold">Something went wrong</h1>
			<p className="mt-2 max-w-md text-muted-foreground">
				An unexpected error occurred. Please try again or contact support if the
				problem persists.
			</p>
			{error.digest && (
				<p className="mt-2 text-xs text-muted-foreground">
					Error ID: {error.digest}
				</p>
			)}
			<button
				onClick={reset}
				className="mt-6 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
				<RefreshCw className="h-4 w-4" />
				Try Again
			</button>
		</div>
	);
}
