"use client";

import { Package, Store, CreditCard, Truck } from "lucide-react";
import { useInView } from "@/lib/hooks";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

interface Step {
	icon: LucideIcon;
	title: string;
	description: string;
	color: string;
}

const steps: Step[] = [
	{
		icon: Package,
		title: "Place Your Order",
		description:
			"Browse local vendors, pick your items, or describe your errand. It only takes a few taps.",
		color: "bg-blue-100 text-blue-600",
	},
	{
		icon: Store,
		title: "Vendor Prepares",
		description:
			"Your chosen vendor gets notified instantly and starts preparing your order.",
		color: "bg-orange-100 text-orange-600",
	},
	{
		icon: Truck,
		title: "Rider Picks Up",
		description:
			"A nearby rider is matched and heads to the vendor. Track them in real-time.",
		color: "bg-purple-100 text-purple-600",
	},
	{
		icon: CreditCard,
		title: "Delivered to You",
		description:
			"Receive your delivery at your doorstep. Pay securely with wallet, card, or cash.",
		color: "bg-green-100 text-green-600",
	},
];

const container = {
	hidden: { opacity: 0 },
	show: {
		opacity: 1,
		transition: { staggerChildren: 0.15 },
	},
};

const item = {
	hidden: { opacity: 0, y: 30 },
	show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export function HowItWorks() {
	const { ref, isInView } = useInView({ threshold: 0.1 });

	return (
		<section id="how-it-works" className="py-20 lg:py-28">
			<div className="container mx-auto px-4">
				{/* Section header */}
				<div className="mx-auto max-w-2xl text-center">
					<span className="text-sm font-semibold uppercase tracking-wider text-primary">
						Simple & Easy
					</span>
					<h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
						How RunAm Works
					</h2>
					<p className="mt-4 text-lg text-muted-foreground">
						From order to delivery in four simple steps. We handle the logistics
						so you can focus on what matters.
					</p>
				</div>

				{/* Steps grid */}
				<motion.div
					ref={ref as React.RefObject<HTMLDivElement>}
					variants={container}
					initial="hidden"
					animate={isInView ? "show" : "hidden"}
					className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
					{steps.map((step, index) => (
						<motion.div
							key={step.title}
							variants={item}
							className="group relative text-center">
							{/* Step number connector */}
							{index < steps.length - 1 && (
								<div className="absolute left-1/2 top-12 hidden h-0.5 w-full bg-gradient-to-r from-border to-transparent lg:block" />
							)}

							{/* Icon */}
							<div className="relative mx-auto mb-6 inline-flex">
								<div
									className={`flex h-16 w-16 items-center justify-center rounded-2xl ${step.color} transition-transform duration-300 group-hover:scale-110`}>
									<step.icon className="h-7 w-7" />
								</div>
								<span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
									{index + 1}
								</span>
							</div>

							<h3 className="text-lg font-semibold">{step.title}</h3>
							<p className="mt-2 text-sm leading-relaxed text-muted-foreground">
								{step.description}
							</p>
						</motion.div>
					))}
				</motion.div>
			</div>
		</section>
	);
}
