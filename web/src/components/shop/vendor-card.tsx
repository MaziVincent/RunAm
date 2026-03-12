import Image from "next/image";
import Link from "next/link";
import { Clock, MapPin, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn, formatCurrency } from "@/lib/utils";
import type { VendorDto } from "@/types";

interface VendorCardProps {
	vendor: VendorDto;
	className?: string;
}

export function VendorCard({ vendor, className }: VendorCardProps) {
	return (
		<Link
			href={`/shop/vendors/${vendor.id}`}
			className={cn(
				"group relative flex flex-col overflow-hidden rounded-xl border bg-card transition-all hover:shadow-lg hover:-translate-y-0.5",
				className,
			)}>
			{/* Image */}
			<div className="relative aspect-[16/10] overflow-hidden bg-muted">
				{vendor.bannerUrl || vendor.logoUrl ? (
					<Image
						src={vendor.bannerUrl || vendor.logoUrl || ""}
						alt={vendor.businessName}
						fill
						className="object-cover transition-transform duration-300 group-hover:scale-105"
						sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
					/>
				) : (
					<div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
						<span className="text-4xl font-bold text-primary/30">
							{vendor.businessName[0]}
						</span>
					</div>
				)}

				{/* Open/Closed badge */}
				<div className="absolute left-3 top-3">
					<Badge
						variant={vendor.isOpen ? "success" : "secondary"}
						className="text-xs shadow-sm">
						{vendor.isOpen ? "Open" : "Closed"}
					</Badge>
				</div>

				{/* Vendor logo overlay */}
				{vendor.logoUrl && vendor.bannerUrl && (
					<div className="absolute -bottom-5 left-4">
						<div className="h-10 w-10 overflow-hidden rounded-lg border-2 border-background bg-background shadow-sm">
							<Image
								src={vendor.logoUrl}
								alt=""
								width={40}
								height={40}
								className="object-cover"
							/>
						</div>
					</div>
				)}
			</div>

			{/* Content */}
			<div className="flex flex-1 flex-col p-4 pt-3">
				<h3 className="font-semibold text-card-foreground line-clamp-1">
					{vendor.businessName}
				</h3>

				{/* Category badges */}
				{vendor.serviceCategories.length > 0 && (
					<div className="mt-1.5 flex flex-wrap gap-1">
						{vendor.serviceCategories.slice(0, 2).map((cat) => (
							<span key={cat.id} className="text-xs text-muted-foreground">
								{cat.name}
							</span>
						))}
						{vendor.serviceCategories.length > 2 && (
							<span className="text-xs text-muted-foreground">
								+{vendor.serviceCategories.length - 2}
							</span>
						)}
					</div>
				)}

				{/* Meta row */}
				<div className="mt-auto flex items-center gap-3 pt-3 text-sm text-muted-foreground">
					<span className="flex items-center gap-1">
						<Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
						<span className="font-medium text-foreground">
							{vendor.rating.toFixed(1)}
						</span>
						{vendor.totalReviews > 0 && (
							<span className="text-xs">({vendor.totalReviews})</span>
						)}
					</span>

					<span className="flex items-center gap-1">
						<Clock className="h-3.5 w-3.5" />
						{vendor.estimatedPrepTimeMinutes ?? 20}-
						{(vendor.estimatedPrepTimeMinutes ?? 20) + 15} min
					</span>

					<span className="ml-auto text-xs font-medium">
						{vendor.deliveryFee === 0
							? "Free delivery"
							: `${formatCurrency(vendor.deliveryFee)} delivery`}
					</span>
				</div>
			</div>
		</Link>
	);
}
