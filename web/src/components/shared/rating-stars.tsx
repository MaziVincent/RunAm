import { Star, StarHalf } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingStarsProps {
	rating: number;
	maxRating?: number;
	size?: "sm" | "md" | "lg";
	showValue?: boolean;
	totalReviews?: number;
	className?: string;
}

const sizeMap = {
	sm: "h-3 w-3",
	md: "h-4 w-4",
	lg: "h-5 w-5",
};

export function RatingStars({
	rating,
	maxRating = 5,
	size = "md",
	showValue = false,
	totalReviews,
	className,
}: RatingStarsProps) {
	const fullStars = Math.floor(rating);
	const hasHalf = rating - fullStars >= 0.5;
	const emptyStars = maxRating - fullStars - (hasHalf ? 1 : 0);

	return (
		<div className={cn("flex items-center gap-1", className)}>
			<div className="flex">
				{Array.from({ length: fullStars }).map((_, i) => (
					<Star
						key={`full-${i}`}
						className={cn(sizeMap[size], "fill-yellow-400 text-yellow-400")}
					/>
				))}
				{hasHalf && (
					<StarHalf
						className={cn(sizeMap[size], "fill-yellow-400 text-yellow-400")}
					/>
				)}
				{Array.from({ length: emptyStars }).map((_, i) => (
					<Star
						key={`empty-${i}`}
						className={cn(sizeMap[size], "text-muted-foreground/30")}
					/>
				))}
			</div>
			{showValue && (
				<span className="text-sm font-medium">{rating.toFixed(1)}</span>
			)}
			{totalReviews !== undefined && (
				<span className="text-sm text-muted-foreground">
					({totalReviews})
				</span>
			)}
		</div>
	);
}
