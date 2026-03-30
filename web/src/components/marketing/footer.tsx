import Link from "next/link";
import Image from "next/image";
import {
	Facebook,
	Twitter,
	Instagram,
	Linkedin,
	Mail,
	Phone,
	MapPin,
} from "lucide-react";

const footerLinks = {
	product: [
		{ label: "How It Works", href: "/#how-it-works" },
		{ label: "Services", href: "/#services" },
		{ label: "Shop", href: "/shop" },
		{ label: "Pricing", href: "/#pricing" },
	],
	company: [
		{ label: "About Us", href: "/about" },
		{ label: "Careers", href: "/careers" },
		{ label: "Blog", href: "/blog" },
		{ label: "Press", href: "/press" },
	],
	partners: [
		{ label: "Become a Vendor", href: "/register?role=vendor" },
		{ label: "Become a Rider", href: "/register?role=rider" },
		{ label: "Vendor Portal", href: "/vendor" },
		{ label: "Rider Portal", href: "/rider" },
	],
	legal: [
		{ label: "Privacy Policy", href: "/privacy" },
		{ label: "Terms of Service", href: "/terms" },
		{ label: "Cookie Policy", href: "/cookies" },
		{ label: "Refund Policy", href: "/refunds" },
	],
};

const socialLinks = [
	{ label: "Facebook", href: "#", icon: Facebook },
	{ label: "Twitter", href: "#", icon: Twitter },
	{ label: "Instagram", href: "#", icon: Instagram },
	{ label: "LinkedIn", href: "#", icon: Linkedin },
];

export function Footer() {
	return (
		<footer className="border-t bg-slate-950 text-slate-300">
			{/* Main footer */}
			<div className="container mx-auto px-4 py-12 lg:py-16">
				<div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-6">
					{/* Brand column */}
					<div className="lg:col-span-2">
						<Link href="/" className="flex items-center gap-2">
							<Image
								src="/logo.svg"
								alt="RunAm"
								width={120}
								height={36}
								className="h-9 w-auto brightness-0 invert"
							/>
						</Link>
						<p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-400">
							Nigeria&apos;s on-demand delivery and marketplace platform. Get
							anything delivered or shop from local vendors, all in one app.
						</p>

						{/* Contact info */}
						<div className="mt-6 space-y-2 text-sm text-slate-400">
							<a
								href="mailto:hello@runam.ng"
								className="flex items-center gap-2 transition-colors hover:text-white">
								<Mail className="h-4 w-4" />
								hello@runam.ng
							</a>
							<a
								href="tel:+2348001234567"
								className="flex items-center gap-2 transition-colors hover:text-white">
								<Phone className="h-4 w-4" />
								+234 800 123 4567
							</a>
							<p className="flex items-center gap-2">
								<MapPin className="h-4 w-4" />
								Lagos, Nigeria
							</p>
						</div>
					</div>

					{/* Link columns */}
					<div>
						<h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
							Product
						</h4>
						<ul className="space-y-2.5">
							{footerLinks.product.map((link) => (
								<li key={link.href}>
									<Link
										href={link.href}
										className="text-sm transition-colors hover:text-white">
										{link.label}
									</Link>
								</li>
							))}
						</ul>
					</div>

					<div>
						<h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
							Company
						</h4>
						<ul className="space-y-2.5">
							{footerLinks.company.map((link) => (
								<li key={link.href}>
									<Link
										href={link.href}
										className="text-sm transition-colors hover:text-white">
										{link.label}
									</Link>
								</li>
							))}
						</ul>
					</div>

					<div>
						<h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
							Partners
						</h4>
						<ul className="space-y-2.5">
							{footerLinks.partners.map((link) => (
								<li key={link.href}>
									<Link
										href={link.href}
										className="text-sm transition-colors hover:text-white">
										{link.label}
									</Link>
								</li>
							))}
						</ul>
					</div>

					<div className="sm:col-span-2 lg:col-span-1">
						<h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
							Legal
						</h4>
						<ul className="space-y-2.5">
							{footerLinks.legal.map((link) => (
								<li key={link.href}>
									<Link
										href={link.href}
										className="text-sm transition-colors hover:text-white">
										{link.label}
									</Link>
								</li>
							))}
						</ul>
					</div>
				</div>
			</div>

			{/* Bottom bar */}
			<div className="border-t border-slate-800">
				<div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 py-6 sm:flex-row">
					<p className="text-sm text-slate-500">
						&copy; {new Date().getFullYear()} RunAm. All rights reserved.
					</p>
					<div className="flex items-center gap-3">
						{socialLinks.map((social) => (
							<a
								key={social.label}
								href={social.href}
								aria-label={social.label}
								className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-slate-400 transition-colors hover:bg-primary hover:text-white">
								<social.icon className="h-4 w-4" />
							</a>
						))}
					</div>
				</div>
			</div>
		</footer>
	);
}
