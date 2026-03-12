import { Skeleton } from "@/components/ui/skeleton";

export default function ShopLoading() {
	return (
		<div className="space-y-6">
			<Skeleton className="h-10 w-64" />
			<div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
				{[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
					<Skeleton key={i} className="h-64 rounded-lg" />
				))}
			</div>
		</div>
	);
}
