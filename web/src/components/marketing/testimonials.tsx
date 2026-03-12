"use client";

import Image from "next/image";
import { Star, Quote } from "lucide-react";
import { useInView } from "@/lib/hooks";
import { motion } from "framer-motion";

interface Testimonial {
	id: string;
	name: string;
	role: string;
	avatar: string;
	rating: number;
	text: string;
}

const testimonials: Testimonial[] = [
	{
		id: "1",
		name: "Chidi Okonkwo",
		role: "Regular Customer",
		avatar: "",
		rating: 5,
		text: "RunAm has completely changed how I handle errands in Lagos. I can order food, send documents, and shop for groceries all from one app. The delivery is always fast!",
	},
	{
		id: "2",
		name: "Amina Bello",
		role: "Business Owner",
		avatar: "",
		rating: 5,
		text: "As a vendor on RunAm, my sales have increased by 40%. The platform makes it easy to manage orders and reach new customers. The rider network is reliable.",
	},
	{
		id: "3",
		name: "Emeka Nnamdi",
		role: "Rider Partner",
		avatar: "",
		rating: 5,
		text: "I started riding with RunAm 6 months ago and it's been great. The pay is fair, the app is easy to use, and I get to set my own schedule. Highly recommend.",
	},
	{
		id: "4",
		name: "Fatima Abubakar",
		role: "Regular Customer",
		avatar: "",
		rating: 4,
		text: "The real-time tracking feature is my favorite. I always know exactly where my delivery is. Customer support is also very responsive when I need help.",
	},
	{
		id: "5",
		name: "Tunde Adeyemi",
		role: "Restaurant Owner",
		avatar: "",
		rating: 5,
		text: "RunAm's vendor dashboard gives me complete control over my menu and orders. The commission rates are fair and payments are always on time.",
	},
	{
		id: "6",
		name: "Ngozi Eze",
		role: "Regular Customer",
		avatar: "",
		rating: 5,
		text: "I love the variety of services available. From pharmacy pickups to laundry — RunAm literally runs all my errands. The wallet makes payment seamless too.",
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

export function Testimonials() {
	const { ref, isInView } = useInView({ threshold: 0.1 });

	return (
		<section className="py-20 lg:py-28">
			<div className="container mx-auto px-4">
				{/* Section header */}
				<div className="mx-auto max-w-2xl text-center">
					<span className="text-sm font-semibold uppercase tracking-wider text-primary">
						Testimonials
					</span>
					<h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
						Loved by Thousands
					</h2>
					<p className="mt-4 text-lg text-muted-foreground">
						Hear from our customers, vendors, and riders about their RunAm experience.
					</p>
				</div>

				{/* Testimonials grid */}
				<motion.div
					ref={ref as React.RefObject<HTMLDivElement>}
					variants={container}
					initial="hidden"
					animate={isInView ? "show" : "hidden"}
					className="mt-14 columns-1 gap-6 sm:columns-2 lg:columns-3">
					{testimonials.map((testimonial) => (
						<motion.div
							key={testimonial.id}
							variants={item}
							className="mb-6 break-inside-avoid rounded-xl border bg-card p-6">
							{/* Quote icon */}
							<Quote className="h-8 w-8 text-primary/20" />

							{/* Stars */}
							<div className="mt-3 flex gap-0.5">
								{Array.from({ length: 5 }).map((_, i) => (
									<Star
										key={i}
										className={`h-4 w-4 ${
											i < testimonial.rating
												? "fill-yellow-400 text-yellow-400"
												: "text-muted-foreground/20"
										}`}
									/>
								))}
							</div>

							{/* Text */}
							<p className="mt-4 text-sm leading-relaxed text-muted-foreground">
								&ldquo;{testimonial.text}&rdquo;
							</p>

							{/* Author */}
							<div className="mt-4 flex items-center gap-3 border-t pt-4">
								<div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
									{testimonial.name.split(" ").map(n => n[0]).join("")}
								</div>
								<div>
									<p className="text-sm font-semibold">{testimonial.name}</p>
									<p className="text-xs text-muted-foreground">
										{testimonial.role}
									</p>
								</div>
							</div>
						</motion.div>
					))}
				</motion.div>
			</div>
		</section>
	);
}
