"use client";

import Link from "next/link";
import { ArrowRight, Package, ShoppingBag, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const container = {
	hidden: { opacity: 0 },
	show: {
		opacity: 1,
		transition: { staggerChildren: 0.15, delayChildren: 0.1 },
	},
};

const item = {
	hidden: { opacity: 0, y: 20 },
	show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const floatingBadges = [
	{
		icon: Package,
		label: "Errands",
		delay: 0.6,
		position: "top-32 right-12 lg:right-24",
	},
	{
		icon: ShoppingBag,
		label: "Shop",
		delay: 0.8,
		position: "bottom-40 right-16 lg:right-32",
	},
	{
		icon: Truck,
		label: "Delivery",
		delay: 1.0,
		position: "bottom-24 left-8 lg:left-16",
	},
];

export function Hero() {
	return (
		<section className="relative min-h-[100dvh] overflow-hidden bg-gradient-to-br from-primary via-green-600 to-emerald-700">
			{/* Background pattern */}
			<div className="absolute inset-0 opacity-10">
				<div
					className="absolute inset-0"
					style={{
						backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
						backgroundSize: "40px 40px",
					}}
				/>
			</div>

			{/* Gradient overlays */}
			<div className="absolute bottom-0 left-0 h-1/2 w-full bg-gradient-to-t from-black/20 to-transparent" />
			<div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
			<div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-white/5 blur-3xl" />

			<div className="container relative mx-auto flex min-h-[100dvh] items-center px-4">
				<motion.div
					variants={container}
					initial="hidden"
					animate="show"
					className="mx-auto max-w-3xl text-center">
					{/* Trust badge */}
					<motion.div variants={item}>
						<span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm">
							<span className="relative flex h-2 w-2">
								<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-300 opacity-75" />
								<span className="relative inline-flex h-2 w-2 rounded-full bg-green-300" />
							</span>
							Trusted by 10,000+ users across Nigeria
						</span>
					</motion.div>

					{/* Headline */}
					<motion.h1
						variants={item}
						className="mt-8 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl xl:text-7xl">
						Your Errands,{" "}
						<span className="relative">
							<span className="relative z-10">Delivered</span>
							<span className="absolute -bottom-2 left-0 z-0 h-3 w-full bg-white/20 rounded" />
						</span>
						.<br />
						Your City, <span className="text-green-200">Connected</span>.
					</motion.h1>

					{/* Subtitle */}
					<motion.p
						variants={item}
						className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-white/80 sm:text-xl">
						Send packages, order from local shops, or get anything in your city
						delivered to your doorstep. Fast, reliable, and affordable.
					</motion.p>

					{/* CTA buttons */}
					<motion.div
						variants={item}
						className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
						<Button
							size="xl"
							asChild
							className="bg-white text-primary hover:bg-white/90 shadow-xl shadow-black/10">
							<Link href="/register">
								Get Started Free
								<ArrowRight className="ml-2 h-5 w-5" />
							</Link>
						</Button>
						<Button
							size="xl"
							variant="outline"
							asChild
							className="border-white/30 bg-transparent text-white hover:bg-white/10">
							<Link href="/shop">
								<ShoppingBag className="mr-2 h-5 w-5" />
								Browse Shops
							</Link>
						</Button>
					</motion.div>

					{/* Quick stats */}
					<motion.div
						variants={item}
						className="mt-14 grid grid-cols-3 gap-6 border-t border-white/10 pt-8">
						{[
							{ value: "10K+", label: "Active Users" },
							{ value: "500+", label: "Vendors" },
							{ value: "50K+", label: "Deliveries" },
						].map((stat) => (
							<div key={stat.label} className="text-center">
								<p className="text-2xl font-bold text-white sm:text-3xl">
									{stat.value}
								</p>
								<p className="mt-1 text-sm text-white/60">{stat.label}</p>
							</div>
						))}
					</motion.div>
				</motion.div>

				{/* Floating badges (desktop only) */}
				{floatingBadges.map((badge) => (
					<motion.div
						key={badge.label}
						initial={{ opacity: 0, scale: 0.8 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ delay: badge.delay, duration: 0.5 }}
						className={`absolute hidden lg:flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-4 py-2.5 backdrop-blur-md ${badge.position}`}>
						<badge.icon className="h-5 w-5 text-white" />
						<span className="text-sm font-medium text-white">
							{badge.label}
						</span>
					</motion.div>
				))}
			</div>

			{/* Bottom wave transition */}
			<div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0]">
				<svg
					viewBox="0 0 1200 120"
					preserveAspectRatio="none"
					className="relative block h-12 w-full sm:h-16 lg:h-20"
					fill="white">
					<path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C59.71,118.11,130.83,141.14,321.39,56.44Z" />
				</svg>
			</div>
		</section>
	);
}
