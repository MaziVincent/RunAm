import { Metadata } from "next";

export const metadata: Metadata = { title: "Terms of Service | RunAm" };

export default function TermsPage() {
	return (
		<div className="container mx-auto max-w-3xl px-4 py-16">
			<h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
			<p className="mt-4 text-muted-foreground">Last updated: April 2026</p>

			<div className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
				<section>
					<h2 className="mb-2 text-lg font-semibold text-foreground">
						1. Acceptance of Terms
					</h2>
					<p>
						By accessing and using RunAm&apos;s services, you agree to be bound
						by these Terms of Service. If you do not agree, please do not use
						the platform.
					</p>
				</section>

				<section>
					<h2 className="mb-2 text-lg font-semibold text-foreground">
						2. Services
					</h2>
					<p>
						RunAm provides an on-demand logistics and marketplace platform
						connecting customers with riders and vendors for delivery and errand
						services.
					</p>
				</section>

				<section>
					<h2 className="mb-2 text-lg font-semibold text-foreground">
						3. User Accounts
					</h2>
					<p>
						You are responsible for maintaining the confidentiality of your
						account credentials and for all activities under your account.
					</p>
				</section>

				<section>
					<h2 className="mb-2 text-lg font-semibold text-foreground">
						4. Payments
					</h2>
					<p>
						All payments processed through RunAm are subject to our payment
						terms. Pricing is displayed at the time of order and may include
						delivery fees and service charges.
					</p>
				</section>

				<section>
					<h2 className="mb-2 text-lg font-semibold text-foreground">
						5. Limitation of Liability
					</h2>
					<p>
						RunAm shall not be liable for any indirect, incidental, or
						consequential damages arising from the use of our services.
					</p>
				</section>

				<section>
					<h2 className="mb-2 text-lg font-semibold text-foreground">
						6. Contact
					</h2>
					<p>
						For questions about these terms, contact us at{" "}
						<a
							href="mailto:support@wegorunam.com"
							className="text-primary hover:underline">
							support@wegorunam.com
						</a>
						.
					</p>
				</section>
			</div>
		</div>
	);
}
