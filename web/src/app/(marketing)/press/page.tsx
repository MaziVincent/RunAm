import { Metadata } from "next";

export const metadata: Metadata = { title: "Press | RunAm" };

export default function PressPage() {
	return (
		<div className="container mx-auto max-w-3xl px-4 py-16">
			<h1 className="text-3xl font-bold tracking-tight">Press</h1>
			<p className="mt-4 text-lg text-muted-foreground">
				Media resources and press inquiries for RunAm.
			</p>

			<div className="mt-12 rounded-xl border bg-muted/30 p-8 text-center">
				<p className="text-lg font-medium">Press Kit Coming Soon</p>
				<p className="mt-2 text-sm text-muted-foreground">
					For media inquiries, contact{" "}
					<a
						href="mailto:press@wegorunam.com"
						className="text-primary hover:underline">
						press@wegorunam.com
					</a>
					.
				</p>
			</div>
		</div>
	);
}
