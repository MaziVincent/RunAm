"use client";

import { Star, MessageSquare, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyVendorReviews } from "@/lib/hooks";

const STAR_LABELS = [5, 4, 3, 2, 1];

function RatingDistribution({ reviews }: { reviews: any[] }) {
	const counts = STAR_LABELS.map(
		(s) => reviews.filter((r) => r.rating === s).length,
	);
	const total = reviews.length || 1;
	const avg =
		reviews.length > 0
			? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
			: 0;

	return (
		<Card>
			<CardContent className="p-4">
				<div className="flex items-center gap-6">
					<div className="text-center">
						<p className="text-4xl font-bold">{avg.toFixed(1)}</p>
						<div className="mt-1 flex gap-0.5">
							{[1, 2, 3, 4, 5].map((s) => (
								<Star
									key={s}
									className={`h-4 w-4 ${s <= Math.round(avg) ? "fill-amber-500 text-amber-500" : "text-muted"}`}
								/>
							))}
						</div>
						<p className="mt-1 text-xs text-muted-foreground">
							{reviews.length} reviews
						</p>
					</div>
					<div className="flex-1 space-y-1.5">
						{STAR_LABELS.map((star, idx) => (
							<div key={star} className="flex items-center gap-2">
								<span className="w-3 text-xs text-muted-foreground">
									{star}
								</span>
								<Star className="h-3 w-3 text-amber-500" />
								<div className="flex-1 overflow-hidden rounded-full bg-muted">
									<div
										className="h-2 rounded-full bg-amber-500"
										style={{
											width: `${(counts[idx] / total) * 100}%`,
										}}
									/>
								</div>
								<span className="w-8 text-right text-xs text-muted-foreground">
									{Math.round((counts[idx] / total) * 100)}%
								</span>
							</div>
						))}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

export default function VendorReviewsPage() {
	const { data, isLoading } = useMyVendorReviews();
	const reviews = data?.data ?? [];

	return (
		<div className="space-y-6">
			<h1 className="text-2xl font-bold">Reviews</h1>

			{isLoading ? (
				<div className="space-y-3">
					<Skeleton className="h-32 rounded-xl" />
					{[1, 2, 3].map((i) => (
						<Skeleton key={i} className="h-24 rounded-xl" />
					))}
				</div>
			) : reviews.length === 0 ? (
				<Card>
					<CardContent className="flex flex-col items-center py-12 text-center">
						<Star className="h-10 w-10 text-muted-foreground/30" />
						<p className="mt-3 font-medium">No reviews yet</p>
						<p className="mt-1 text-sm text-muted-foreground">
							Reviews from customers will appear here
						</p>
					</CardContent>
				</Card>
			) : (
				<>
					<RatingDistribution reviews={reviews} />

					<div className="space-y-3">
						{reviews.map((review) => (
							<Card key={review.id}>
								<CardContent className="p-4">
									<div className="flex items-start justify-between">
										<div className="flex items-center gap-3">
											<div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
												<User className="h-4 w-4 text-muted-foreground" />
											</div>
											<div>
												<p className="text-sm font-medium">
													{review.reviewerName || "Customer"}
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
										<div className="flex items-center gap-0.5">
											{[1, 2, 3, 4, 5].map((s) => (
												<Star
													key={s}
													className={`h-3.5 w-3.5 ${s <= review.rating ? "fill-amber-500 text-amber-500" : "text-muted"}`}
												/>
											))}
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
				</>
			)}
		</div>
	);
}
