import { Skeleton } from "@/components/ui/skeleton";

export default function VendorDashboardLoading() {
	return (
		<div className="space-y-6">
			<div className="space-y-2">
				<Skeleton className="h-8 w-48" />
				<Skeleton className="h-4 w-72" />
			</div>
			<div className="grid gap-3 sm:grid-cols-3">
				{[1, 2, 3].map((i) => (
					<Skeleton key={i} className="h-24 rounded-lg" />
				))}
			</div>
			<div className="grid gap-6 lg:grid-cols-2">
				<Skeleton className="h-72 rounded-lg" />
				<Skeleton className="h-72 rounded-lg" />
			</div>
		</div>
	);
}
