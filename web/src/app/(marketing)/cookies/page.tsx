import { Metadata } from "next";

export const metadata: Metadata = { title: "Cookie Policy | RunAm" };

export default function CookiesPage() {
	return (
		<div className="container mx-auto max-w-3xl px-4 py-16">
			<h1 className="text-3xl font-bold tracking-tight">Cookie Policy</h1>
			<p className="mt-4 text-muted-foreground">Last updated: April 2026</p>

			<div className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
				<section>
					<h2 className="mb-2 text-lg font-semibold text-foreground">
						What Are Cookies
					</h2>
					<p>
						Cookies are small text files stored on your device when you visit
						RunAm. They help us provide a better experience by remembering your
						preferences and login sessions.
					</p>
				</section>

				<section>
					<h2 className="mb-2 text-lg font-semibold text-foreground">
						Cookies We Use
					</h2>
					<ul className="mt-2 list-inside list-disc space-y-1">
						<li>
							<strong>Essential cookies</strong> — Required for authentication
							and security.
						</li>
						<li>
							<strong>Preference cookies</strong> — Remember your settings and
							preferences.
						</li>
						<li>
							<strong>Analytics cookies</strong> — Help us understand how you
							use RunAm.
						</li>
					</ul>
				</section>

				<section>
					<h2 className="mb-2 text-lg font-semibold text-foreground">
						Managing Cookies
					</h2>
					<p>
						You can control cookies through your browser settings. Disabling
						essential cookies may affect your ability to use certain features.
					</p>
				</section>
			</div>
		</div>
	);
}
