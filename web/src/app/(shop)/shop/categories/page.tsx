"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useServiceCategories } from "@/lib/hooks";

export default function CategoriesIndexPage() {
	const { data, isLoading } = useServiceCategories();
	const categories = data?.data ?? [];

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
		<div className="container mx-auto px-4 py-6">
			<h1 className="mb-6 text-2xl font-bold">All Categories</h1>

			{isLoading ? (
				<div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
					{Array.from({ length: 8 }).map((_, i) => (
						<Skeleton key={i} className="h-28 rounded-xl" />
					))}
				</div>
			) : (
				<div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
					{categories.map((cat) => (
						<Link
							key={cat.id}
							href={`/shop/categories/${cat.slug}`}
							className="group flex items-center gap-4 rounded-xl border bg-card p-4 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
							<span className="text-4xl">
								{iconFallback[cat.slug] ?? iconFallback.default}
							</span>
							<div className="flex-1">
								<h3 className="font-semibold">{cat.name}</h3>
								{cat.description && (
									<p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
										{cat.description}
									</p>
								)}
							</div>
							<ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
						</Link>
					))}
				</div>
			)}
		</div>
	);
}
