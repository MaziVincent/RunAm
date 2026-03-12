import type { Metadata } from "next";
import { Package, Users, MapPin, CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
	title: "How RunAm Works — Simple Steps to Get Things Done",
	description:
		"Learn how RunAm works in 3 simple steps: choose a service, get matched with a rider, and track your delivery in real-time.",
};

const STEPS = [
	{
		number: "01",
		icon: Package,
		title: "Choose Your Service",
		description:
			"Need a package delivered? Craving food from your favourite restaurant? Browse our marketplace of trusted vendors or request a custom errand — logistics, groceries, pharmacy, and more.",
		details: [
			"Browse categories: Food, Grocery, Pharmacy, Package, Documents",
			"Shop from 500+ verified vendors",
			"Or request a custom pickup & delivery",
		],
	},
	{
		number: "02",
		icon: Users,
		title: "We Match You a Runner",
		description:
			"Our smart matching system finds the nearest verified rider based on your location, package type, and urgency. Accept the match and watch your runner spring into action.",
		details: [
			"Instant matching with nearby riders",
			"All riders are background-checked & verified",
			"Choose Standard, Express, or Scheduled delivery",
		],
	},
	{
		number: "03",
		icon: MapPin,
		title: "Track & Receive",
		description:
			"Follow your delivery every step of the way on a live map. Get real-time status updates, chat with your rider, and receive a notification the moment your errand is complete.",
		details: [
			"Real-time GPS tracking on a live map",
			"Chat directly with your rider",
			"Photo proof of delivery",
		],
	},
];

const USE_CASES = [
	{
		emoji: "🍔",
		title: "Order Food",
		description: "From local favourites to popular restaurants — delivered hot.",
	},
	{
		emoji: "📦",
		title: "Send a Package",
		description: "Deliver documents, parcels, and items across the city.",
	},
	{
		emoji: "🛒",
		title: "Shop Groceries",
		description: "Get fresh produce and pantry essentials brought to your door.",
	},
	{
		emoji: "💊",
		title: "Pharmacy Pickup",
		description: "Have prescriptions and health items delivered safely.",
	},
	{
		emoji: "👕",
		title: "Laundry Service",
		description: "Pick up and delivery for your dry cleaning and laundry.",
	},
	{
		emoji: "📄",
		title: "Document Dispatch",
		description: "Urgent documents delivered securely and on time.",
	},
];

export default function HowItWorksPage() {
	return (
		<div className="bg-white dark:bg-slate-950">
			{/* Hero */}
			<section className="bg-gradient-to-br from-primary/5 via-white to-primary/10 py-24 dark:from-primary/10 dark:via-slate-950 dark:to-primary/5">
				<div className="mx-auto max-w-4xl px-4 text-center">
					<h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
						How <span className="text-primary">RunAm</span> Works
					</h1>
					<p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600 dark:text-slate-400">
						Getting things done has never been easier. Three simple steps from request to delivery.
					</p>
				</div>
			</section>

			{/* Steps */}
			<section className="py-20">
				<div className="mx-auto max-w-5xl px-4">
					<div className="space-y-20">
						{STEPS.map((step, idx) => (
							<div
								key={step.number}
								className={`flex flex-col gap-10 md:flex-row md:items-center ${idx % 2 === 1 ? "md:flex-row-reverse" : ""}`}
							>
								{/* Visual */}
								<div className="flex flex-1 items-center justify-center">
									<div className="relative flex h-48 w-48 items-center justify-center rounded-3xl bg-primary/10 dark:bg-primary/20">
										<step.icon className="h-20 w-20 text-primary" />
										<span className="absolute -right-3 -top-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-white shadow-lg">
											{step.number}
										</span>
									</div>
								</div>

								{/* Content */}
								<div className="flex-1">
									<h2 className="text-2xl font-bold text-slate-900 dark:text-white">
										{step.title}
									</h2>
									<p className="mt-3 text-slate-600 dark:text-slate-400">
										{step.description}
									</p>
									<ul className="mt-4 space-y-2">
										{step.details.map((detail) => (
											<li key={detail} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
												<CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
												{detail}
											</li>
										))}
									</ul>
								</div>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Use Cases */}
			<section className="bg-slate-50 py-20 dark:bg-slate-900/50">
				<div className="mx-auto max-w-5xl px-4">
					<h2 className="text-center text-3xl font-bold text-slate-900 dark:text-white">
						What Can You Run?
					</h2>
					<p className="mx-auto mt-3 max-w-lg text-center text-slate-600 dark:text-slate-400">
						RunAm handles all kinds of errands and deliveries
					</p>
					<div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
						{USE_CASES.map((uc) => (
							<div
								key={uc.title}
								className="rounded-2xl border border-slate-200 bg-white p-6 transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
							>
								<span className="text-3xl">{uc.emoji}</span>
								<h3 className="mt-3 text-lg font-semibold text-slate-900 dark:text-white">
									{uc.title}
								</h3>
								<p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
									{uc.description}
								</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* CTA */}
			<section className="py-20">
				<div className="mx-auto max-w-3xl px-4 text-center">
					<h2 className="text-3xl font-bold text-slate-900 dark:text-white">
						Ready to Get Started?
					</h2>
					<p className="mt-3 text-slate-600 dark:text-slate-400">
						Join thousands of Nigerians who trust RunAm for their everyday deliveries.
					</p>
					<div className="mt-8 flex flex-wrap justify-center gap-4">
						<a
							href="/shop"
							className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
						>
							Start Shopping
						</a>
						<a
							href="/register"
							className="rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
						>
							Create Account
						</a>
					</div>
				</div>
			</section>
		</div>
	);
}
