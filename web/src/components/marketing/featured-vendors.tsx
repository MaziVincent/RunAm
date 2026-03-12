"use client";

import Image from "next/image";
import Link from "next/link";
import {
	ArrowRight,
	Star,
	Clock,
	ChevronLeft,
	ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInView } from "@/lib/hooks";
import { motion } from "framer-motion";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { useCallback, useEffect, useState } from "react";

interface FeaturedVendor {
	id: string;
	name: string;
	category: string;
	rating: number;
	reviews: number;
	deliveryTime: string;
	deliveryFee: string;
	image: string;
	isOpen: boolean;
}

// Placeholder data until real API data is available
const featuredVendors: FeaturedVendor[] = [
	{
		id: "1",
		name: "Mama's Kitchen",
		category: "Nigerian Cuisine",
		rating: 4.8,
		reviews: 234,
		deliveryTime: "20-35 min",
		deliveryFee: "Free",
		image: "/images/vendors/placeholder-1.jpg",
		isOpen: true,
	},
	{
		id: "2",
		name: "Fresh Mart",
		category: "Groceries",
		rating: 4.6,
		reviews: 189,
		deliveryTime: "25-40 min",
		deliveryFee: "₦200",
		image: "/images/vendors/placeholder-2.jpg",
		isOpen: true,
	},
	{
		id: "3",
		name: "QuickBite Burgers",
		category: "Fast Food",
		rating: 4.7,
		reviews: 312,
		deliveryTime: "15-25 min",
		deliveryFee: "₦150",
		image: "/images/vendors/placeholder-3.jpg",
		isOpen: true,
	},
	{
		id: "4",
		name: "PharmaCare",
		category: "Pharmacy",
		rating: 4.9,
		reviews: 156,
		deliveryTime: "30-45 min",
		deliveryFee: "₦300",
		image: "/images/vendors/placeholder-4.jpg",
		isOpen: false,
	},
	{
		id: "5",
		name: "Suya Spot",
		category: "Grills & BBQ",
		rating: 4.5,
		reviews: 278,
		deliveryTime: "20-30 min",
		deliveryFee: "Free",
		image: "/images/vendors/placeholder-5.jpg",
		isOpen: true,
	},
	{
		id: "6",
		name: "Laundry Express",
		category: "Laundry",
		rating: 4.4,
		reviews: 95,
		deliveryTime: "Same day",
		deliveryFee: "₦500",
		image: "/images/vendors/placeholder-6.jpg",
		isOpen: true,
	},
];

export function FeaturedVendors() {
	const { ref, isInView } = useInView({ threshold: 0.1 });
	const [emblaRef, emblaApi] = useEmblaCarousel(
		{ loop: true, align: "start", slidesToScroll: 1 },
		[Autoplay({ delay: 4000, stopOnInteraction: true })],
	);
	const [canScrollPrev, setCanScrollPrev] = useState(false);
	const [canScrollNext, setCanScrollNext] = useState(false);

	const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
	const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

	const onSelect = useCallback(() => {
		if (!emblaApi) return;
		setCanScrollPrev(emblaApi.canScrollPrev());
		setCanScrollNext(emblaApi.canScrollNext());
	}, [emblaApi]);

	useEffect(() => {
		if (!emblaApi) return;
		onSelect();
		emblaApi.on("select", onSelect);
		emblaApi.on("reInit", onSelect);
	}, [emblaApi, onSelect]);

	return (
		<section id="vendors" className="py-20 lg:py-28">
			<div className="container mx-auto px-4">
				{/* Section header */}
				<div className="flex items-end justify-between">
					<div>
						<span className="text-sm font-semibold uppercase tracking-wider text-primary">
							Featured Vendors
						</span>
						<h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
							Popular Shops Near You
						</h2>
						<p className="mt-3 max-w-lg text-muted-foreground">
							Discover top-rated local vendors delivering quality products and
							services.
						</p>
					</div>

					<div className="hidden items-center gap-2 sm:flex">
						<Button
							variant="outline"
							size="icon"
							onClick={scrollPrev}
							disabled={!canScrollPrev}
							aria-label="Previous vendors">
							<ChevronLeft className="h-4 w-4" />
						</Button>
						<Button
							variant="outline"
							size="icon"
							onClick={scrollNext}
							disabled={!canScrollNext}
							aria-label="Next vendors">
							<ChevronRight className="h-4 w-4" />
						</Button>
					</div>
				</div>

				{/* Carousel */}
				<motion.div
					ref={ref as React.RefObject<HTMLDivElement>}
					initial={{ opacity: 0, y: 20 }}
					animate={isInView ? { opacity: 1, y: 0 } : {}}
					transition={{ duration: 0.5 }}
					className="mt-10">
					<div ref={emblaRef} className="overflow-hidden">
						<div className="flex gap-6">
							{featuredVendors.map((vendor) => (
								<div
									key={vendor.id}
									className="min-w-0 flex-[0_0_85%] sm:flex-[0_0_45%] lg:flex-[0_0_30%]">
									<Link
										href={`/shop/vendors/${vendor.id}`}
										className="group flex flex-col overflow-hidden rounded-xl border bg-card transition-all hover:shadow-lg hover:-translate-y-0.5">
										{/* Image */}
										<div className="relative aspect-[16/10] overflow-hidden bg-muted">
											<div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
												<span className="text-4xl font-bold text-primary/20">
													{vendor.name[0]}
												</span>
											</div>
											<div className="absolute left-3 top-3">
												<span
													className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
														vendor.isOpen
															? "bg-green-100 text-green-700"
															: "bg-slate-100 text-slate-600"
													}`}>
													{vendor.isOpen ? "Open" : "Closed"}
												</span>
											</div>
										</div>

										{/* Content */}
										<div className="flex flex-1 flex-col p-4">
											<h3 className="font-semibold line-clamp-1">
												{vendor.name}
											</h3>
											<p className="mt-0.5 text-sm text-muted-foreground">
												{vendor.category}
											</p>
											<div className="mt-auto flex items-center gap-3 pt-3 text-sm text-muted-foreground">
												<span className="flex items-center gap-1">
													<Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
													<span className="font-medium text-foreground">
														{vendor.rating}
													</span>
													<span className="text-xs">({vendor.reviews})</span>
												</span>
												<span className="flex items-center gap-1">
													<Clock className="h-3.5 w-3.5" />
													{vendor.deliveryTime}
												</span>
												<span className="ml-auto text-xs font-medium">
													{vendor.deliveryFee === "Free"
														? "Free delivery"
														: `${vendor.deliveryFee} delivery`}
												</span>
											</div>
										</div>
									</Link>
								</div>
							))}
						</div>
					</div>
				</motion.div>

				{/* View all link */}
				<div className="mt-10 text-center">
					<Button variant="outline" size="lg" asChild>
						<Link href="/shop">
							View All Vendors
							<ArrowRight className="ml-2 h-4 w-4" />
						</Link>
					</Button>
				</div>
			</div>
		</section>
	);
}
