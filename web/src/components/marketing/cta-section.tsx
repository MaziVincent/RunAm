"use client";

import Link from "next/link";
import { ArrowRight, Smartphone, Store, Bike } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInView } from "@/lib/hooks";
import { motion } from "framer-motion";

export function CTASection() {
	const { ref, isInView } = useInView({ threshold: 0.2 });

	return (
		<section className="relative overflow-hidden bg-primary py-20 lg:py-28">
			{/* Background pattern */}
			<div className="absolute inset-0 opacity-10">
				<div
					className="absolute inset-0"
					style={{
						backgroundImage:
							"radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
						backgroundSize: "32px 32px",
					}}
				/>
			</div>
			<div className="absolute left-0 top-0 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
			<div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-white/5 blur-3xl" />

			<motion.div
				ref={ref as React.RefObject<HTMLDivElement>}
				initial={{ opacity: 0, y: 20 }}
				animate={isInView ? { opacity: 1, y: 0 } : {}}
				transition={{ duration: 0.5 }}
				className="container relative mx-auto px-4">
				<div className="mx-auto max-w-3xl text-center">
					<h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
						Ready to Get Started?
					</h2>
					<p className="mx-auto mt-4 max-w-xl text-lg text-white/80">
						Join thousands of users, vendors, and riders making life easier across
						Nigeria. Sign up today — it&apos;s free.
					</p>

					{/* CTA buttons */}
					<div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
						<Button
							size="xl"
							asChild
							className="bg-white text-primary hover:bg-white/90 shadow-xl">
							<Link href="/register">
								<Smartphone className="mr-2 h-5 w-5" />
								Sign Up as Customer
							</Link>
						</Button>
						<Button
							size="xl"
							variant="outline"
							asChild
							className="border-white/30 bg-transparent text-white hover:bg-white/10">
							<Link href="/register?role=vendor">
								<Store className="mr-2 h-5 w-5" />
								Join as Vendor
							</Link>
						</Button>
					</div>

					{/* Rider CTA */}
					<p className="mt-6 text-white/60">
						Want to earn as a rider?{" "}
						<Link
							href="/register?role=rider"
							className="inline-flex items-center gap-1 font-medium text-white underline-offset-4 hover:underline">
							Become a Rider
							<ArrowRight className="h-4 w-4" />
						</Link>
					</p>

					{/* Trust indicators */}
					<div className="mt-12 grid grid-cols-3 gap-6 border-t border-white/10 pt-8">
						<div className="flex flex-col items-center gap-2">
							<Smartphone className="h-6 w-6 text-white/60" />
							<span className="text-sm text-white/60">Easy Sign Up</span>
						</div>
						<div className="flex flex-col items-center gap-2">
							<Store className="h-6 w-6 text-white/60" />
							<span className="text-sm text-white/60">500+ Vendors</span>
						</div>
						<div className="flex flex-col items-center gap-2">
							<Bike className="h-6 w-6 text-white/60" />
							<span className="text-sm text-white/60">200+ Riders</span>
						</div>
					</div>
				</div>
			</motion.div>
		</section>
	);
}
