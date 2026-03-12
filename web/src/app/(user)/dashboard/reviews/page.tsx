"use client";

import { Star, MessageSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyReviews } from "@/lib/hooks";
import { formatCurrency } from "@/lib/utils";

export default function ReviewsPage() {
	const { data, isLoading } = useMyReviews();
	const reviews = data?.data ?? [];

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold">My Reviews</h1>
				<p className="text-sm text-muted-foreground">
					Reviews you&apos;ve left for vendors and riders
				</p>
			</div>

			{isLoading ? (
				<div className="space-y-3">
					{[1, 2, 3].map((i) => (
						<Skeleton key={i} className="h-28 rounded-xl" />
					))}
				</div>
			) : reviews.length === 0 ? (
				<Card>
					<CardContent className="flex flex-col items-center py-12 text-center">
						<Star className="h-10 w-10 text-muted-foreground/30" />
						<p className="mt-3 font-medium">No reviews yet</p>
						<p className="mt-1 text-sm text-muted-foreground">
							Your reviews will appear here after you complete errands or orders
						</p>
					</CardContent>
				</Card>
			) : (
				<div className="space-y-3">
					{reviews.map((review) => (
						<Card key={review.id}>
							<CardContent className="p-4">
								<div className="flex items-start justify-between">
									<div className="flex items-center gap-3">
										<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
											<Star className="h-4 w-4 text-muted-foreground" />
										</div>
										<div>
											<p className="font-medium">
												{review.revieweeName || "Review"}
											</p>
											<p className="text-xs text-muted-foreground">
												{new Date(review.createdAt).toLocaleDateString(
													"en-NG",
													{
														year: "numeric",
														month: "short",
														day: "numeric",
													},
												)}
											</p>
										</div>
									</div>
									<div className="flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 dark:bg-amber-950/50">
										<Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
										<span className="text-sm font-semibold text-amber-700 dark:text-amber-400">
											{review.rating}
										</span>
									</div>
								</div>
								{review.comment && (
									<div className="mt-3 flex items-start gap-2">
										<MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
										<p className="text-sm text-muted-foreground">
											{review.comment}
										</p>
									</div>
								)}
							</CardContent>
						</Card>
					))}
				</div>
			)}
		</div>
	);
}
