"use client";

import Link from "next/link";
import Image from "next/image";
import {
	ArrowRight,
	Star,
	Clock,
	ChevronLeft,
	ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useInView, useVendors } from "@/lib/hooks";
import { motion } from "framer-motion";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { useCallback, useEffect, useState } from "react";

export function FeaturedVendors() {
	const { ref, isInView } = useInView({ threshold: 0.1 });
	const { data, isLoading } = useVendors({ sort: "rating", pageSize: 8 });
	const vendors = data?.data ?? [];

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
					{isLoading ? (
						<div className="flex gap-6">
							{Array.from({ length: 3 }).map((_, i) => (
								<div
									key={i}
									className="min-w-0 flex-[0_0_85%] sm:flex-[0_0_45%] lg:flex-[0_0_30%]">
									<Skeleton className="h-64 rounded-xl" />
								</div>
							))}
						</div>
					) : vendors.length === 0 ? (
						<p className="py-12 text-center text-muted-foreground">
							No vendors available yet. Check back soon!
						</p>
					) : (
						<div ref={emblaRef} className="overflow-hidden">
							<div className="flex gap-6">
								{vendors.map((vendor) => (
									<div
										key={vendor.id}
										className="min-w-0 flex-[0_0_85%] sm:flex-[0_0_45%] lg:flex-[0_0_30%]">
										<Link
											href={`/shop/vendors/${vendor.id}`}
											className="group flex flex-col overflow-hidden rounded-xl border bg-card transition-all hover:shadow-lg hover:-translate-y-0.5">
											{/* Image */}
											<div className="relative aspect-[16/10] overflow-hidden bg-muted">
												{vendor.bannerUrl ? (
													<Image
														src={vendor.bannerUrl}
														alt={vendor.businessName}
														fill
														className="object-cover transition-transform group-hover:scale-105"
													/>
												) : (
													<div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
														{vendor.logoUrl ? (
															<Image
																src={vendor.logoUrl}
																alt={vendor.businessName}
																width={64}
																height={64}
																className="h-16 w-16 rounded-full object-cover"
															/>
														) : (
															<span className="text-4xl font-bold text-primary/20">
																{vendor.businessName[0]}
															</span>
														)}
													</div>
												)}
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
													{vendor.businessName}
												</h3>
												<p className="mt-0.5 text-sm text-muted-foreground line-clamp-1">
													{vendor.serviceCategories
														.map((c) => c.name)
														.join(", ") || "General"}
												</p>
												<div className="mt-auto flex items-center gap-3 pt-3 text-sm text-muted-foreground">
													<span className="flex items-center gap-1">
														<Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
														<span className="font-medium text-foreground">
															{vendor.rating.toFixed(1)}
														</span>
														<span className="text-xs">
															({vendor.totalReviews})
														</span>
													</span>
													<span className="flex items-center gap-1">
														<Clock className="h-3.5 w-3.5" />
														{vendor.estimatedPrepTimeMinutes}-
														{vendor.estimatedPrepTimeMinutes + 15} min
													</span>
													<span className="ml-auto text-xs font-medium">
														{vendor.deliveryFee === 0
															? "Free delivery"
															: `₦${vendor.deliveryFee.toLocaleString()} delivery`}
													</span>
												</div>
											</div>
										</Link>
									</div>
								))}
							</div>
						</div>
					)}
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
