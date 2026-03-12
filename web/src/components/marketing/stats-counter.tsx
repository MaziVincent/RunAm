"use client";

import { useInView, useCountUp } from "@/lib/hooks";
import { motion } from "framer-motion";

interface Stat {
	value: number;
	suffix: string;
	label: string;
}

const stats: Stat[] = [
	{ value: 10000, suffix: "+", label: "Active Users" },
	{ value: 500, suffix: "+", label: "Verified Vendors" },
	{ value: 50000, suffix: "+", label: "Deliveries Completed" },
	{ value: 15, suffix: "min", label: "Avg. Delivery Time" },
];

function StatItem({ stat, animate }: { stat: Stat; animate: boolean }) {
	const count = useCountUp(animate ? stat.value : 0, 2000);

	const displayValue =
		stat.value >= 1000
			? `${Math.floor(count / 1000)}${count % 1000 > 0 ? "," + String(count % 1000).padStart(3, "0") : ",000"}`
			: String(count);

	return (
		<div className="text-center">
			<p className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
				{displayValue}
				<span className="text-primary">{stat.suffix}</span>
			</p>
			<p className="mt-2 text-sm font-medium text-muted-foreground">
				{stat.label}
			</p>
		</div>
	);
}

export function StatsCounter() {
	const { ref, isInView } = useInView({ threshold: 0.3 });

	return (
		<section className="bg-slate-50 py-20 lg:py-28">
			<motion.div
				ref={ref as React.RefObject<HTMLDivElement>}
				initial={{ opacity: 0, y: 20 }}
				animate={isInView ? { opacity: 1, y: 0 } : {}}
				transition={{ duration: 0.5 }}
				className="container mx-auto px-4">
				<div className="mx-auto max-w-4xl rounded-2xl border bg-white p-8 shadow-sm lg:p-12">
					<div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
						{stats.map((stat) => (
							<StatItem key={stat.label} stat={stat} animate={isInView} />
						))}
					</div>
				</div>
			</motion.div>
		</section>
	);
}
