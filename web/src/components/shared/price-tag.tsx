import { cn, formatCurrency } from "@/lib/utils";

interface PriceTagProps {
	price: number;
	compareAtPrice?: number | null;
	size?: "sm" | "md" | "lg";
	className?: string;
}

const sizeClasses = {
	sm: "text-sm",
	md: "text-base",
	lg: "text-xl",
};

export function PriceTag({
	price,
	compareAtPrice,
	size = "md",
	className,
}: PriceTagProps) {
	const hasDiscount = compareAtPrice && compareAtPrice > price;

	return (
		<span className={cn("inline-flex items-center gap-1.5", className)}>
			<span
				className={cn(
					"font-semibold text-foreground",
					sizeClasses[size],
					hasDiscount && "text-primary",
				)}>
				{formatCurrency(price)}
			</span>
			{hasDiscount && (
				<span
					className={cn(
						"text-muted-foreground line-through",
						size === "sm" ? "text-xs" : "text-sm",
					)}>
					{formatCurrency(compareAtPrice)}
				</span>
			)}
		</span>
	);
}
