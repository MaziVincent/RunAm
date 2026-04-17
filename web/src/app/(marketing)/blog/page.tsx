import { Metadata } from "next";

export const metadata: Metadata = { title: "Blog | RunAm" };

export default function BlogPage() {
	return (
		<div className="container mx-auto max-w-3xl px-4 py-16">
			<h1 className="text-3xl font-bold tracking-tight">Blog</h1>
			<p className="mt-4 text-lg text-muted-foreground">
				Stories, updates, and insights from the RunAm team.
			</p>

			<div className="mt-12 rounded-xl border bg-muted/30 p-8 text-center">
				<p className="text-lg font-medium">Coming Soon</p>
				<p className="mt-2 text-sm text-muted-foreground">
					We&apos;re working on our first posts. Stay tuned!
				</p>
			</div>
		</div>
	);
}
