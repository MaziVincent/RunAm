"use client";

import {
	Shield,
	Zap,
	MapPin,
	Wallet,
	HeadphonesIcon,
	Clock,
} from "lucide-react";
import { useInView } from "@/lib/hooks";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

interface ValueProp {
	icon: LucideIcon;
	title: string;
	description: string;
}

const valueProps: ValueProp[] = [
	{
		icon: Zap,
		title: "Lightning Fast",
		description:
			"Average delivery time under 30 minutes. We optimize routes in real-time to get your items faster.",
	},
	{
		icon: MapPin,
		title: "Real-Time Tracking",
		description:
			"Track your rider live on the map from pickup to drop-off. Know exactly when your delivery arrives.",
	},
	{
		icon: Shield,
		title: "Safe & Secure",
		description:
			"All riders are verified and trained. Your packages are insured for peace of mind.",
	},
	{
		icon: Wallet,
		title: "Flexible Payments",
		description:
			"Pay with wallet, card, mobile money, or cash. Top up your wallet for faster checkouts.",
	},
	{
		icon: HeadphonesIcon,
		title: "24/7 Support",
		description:
			"Our support team is always available via in-app chat, phone, or email.",
	},
	{
		icon: Clock,
		title: "Schedule Deliveries",
		description:
			"Plan ahead by scheduling deliveries up to 7 days in advance at your preferred time.",
	},
];

const container = {
	hidden: { opacity: 0 },
	show: {
		opacity: 1,
		transition: { staggerChildren: 0.1 },
	},
};

const item = {
	hidden: { opacity: 0, y: 20 },
	show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export function ValueProps() {
	const { ref, isInView } = useInView({ threshold: 0.1 });

	return (
		<section className="py-20 lg:py-28">
			<div className="container mx-auto px-4">
				{/* Section header */}
				<div className="mx-auto max-w-2xl text-center">
					<span className="text-sm font-semibold uppercase tracking-wider text-primary">
						Why Choose Us
					</span>
					<h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
						Built for Speed, Safety & Convenience
					</h2>
					<p className="mt-4 text-lg text-muted-foreground">
						Everything you need in a delivery platform, and more.
					</p>
				</div>

				{/* Grid */}
				<motion.div
					ref={ref as React.RefObject<HTMLDivElement>}
					variants={container}
					initial="hidden"
					animate={isInView ? "show" : "hidden"}
					className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
					{valueProps.map((prop) => (
						<motion.div
							key={prop.title}
							variants={item}
							className="group rounded-xl border bg-card p-6 transition-all hover:shadow-md hover:border-primary/20">
							<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
								<prop.icon className="h-6 w-6 text-primary" />
							</div>
							<h3 className="mt-4 text-lg font-semibold">{prop.title}</h3>
							<p className="mt-2 text-sm leading-relaxed text-muted-foreground">
								{prop.description}
							</p>
						</motion.div>
					))}
				</motion.div>
			</div>
		</section>
	);
}
