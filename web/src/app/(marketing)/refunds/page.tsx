import { Metadata } from "next";

export const metadata: Metadata = { title: "Refund Policy | RunAm" };

export default function RefundsPage() {
	return (
		<div className="container mx-auto max-w-3xl px-4 py-16">
			<h1 className="text-3xl font-bold tracking-tight">Refund Policy</h1>
			<p className="mt-4 text-muted-foreground">Last updated: April 2026</p>

			<div className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
				<section>
					<h2 className="mb-2 text-lg font-semibold text-foreground">
						Eligibility
					</h2>
					<p>
						Refunds may be issued for orders that are not delivered,
						significantly delayed, or if the items received are incorrect or
						damaged.
					</p>
				</section>

				<section>
					<h2 className="mb-2 text-lg font-semibold text-foreground">
						How to Request a Refund
					</h2>
					<p>
						To request a refund, go to your order history and select
						&quot;Report an Issue&quot; on the relevant order, or contact our
						support team within 24 hours of delivery.
					</p>
				</section>

				<section>
					<h2 className="mb-2 text-lg font-semibold text-foreground">
						Processing Time
					</h2>
					<p>
						Approved refunds are processed within 3-5 business days. The refund
						will be credited to your RunAm wallet or original payment method.
					</p>
				</section>

				<section>
					<h2 className="mb-2 text-lg font-semibold text-foreground">
						Non-Refundable Items
					</h2>
					<p>
						Completed custom errands, successfully delivered packages, and
						service fees are generally non-refundable unless there was a service
						failure on RunAm&apos;s part.
					</p>
				</section>
			</div>
		</div>
	);
}
