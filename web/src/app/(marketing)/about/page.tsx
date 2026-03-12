import type { Metadata } from "next";
import {
	Shield,
	Heart,
	Users,
	Globe,
	Zap,
	Award,
} from "lucide-react";

export const metadata: Metadata = {
	title: "About RunAm — Errands Done. Deliveries Made. Life Simplified.",
	description:
		"Learn about RunAm — the platform connecting people who need things done with reliable riders and trusted vendors across Nigeria.",
};

const VALUES = [
	{
		icon: Zap,
		title: "Speed & Reliability",
		description:
			"We match you with the nearest available rider in minutes, not hours. Every delivery is tracked in real-time.",
	},
	{
		icon: Shield,
		title: "Trust & Safety",
		description:
			"All riders are verified with background checks. Every transaction is secured and insured.",
	},
	{
		icon: Heart,
		title: "Community First",
		description:
			"We empower local vendors and riders with fair earnings, creating economic opportunities across neighborhoods.",
	},
	{
		icon: Users,
		title: "Inclusivity",
		description:
			"From food delivery to document dispatch, our platform serves everyone — individuals, families, and businesses.",
	},
];

const STATS = [
	{ value: "50K+", label: "Deliveries Completed" },
	{ value: "2K+", label: "Active Riders" },
	{ value: "500+", label: "Vendor Partners" },
	{ value: "4.8★", label: "Average Rating" },
];

const TEAM = [
	{
		name: "Building the Future of Logistics",
		description:
			"RunAm was founded with a simple mission: make everyday errands effortless. Whether you need a package delivered across town, lunch from your favourite restaurant, or groceries brought to your door — we've got you covered.",
	},
];

export default function AboutPage() {
	return (
		<div className="bg-white dark:bg-slate-950">
			{/* Hero */}
			<section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-white to-primary/10 py-24 dark:from-primary/10 dark:via-slate-950 dark:to-primary/5">
				<div className="mx-auto max-w-4xl px-4 text-center">
					<h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
						Making life <span className="text-primary">easier</span>, one errand
						at a time
					</h1>
					<p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600 dark:text-slate-400">
						RunAm is Nigeria&apos;s fastest-growing delivery and errand platform, connecting
						people who need things done with reliable riders and trusted local vendors.
					</p>
				</div>
			</section>

			{/* Our Story */}
			<section className="py-20">
				<div className="mx-auto max-w-4xl px-4">
					<div className="grid gap-12 md:grid-cols-2 md:items-center">
						<div>
							<h2 className="text-3xl font-bold text-slate-900 dark:text-white">
								Our Story
							</h2>
							<p className="mt-4 text-slate-600 dark:text-slate-400">
								RunAm was born from a common frustration — the difficulty of getting
								things delivered quickly and reliably in Nigerian cities. Long waits,
								unreliable couriers, and fragmented marketplaces inspired us to build
								something better.
							</p>
							<p className="mt-4 text-slate-600 dark:text-slate-400">
								Today, we power thousands of deliveries daily, connecting customers with
								verified riders and curated vendors. From sending a package across Lagos
								to ordering lunch from a local restaurant, RunAm makes it seamless.
							</p>
						</div>
						<div className="flex items-center justify-center">
							<div className="grid grid-cols-2 gap-4">
								{STATS.map((stat) => (
									<div
										key={stat.label}
										className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center dark:border-slate-800 dark:bg-slate-900"
									>
										<p className="text-2xl font-bold text-primary">{stat.value}</p>
										<p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
											{stat.label}
										</p>
									</div>
								))}
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Values */}
			<section className="bg-slate-50 py-20 dark:bg-slate-900/50">
				<div className="mx-auto max-w-5xl px-4">
					<h2 className="text-center text-3xl font-bold text-slate-900 dark:text-white">
						Our Values
					</h2>
					<p className="mx-auto mt-3 max-w-lg text-center text-slate-600 dark:text-slate-400">
						Everything we build is guided by these core principles
					</p>
					<div className="mt-12 grid gap-8 sm:grid-cols-2">
						{VALUES.map((value) => (
							<div
								key={value.title}
								className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
							>
								<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
									<value.icon className="h-5 w-5" />
								</div>
								<h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">
									{value.title}
								</h3>
								<p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
									{value.description}
								</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Mission */}
			<section className="py-20">
				<div className="mx-auto max-w-3xl px-4 text-center">
					<Globe className="mx-auto h-10 w-10 text-primary" />
					<h2 className="mt-4 text-3xl font-bold text-slate-900 dark:text-white">
						Our Mission
					</h2>
					<p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
						To become Africa&apos;s most trusted delivery and errand platform — empowering
						local businesses, providing fair income for riders, and making everyday
						logistics effortless for everyone.
					</p>
				</div>
			</section>

			{/* Join Us CTA */}
			<section className="bg-primary/5 py-20 dark:bg-primary/10">
				<div className="mx-auto max-w-3xl px-4 text-center">
					<Award className="mx-auto h-10 w-10 text-primary" />
					<h2 className="mt-4 text-3xl font-bold text-slate-900 dark:text-white">
						Join the RunAm Community
					</h2>
					<p className="mt-3 text-slate-600 dark:text-slate-400">
						Whether you&apos;re a customer, vendor, or rider — there&apos;s a place for
						you on RunAm.
					</p>
					<div className="mt-8 flex flex-wrap justify-center gap-4">
						<a
							href="/register"
							className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
						>
							Get Started
						</a>
						<a
							href="/contact"
							className="rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
						>
							Contact Us
						</a>
					</div>
				</div>
			</section>
		</div>
	);
}
