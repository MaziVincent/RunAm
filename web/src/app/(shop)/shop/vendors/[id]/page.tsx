"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import {
	Star,
	Clock,
	MapPin,
	Truck,
	ChevronRight,
	Search,
	ShoppingBag,
	Info,
	Package,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useVendorDetail } from "@/lib/hooks";
import { formatCurrency, cn } from "@/lib/utils";
import { ProductSheet } from "@/components/shop/product-sheet";
import type { ProductDto, ProductCategoryWithProductsDto } from "@/types";

/* ------------------------------------------------------------------ */
/*  Vendor Hero Banner                                                */
/* ------------------------------------------------------------------ */
function VendorHero({
	vendor,
}: {
	vendor: {
		businessName: string;
		bannerUrl: string | null;
		logoUrl: string | null;
		isOpen: boolean;
		rating: number;
		totalReviews: number;
		estimatedPrepTimeMinutes: number;
		deliveryFee: number;
		minimumOrderAmount: number;
		address: string;
		serviceCategories: { name: string }[];
	};
}) {
	return (
		<div className="relative">
			{/* Banner */}
			<div className="relative h-40 w-full bg-gradient-to-r from-primary/20 to-primary/5 sm:h-52 md:h-64">
				{vendor.bannerUrl && (
					<Image
						src={vendor.bannerUrl}
						alt={vendor.businessName}
						fill
						className="object-cover"
						priority
					/>
				)}
				<div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
			</div>

			{/* Info overlay */}
			<div className="container mx-auto px-4">
				<div className="-mt-16 relative flex items-end gap-4 pb-4 sm:-mt-20">
					{/* Logo */}
					<div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border-4 border-background bg-background shadow-md sm:h-24 sm:w-24">
						{vendor.logoUrl ? (
							<Image
								src={vendor.logoUrl}
								alt={vendor.businessName}
								fill
								className="object-cover"
							/>
						) : (
							<div className="flex h-full w-full items-center justify-center bg-primary/10 text-3xl font-bold text-primary">
								{vendor.businessName[0]}
							</div>
						)}
					</div>

					<div className="min-w-0 flex-1 pb-1">
						<div className="flex items-center gap-2">
							<h1 className="truncate text-xl font-bold text-white drop-shadow sm:text-2xl">
								{vendor.businessName}
							</h1>
							<Badge
								variant={vendor.isOpen ? "default" : "secondary"}
								className="shrink-0 text-xs">
								{vendor.isOpen ? "Open" : "Closed"}
							</Badge>
						</div>
						<div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-white/80">
							{vendor.serviceCategories.map((sc) => (
								<span key={sc.name}>{sc.name}</span>
							))}
						</div>
					</div>
				</div>

				{/* Stat chips */}
				<div className="flex flex-wrap gap-3 pb-4">
					<div className="flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-sm shadow-sm">
						<Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
						<span className="font-semibold">{vendor.rating.toFixed(1)}</span>
						<span className="text-muted-foreground">
							({vendor.totalReviews})
						</span>
					</div>
					<div className="flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-sm shadow-sm">
						<Clock className="h-3.5 w-3.5 text-blue-500" />
						<span>{vendor.estimatedPrepTimeMinutes}–{vendor.estimatedPrepTimeMinutes + 15} min</span>
					</div>
					<div className="flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-sm shadow-sm">
						<Truck className="h-3.5 w-3.5 text-primary" />
						<span>
							{vendor.deliveryFee === 0
								? "Free delivery"
								: formatCurrency(vendor.deliveryFee)}
						</span>
					</div>
					{vendor.minimumOrderAmount > 0 && (
						<div className="flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-sm shadow-sm">
							<ShoppingBag className="h-3.5 w-3.5 text-muted-foreground" />
							<span>Min. {formatCurrency(vendor.minimumOrderAmount)}</span>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  Scrollspy Category Nav                                            */
/* ------------------------------------------------------------------ */
function CategoryNav({
	categories,
	activeId,
	onSelect,
}: {
	categories: ProductCategoryWithProductsDto[];
	activeId: string | null;
	onSelect: (id: string) => void;
}) {
	const scrollRef = useRef<HTMLDivElement>(null);

	return (
		<div className="sticky top-14 z-30 border-b bg-background/95 backdrop-blur lg:top-16">
			<div
				ref={scrollRef}
				className="container mx-auto flex gap-1 overflow-x-auto px-4 py-2 scrollbar-none">
				{categories.map((cat) => (
					<button
						key={cat.id}
						onClick={() => onSelect(cat.id)}
						className={cn(
							"shrink-0 rounded-full px-4 py-2.5 text-sm font-medium transition-colors",
							activeId === cat.id
								? "bg-primary text-primary-foreground"
								: "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground",
						)}>
						{cat.name}
					</button>
				))}
			</div>
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  Product Item Row                                                  */
/* ------------------------------------------------------------------ */
function ProductItem({
	product,
	onSelect,
}: {
	product: ProductDto;
	onSelect: (p: ProductDto) => void;
}) {
	const hasVariants = !!product.variantsJson;
	const hasExtras = !!product.extrasJson;
	const discount = product.compareAtPrice
		? Math.round(
			((product.compareAtPrice - product.price) / product.compareAtPrice) *
			100,
		)
		: null;

	return (
		<button
			onClick={() => onSelect(product)}
			disabled={!product.isAvailable}
			className={cn(
				"flex w-full gap-4 rounded-xl border bg-card p-3 text-left shadow-sm transition-all hover:shadow-md",
				!product.isAvailable && "opacity-50 cursor-not-allowed",
			)}>
			{/* Image */}
			{product.imageUrl ? (
				<div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg sm:h-24 sm:w-24">
					<Image
						src={product.imageUrl}
						alt={product.name}
						fill
						className="object-cover"
					/>
					{!product.isAvailable && (
						<div className="absolute inset-0 flex items-center justify-center bg-black/50 text-xs font-semibold text-white">
							Sold Out
						</div>
					)}
				</div>
			) : (
				<div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-muted sm:h-24 sm:w-24">
					<Package className="h-8 w-8 text-muted-foreground" />
				</div>
			)}

			{/* Info */}
			<div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
				<div>
					<h4 className="font-semibold text-sm leading-tight line-clamp-1">
						{product.name}
					</h4>
					{product.description && (
						<p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
							{product.description}
						</p>
					)}
				</div>
				<div className="mt-1 flex items-center gap-2">
					<span className="font-bold text-sm">
						{formatCurrency(product.price)}
					</span>
					{product.compareAtPrice && (
						<span className="text-xs text-muted-foreground line-through">
							{formatCurrency(product.compareAtPrice)}
						</span>
					)}
					{discount && (
						<Badge variant="secondary" className="text-[10px]">
							-{discount}%
						</Badge>
					)}
					{(hasVariants || hasExtras) && (
						<span className="ml-auto text-xs text-muted-foreground">
							Customisable
						</span>
					)}
				</div>
			</div>
		</button>
	);
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                         */
/* ------------------------------------------------------------------ */
export default function VendorStorefrontPage() {
	const { id } = useParams();
	const vendorId = id as string;

	const { data, isLoading, error } = useVendorDetail(vendorId);
	const vendor = data?.data;

	const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
	const [productSearch, setProductSearch] = useState("");
	const [selectedProduct, setSelectedProduct] = useState<ProductDto | null>(null);

	const categoryRefs = useRef<Map<string, HTMLElement>>(new Map());

	const categories = vendor?.productCategories ?? [];

	// Set first category as active on load
	useEffect(() => {
		if (categories.length > 0 && !activeCategoryId) {
			setActiveCategoryId(categories[0].id);
		}
	}, [categories]);

	// Scroll spy
	useEffect(() => {
		if (categories.length === 0) return;

		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						setActiveCategoryId(entry.target.getAttribute("data-cat-id"));
					}
				}
			},
			{ rootMargin: "-100px 0px -60% 0px", threshold: 0 },
		);

		categoryRefs.current.forEach((el) => observer.observe(el));
		return () => observer.disconnect();
	}, [categories]);

	const handleCategorySelect = useCallback(
		(catId: string) => {
			const el = categoryRefs.current.get(catId);
			if (el) {
				const top = el.getBoundingClientRect().top + window.scrollY - 120;
				window.scrollTo({ top, behavior: "smooth" });
			}
			setActiveCategoryId(catId);
		},
		[],
	);

	// Product search filter
	const filteredCategories = useMemo(() => {
		if (!productSearch.trim()) return categories;
		const q = productSearch.toLowerCase();
		return categories
			.map((cat) => ({
				...cat,
				products: cat.products.filter(
					(p) =>
						p.name.toLowerCase().includes(q) ||
						p.description?.toLowerCase().includes(q),
				),
			}))
			.filter((cat) => cat.products.length > 0);
	}, [categories, productSearch]);

	if (isLoading) {
		return (
			<div className="space-y-4">
				<Skeleton className="h-52 w-full" />
				<div className="container mx-auto space-y-4 px-4">
					<Skeleton className="h-8 w-48" />
					<Skeleton className="h-10 w-full" />
					{Array.from({ length: 4 }).map((_, i) => (
						<Skeleton key={i} className="h-24 w-full rounded-xl" />
					))}
				</div>
			</div>
		);
	}

	if (error || !vendor) {
		return (
			<div className="flex flex-col items-center justify-center py-32 text-center">
				<Package className="h-16 w-16 text-muted-foreground/40" />
				<h2 className="mt-4 text-lg font-semibold">Vendor not found</h2>
				<p className="mt-1 text-sm text-muted-foreground">
					The vendor you&apos;re looking for doesn&apos;t exist or has been
					removed.
				</p>
			</div>
		);
	}

	return (
		<div className="pb-20">
			{/* Hero */}
			<VendorHero vendor={vendor} />

			{/* Category Nav */}
			{categories.length > 0 && (
				<CategoryNav
					categories={categories}
					activeId={activeCategoryId}
					onSelect={handleCategorySelect}
				/>
			)}

			{/* Product Search */}
			<div className="container mx-auto px-4 py-4">
				<div className="relative">
					<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						value={productSearch}
						onChange={(e) => setProductSearch(e.target.value)}
						placeholder="Search this menu..."
						className="pl-10"
					/>
				</div>
			</div>

			{/* Vendor Closed Alert */}
			{!vendor.isOpen && (
				<div className="container mx-auto px-4">
					<div className="mb-4 flex items-center gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800 dark:border-yellow-800/50 dark:bg-yellow-900/20 dark:text-yellow-200">
						<Info className="h-4 w-4 shrink-0" />
						<p>
							This vendor is currently closed. You can browse the menu, but
							ordering is unavailable right now.
						</p>
					</div>
				</div>
			)}

			{/* Product List by Category */}
			<div className="container mx-auto px-4">
				{filteredCategories.length === 0 ? (
					<div className="py-16 text-center">
						<p className="text-muted-foreground">
							No products match &ldquo;{productSearch}&rdquo;
						</p>
					</div>
				) : (
					<div className="space-y-8">
						{filteredCategories.map((cat) => (
							<section
								key={cat.id}
								ref={(el) => {
									if (el) categoryRefs.current.set(cat.id, el);
								}}
								data-cat-id={cat.id}>
								<h3 className="mb-3 text-lg font-bold">{cat.name}</h3>
								<div className="grid gap-3 sm:grid-cols-2">
									{cat.products
										.filter((p) => p.isActive)
										.map((product) => (
											<ProductItem
												key={product.id}
												product={product}
												onSelect={setSelectedProduct}
											/>
										))}
								</div>
							</section>
						))}
					</div>
				)}
			</div>

			{/* Product Customization Sheet */}
			<ProductSheet
				product={selectedProduct}
				vendor={{
					id: vendor.id,
					name: vendor.businessName,
					isOpen: vendor.isOpen,
				}}
				onClose={() => setSelectedProduct(null)}
			/>
		</div>
	);
}
