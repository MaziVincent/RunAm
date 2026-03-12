"use client";

import { useState, useMemo } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import {
	SlidersHorizontal,
	Star,
	Clock,
	ArrowUpDown,
	X,
	Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { VendorCard } from "@/components/shop/vendor-card";
import {
	useServiceCategoryBySlug,
	useVendors,
	type VendorQueryParams,
} from "@/lib/hooks";

const SORT_OPTIONS = [
	{ value: "rating", label: "Top Rated" },
	{ value: "deliveryTime", label: "Fastest Delivery" },
	{ value: "deliveryFee", label: "Lowest Delivery Fee" },
	{ value: "newest", label: "Newest" },
	{ value: "popular", label: "Most Popular" },
] as const;

const RATING_FILTERS = [
	{ value: 4.5, label: "4.5+" },
	{ value: 4.0, label: "4.0+" },
	{ value: 3.5, label: "3.5+" },
] as const;

export default function CategoryPage() {
	const params = useParams();
	const router = useRouter();
	const searchParams = useSearchParams();
	const slug = params.slug as string;

	// URL‑driven state
	const sort = (searchParams.get("sort") ?? "rating") as string;
	const minRating = searchParams.get("minRating")
		? parseFloat(searchParams.get("minRating")!)
		: undefined;
	const openNow = searchParams.get("openNow") === "true";
	const page = parseInt(searchParams.get("page") ?? "1", 10);

	// Fetch category metadata
	const { data: catData, isLoading: catLoading } =
		useServiceCategoryBySlug(slug);
	const category = catData?.data;

	// Fetch vendors for this category
	const vendorParams: VendorQueryParams = useMemo(
		() => ({
			categoryId: category?.id,
			sort,
			page,
			pageSize: 12,
		}),
		[category?.id, sort, page],
	);

	const {
		data: vendorsData,
		isLoading: vendorsLoading,
		isFetching,
	} = useVendors(vendorParams);

	const vendors = vendorsData?.data ?? [];
	const pagination = vendorsData?.meta;

	const [filtersOpen, setFiltersOpen] = useState(false);

	// Update URL params helper
	function updateParam(key: string, value: string | null) {
		const sp = new URLSearchParams(searchParams.toString());
		if (value === null) {
			sp.delete(key);
		} else {
			sp.set(key, value);
		}
		// Reset to page 1 when filter changes
		if (key !== "page") sp.set("page", "1");
		router.push(`?${sp.toString()}`, { scroll: false });
	}

	// Active filter count for badge
	const activeFilters = [minRating, openNow].filter(Boolean).length;

	// Client-side rating + open filter (if API doesn't support them)
	const filteredVendors = vendors.filter((v) => {
		if (minRating && v.rating < minRating) return false;
		if (openNow && !v.isOpen) return false;
		return true;
	});

	const isLoading = catLoading || vendorsLoading;

	return (
		<div className="container mx-auto px-4 py-6">
			{/* Header */}
			<div className="mb-6">
				{catLoading ? (
					<Skeleton className="h-8 w-48" />
				) : (
					<>
						<h1 className="text-2xl font-bold">
							{category?.name ?? "Category"}
						</h1>
						{category?.description && (
							<p className="mt-1 text-sm text-muted-foreground">
								{category.description}
							</p>
						)}
					</>
				)}
			</div>

			{/* Toolbar: Sort + Filters */}
			<div className="mb-6 flex flex-wrap items-center gap-3">
				{/* Sort */}
				<Select
					value={sort}
					onValueChange={(val) => updateParam("sort", val)}>
					<SelectTrigger className="h-10 w-[180px]">
						<ArrowUpDown className="mr-2 h-3.5 w-3.5" />
						<SelectValue placeholder="Sort by" />
					</SelectTrigger>
					<SelectContent>
						{SORT_OPTIONS.map((opt) => (
							<SelectItem key={opt.value} value={opt.value}>
								{opt.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				{/* Rating filter pills */}
				<div className="hidden items-center gap-2 md:flex">
					{RATING_FILTERS.map((rf) => (
						<Badge
							key={rf.value}
							variant={minRating === rf.value ? "default" : "outline"}
							className="cursor-pointer gap-1 px-3 py-1.5"
							onClick={() =>
								updateParam(
									"minRating",
									minRating === rf.value ? null : String(rf.value),
								)
							}>
							<Star className="h-3 w-3" />
							{rf.label}
						</Badge>
					))}
				</div>

				{/* Open Now toggle */}
				<div className="flex items-center gap-2">
					<Checkbox
						id="open-now"
						checked={openNow}
						onCheckedChange={(checked) =>
							updateParam("openNow", checked ? "true" : null)
						}
					/>
					<Label htmlFor="open-now" className="text-sm cursor-pointer">
						Open Now
					</Label>
				</div>

				{/* Mobile filter button */}
				<Button
					variant="outline"
					size="sm"
					className="gap-1.5 md:hidden"
					onClick={() => setFiltersOpen(!filtersOpen)}>
					<Filter className="h-3.5 w-3.5" />
					Filters
					{activeFilters > 0 && (
						<Badge className="ml-1 h-4 w-4 rounded-full p-0 text-[10px]">
							{activeFilters}
						</Badge>
					)}
				</Button>

				{/* Fetching indicator */}
				{isFetching && !isLoading && (
					<span className="ml-auto text-xs text-muted-foreground">
						Updating...
					</span>
				)}
			</div>

			{/* Mobile filters drawer */}
			{filtersOpen && (
				<div className="mb-6 rounded-lg border bg-card p-4 md:hidden">
					<div className="mb-3 flex items-center justify-between">
						<h3 className="font-semibold text-sm">Filters</h3>
						<button onClick={() => setFiltersOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-md hover:bg-accent">
							<X className="h-4 w-4" />
						</button>
					</div>
					<div className="space-y-3">
						<div>
							<Label className="text-xs text-muted-foreground mb-1.5 block">
								Minimum Rating
							</Label>
							<div className="flex gap-2">
								{RATING_FILTERS.map((rf) => (
									<Badge
										key={rf.value}
										variant={minRating === rf.value ? "default" : "outline"}
										className="cursor-pointer gap-1"
										onClick={() =>
											updateParam(
												"minRating",
												minRating === rf.value ? null : String(rf.value),
											)
										}>
										<Star className="h-3 w-3" />
										{rf.label}
									</Badge>
								))}
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Results */}
			{isLoading ? (
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
					{Array.from({ length: 8 }).map((_, i) => (
						<Skeleton key={i} className="h-56 rounded-xl" />
					))}
				</div>
			) : filteredVendors.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-20 text-center">
					<p className="text-lg font-medium text-muted-foreground">
						No vendors found
					</p>
					<p className="mt-1 text-sm text-muted-foreground">
						Try adjusting your filters or check back later
					</p>
					<Button
						variant="outline"
						className="mt-4"
						onClick={() => router.push(`/shop/categories/${slug}`)}>
						Clear Filters
					</Button>
				</div>
			) : (
				<>
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
						{filteredVendors.map((vendor) => (
							<VendorCard key={vendor.id} vendor={vendor} />
						))}
					</div>

					{/* Pagination */}
					{pagination && pagination.totalPages > 1 && (
						<div className="mt-8 flex items-center justify-center gap-2">
							<Button
								variant="outline"
								disabled={page <= 1}
								onClick={() => updateParam("page", String(page - 1))}>
								Previous
							</Button>
							<span className="text-sm text-muted-foreground">
								Page {page} of {pagination.totalPages}
							</span>
							<Button
								variant="outline"
								disabled={page >= pagination.totalPages}
								onClick={() => updateParam("page", String(page + 1))}>
								Next
							</Button>
						</div>
					)}
				</>
			)}
		</div>
	);
}
