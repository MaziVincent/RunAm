"use client";

import Link from "next/link";
import {
	Package,
	UtensilsCrossed,
	ShoppingCart,
	FileText,
	Pill,
	Shirt,
	Sparkles,
	ArrowUpDown,
	Receipt,
} from "lucide-react";
import { useInView } from "@/lib/hooks";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

interface Category {
	icon: LucideIcon;
	name: string;
	description: string;
	color: string;
	bgColor: string;
	href: string;
}

const categories: Category[] = [
	{
		icon: Package,
		name: "Package Delivery",
		description: "Send packages across the city quickly and securely",
		color: "text-blue-600",
		bgColor: "bg-blue-50 group-hover:bg-blue-100",
		href: "/errands/new?category=package",
	},
	{
		icon: UtensilsCrossed,
		name: "Food Delivery",
		description: "Order from your favorite local restaurants",
		color: "text-orange-600",
		bgColor: "bg-orange-50 group-hover:bg-orange-100",
		href: "/shop/categories/food",
	},
	{
		icon: ShoppingCart,
		name: "Grocery Shopping",
		description: "Fresh groceries delivered from nearby markets",
		color: "text-green-600",
		bgColor: "bg-green-50 group-hover:bg-green-100",
		href: "/shop/categories/groceries",
	},
	{
		icon: FileText,
		name: "Document Delivery",
		description: "Important documents handled with care",
		color: "text-indigo-600",
		bgColor: "bg-indigo-50 group-hover:bg-indigo-100",
		href: "/errands/new?category=document",
	},
	{
		icon: Pill,
		name: "Pharmacy Pickup",
		description: "Get medicines and prescriptions picked up",
		color: "text-rose-600",
		bgColor: "bg-rose-50 group-hover:bg-rose-100",
		href: "/shop/categories/pharmacy",
	},
	{
		icon: Shirt,
		name: "Laundry Service",
		description: "Pickup and delivery for your laundry",
		color: "text-cyan-600",
		bgColor: "bg-cyan-50 group-hover:bg-cyan-100",
		href: "/shop/categories/laundry",
	},
	{
		icon: Sparkles,
		name: "Custom Errand",
		description: "Any task you need — we've got you covered",
		color: "text-purple-600",
		bgColor: "bg-purple-50 group-hover:bg-purple-100",
		href: "/errands/new?category=custom",
	},
	{
		icon: ArrowUpDown,
		name: "Multi-Stop Delivery",
		description: "Multiple pickups and drop-offs in one trip",
		color: "text-amber-600",
		bgColor: "bg-amber-50 group-hover:bg-amber-100",
		href: "/errands/new?category=package",
	},
	{
		icon: Receipt,
		name: "Bill Payment",
		description: "Let a runner handle your bill payments",
		color: "text-teal-600",
		bgColor: "bg-teal-50 group-hover:bg-teal-100",
		href: "/errands/new?category=custom",
	},
];

const container = {
	hidden: { opacity: 0 },
	show: {
		opacity: 1,
		transition: { staggerChildren: 0.06 },
	},
};

const item = {
	hidden: { opacity: 0, scale: 0.95, y: 15 },
	show: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.4 } },
};

export function ServiceCategories() {
	const { ref, isInView } = useInView({ threshold: 0.1 });

	return (
		<section id="services" className="bg-slate-50 py-20 lg:py-28">
			<div className="container mx-auto px-4">
				{/* Section header */}
				<div className="mx-auto max-w-2xl text-center">
					<span className="text-sm font-semibold uppercase tracking-wider text-primary">
						Our Services
					</span>
					<h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
						What Can We Deliver?
					</h2>
					<p className="mt-4 text-lg text-muted-foreground">
						From food to packages, pharmacy runs to custom errands — name it,
						we&apos;ll run it.
					</p>
				</div>

				{/* Categories grid */}
				<motion.div
					ref={ref as React.RefObject<HTMLDivElement>}
					variants={container}
					initial="hidden"
					animate={isInView ? "show" : "hidden"}
					className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{categories.map((cat) => (
						<motion.div key={cat.name} variants={item}>
							<Link
								href={cat.href}
								className="group flex items-start gap-4 rounded-xl border bg-white p-5 transition-all hover:shadow-md hover:-translate-y-0.5">
								<div
									className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-colors ${cat.bgColor}`}>
									<cat.icon className={`h-6 w-6 ${cat.color}`} />
								</div>
								<div>
									<h3 className="font-semibold">{cat.name}</h3>
									<p className="mt-1 text-sm text-muted-foreground">
										{cat.description}
									</p>
								</div>
							</Link>
						</motion.div>
					))}
				</motion.div>
			</div>
		</section>
	);
}
