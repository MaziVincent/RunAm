import { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy | RunAm" };

export default function PrivacyPage() {
	return (
		<div className="container mx-auto max-w-3xl px-4 py-16">
			<h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
			<p className="mt-4 text-muted-foreground">Last updated: April 2026</p>

			<div className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
				<section>
					<h2 className="mb-2 text-lg font-semibold text-foreground">
						1. Information We Collect
					</h2>
					<p>
						We collect information you provide directly (name, email, phone
						number, address) and data generated through your use of RunAm (order
						history, location data, device information).
					</p>
				</section>

				<section>
					<h2 className="mb-2 text-lg font-semibold text-foreground">
						2. How We Use Your Information
					</h2>
					<p>
						Your information is used to provide and improve our services,
						process transactions, communicate with you, and ensure platform
						safety.
					</p>
				</section>

				<section>
					<h2 className="mb-2 text-lg font-semibold text-foreground">
						3. Data Sharing
					</h2>
					<p>
						We share relevant information with riders and vendors to fulfill
						your orders. We do not sell your personal data to third parties.
					</p>
				</section>

				<section>
					<h2 className="mb-2 text-lg font-semibold text-foreground">
						4. Data Security
					</h2>
					<p>
						We implement industry-standard security measures to protect your
						personal information from unauthorized access and disclosure.
					</p>
				</section>

				<section>
					<h2 className="mb-2 text-lg font-semibold text-foreground">
						5. Your Rights
					</h2>
					<p>
						You may request access to, correction, or deletion of your personal
						data by contacting our support team.
					</p>
				</section>

				<section>
					<h2 className="mb-2 text-lg font-semibold text-foreground">
						6. Contact
					</h2>
					<p>
						For privacy concerns, contact us at{" "}
						<a
							href="mailto:privacy@wegorunam.com"
							className="text-primary hover:underline">
							privacy@wegorunam.com
						</a>
						.
					</p>
				</section>
			</div>
		</div>
	);
}
