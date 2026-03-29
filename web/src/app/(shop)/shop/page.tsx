"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Clock, Star, Flame, Sparkles, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { VendorCard } from "@/components/shop/vendor-card";
import { useServiceCategories, useVendors, useGeolocation } from "@/lib/hooks";

/* ------------------------------------------------------------------ */
/*  Category Grid                                                     */
/* ------------------------------------------------------------------ */
function CategoriesSection() {
	const { data, isLoading } = useServiceCategories();
	const categories = data?.data ?? [];

	// Icon map fallback when iconUrl is empty
	const iconFallback: Record<string, string> = {
		food: "🍔",
		groceries: "🛒",
		pharmacy: "💊",
		laundry: "👕",
		cleaning: "🧹",
		beauty: "💇",
		electronics: "📱",
		default: "📦",
	};

	return (
		<section>
			<div className="mb-4 flex items-center justify-between">
				<h2 className="text-lg font-bold">Categories</h2>
				<Link
					href="/shop/categories"
					className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
					See all <ArrowRight className="h-3.5 w-3.5" />
				</Link>
			</div>

			{isLoading ? (
				<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
					{Array.from({ length: 8 }).map((_, i) => (
						<Skeleton key={i} className="h-24 rounded-xl" />
					))}
				</div>
			) : (
				<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
					{categories.map((cat) => (
						<Link key={cat.id} href={`/shop/categories/${cat.slug}`}>
							<Card className="group h-full cursor-pointer border-none shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
								<CardContent className="flex flex-col items-center justify-center gap-2 p-4 text-center">
									{cat.iconUrl ? (
										cat.iconUrl.startsWith("http") ? (
											<Image
												src={cat.iconUrl}
												alt={cat.name}
												width={40}
												height={40}
												className="h-10 w-10 object-contain"
											/>
										) : (
											<span className="text-3xl">{cat.iconUrl}</span>
										)
									) : (
										<span className="text-3xl">
											{iconFallback[cat.slug] ?? iconFallback.default}
										</span>
									)}
									<span className="text-xs font-medium leading-tight line-clamp-2">
										{cat.name}
									</span>
								</CardContent>
							</Card>
						</Link>
					))}
				</div>
			)}
		</section>
	);
}

/* ------------------------------------------------------------------ */
/*  Vendor Row (reusable for featured / popular / new)                */
/* ------------------------------------------------------------------ */
function VendorRow({
	title,
	icon,
	params,
	emptyText,
}: {
	title: string;
	icon: React.ReactNode;
	params: Record<string, unknown>;
	emptyText: string;
}) {
	const { data, isLoading } = useVendors(params as any);
	const vendors = data?.data ?? [];

	return (
		<section>
			<div className="mb-4 flex items-center justify-between">
				<h2 className="flex items-center gap-2 text-lg font-bold">
					{icon}
					{title}
				</h2>
			</div>

			{isLoading ? (
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
					{Array.from({ length: 4 }).map((_, i) => (
						<Skeleton key={i} className="h-56 rounded-xl" />
					))}
				</div>
			) : vendors.length === 0 ? (
				<p className="py-8 text-center text-sm text-muted-foreground">
					{emptyText}
				</p>
			) : (
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
					{vendors.slice(0, 8).map((vendor) => (
						<VendorCard key={vendor.id} vendor={vendor} />
					))}
				</div>
			)}
		</section>
	);
}

/* ------------------------------------------------------------------ */
/*  Quick-action Banner                                               */
/* ------------------------------------------------------------------ */
function QuickActions() {
	return (
		<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
			<Link href="/shop/categories/food">
				<Card className="group cursor-pointer overflow-hidden border-none shadow-sm transition-all hover:shadow-md">
					<CardContent className="flex items-center gap-4 p-4">
						<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-2xl">
							🍕
						</div>
						<div>
							<p className="font-semibold">Food Delivery</p>
							<p className="text-xs text-muted-foreground">
								Order from your favourite restaurants
							</p>
						</div>
						<ArrowRight className="ml-auto h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
					</CardContent>
				</Card>
			</Link>
			<Link href="/shop/categories/groceries">
				<Card className="group cursor-pointer overflow-hidden border-none shadow-sm transition-all hover:shadow-md">
					<CardContent className="flex items-center gap-4 p-4">
						<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-100 text-2xl">
							🛒
						</div>
						<div>
							<p className="font-semibold">Grocery Shopping</p>
							<p className="text-xs text-muted-foreground">
								Fresh produce & daily essentials
							</p>
						</div>
						<ArrowRight className="ml-auto h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
					</CardContent>
				</Card>
			</Link>
			<Link href="/shop/categories/pharmacy">
				<Card className="group cursor-pointer overflow-hidden border-none shadow-sm transition-all hover:shadow-md">
					<CardContent className="flex items-center gap-4 p-4">
						<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-2xl">
							💊
						</div>
						<div>
							<p className="font-semibold">Pharmacy</p>
							<p className="text-xs text-muted-foreground">
								Medicines delivered fast
							</p>
						</div>
						<ArrowRight className="ml-auto h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
					</CardContent>
				</Card>
			</Link>
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */
export default function ShopHomePage() {
	const { lat, lng } = useGeolocation();
	const locationParams = lat && lng ? { lat, lng, radius: 10 } : {};

	return (
		<div className="container mx-auto space-y-8 px-4 py-6">
			{/* Quick Actions */}
			<QuickActions />

			{/* Categories Grid */}
			<CategoriesSection />

			{/* Popular Near You */}
			<VendorRow
				title="Popular Near You"
				icon={<Flame className="h-5 w-5 text-orange-500" />}
				params={{ sort: "rating", pageSize: 8, ...locationParams }}
				emptyText="No vendors available near you yet."
			/>

			{/* New on RunAm */}
			<VendorRow
				title="New on RunAm"
				icon={<Sparkles className="h-5 w-5 text-primary" />}
				params={{ sort: "newest", pageSize: 8, ...locationParams }}
				emptyText="No new vendors yet."
			/>

			{/* Fast Delivery */}
			<VendorRow
				title="Fast Delivery"
				icon={<Clock className="h-5 w-5 text-blue-500" />}
				params={{ sort: "deliveryTime", pageSize: 8, ...locationParams }}
				emptyText="No vendors with fast delivery available."
			/>
		</div>
	);
}
