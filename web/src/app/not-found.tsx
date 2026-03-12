import Link from "next/link";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
	return (
		<div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
			<div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
				<FileQuestion className="h-10 w-10 text-muted-foreground" />
			</div>
			<h1 className="mt-6 text-3xl font-bold">Page Not Found</h1>
			<p className="mt-2 max-w-md text-muted-foreground">
				The page you&apos;re looking for doesn&apos;t exist or has been moved.
			</p>
			<div className="mt-6 flex gap-3">
				<Link
					href="/"
					className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
					Go Home
				</Link>
				<Link
					href="/shop"
					className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-6 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground">
					Browse Shop
				</Link>
			</div>
		</div>
	);
}
