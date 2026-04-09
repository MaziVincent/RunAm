"use client";

import Link from "next/link";
import {
	Store,
	MapPin,
	Clock,
	Phone,
	Star,
	ShoppingBag,
	Settings,
	Package,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useMyVendor } from "@/lib/hooks";
import { formatCurrency } from "@/lib/utils";
import { formatOperatingHoursLabel } from "@/lib/vendor-hours";

export default function VendorStorePage() {
	const { data: vendorRes, isLoading } = useMyVendor();
	const vendor = vendorRes?.data;

	if (isLoading) {
		return (
			<div className="space-y-6">
				<Skeleton className="h-8 w-48" />
				<Skeleton className="h-48 rounded-xl" />
				<Skeleton className="h-64 rounded-xl" />
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">Store Profile</h1>
					<p className="text-sm text-muted-foreground">
						How your store appears to customers
					</p>
				</div>
				<Link href="/vendor/settings">
					<Button variant="outline" className="gap-2">
						<Settings className="h-4 w-4" />
						Edit in Settings
					</Button>
				</Link>
			</div>

			{/* Cover Image + Logo */}
			<Card>
				<CardContent className="p-0">
					<div className="relative h-48 overflow-hidden rounded-t-xl bg-gradient-to-r from-primary/20 to-primary/5">
						{vendor?.bannerUrl ? (
							<img
								src={vendor.bannerUrl}
								alt="Store cover"
								className="h-full w-full object-cover"
							/>
						) : (
							<div className="flex h-full items-center justify-center">
								<p className="text-xs text-muted-foreground">
									No cover image set
								</p>
							</div>
						)}
					</div>

					{/* Logo */}
					<div className="relative -mt-12 ml-6">
						<div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-xl border-4 border-background bg-muted">
							{vendor?.logoUrl ? (
								<img
									src={vendor.logoUrl}
									alt="Store logo"
									className="h-full w-full object-cover"
								/>
							) : (
								<Store className="h-8 w-8 text-muted-foreground" />
							)}
						</div>
					</div>

					<div className="p-6 pt-4">
						<div className="flex items-start justify-between">
							<div>
								<h2 className="text-xl font-bold">
									{vendor?.businessName ?? "Your Store"}
								</h2>
								<div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
									{vendor?.address && (
										<span className="flex items-center gap-1">
											<MapPin className="h-3.5 w-3.5" />
											{vendor.address}
										</span>
									)}
									<span className="flex items-center gap-1">
										<Clock className="h-3.5 w-3.5" />
										{vendor?.isOpen ? "Open Now" : "Closed"}
									</span>
								</div>
							</div>
							<Badge variant={vendor?.isOpen ? "default" : "secondary"}>
								{vendor?.isOpen ? "Open" : "Closed"}
							</Badge>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Details Grid */}
			<div className="grid gap-6 sm:grid-cols-2">
				{/* Business Info */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-base">
							<Store className="h-4 w-4" />
							Business Information
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<InfoRow label="Business Name" value={vendor?.businessName} />
						<Separator />
						<InfoRow
							label="Description"
							value={vendor?.description ?? "No description set"}
						/>
						<Separator />
						<InfoRow
							label="Phone Number"
							value={vendor?.phoneNumber ?? "Not set"}
							icon={<Phone className="h-3.5 w-3.5 text-muted-foreground" />}
						/>
						<Separator />
						<InfoRow
							label="Address"
							value={vendor?.address}
							icon={<MapPin className="h-3.5 w-3.5 text-muted-foreground" />}
						/>
					</CardContent>
				</Card>

				{/* Operations */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-base">
							<Package className="h-4 w-4" />
							Operations
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<InfoRow
							label="Operating Hours"
							value={formatOperatingHoursLabel(vendor?.operatingHours)}
							icon={<Clock className="h-3.5 w-3.5 text-muted-foreground" />}
						/>
						<Separator />
						<InfoRow
							label="Minimum Order"
							value={formatCurrency(vendor?.minimumOrderAmount ?? 0)}
						/>
						<Separator />
						<InfoRow
							label="Avg. Prep Time"
							value={`${vendor?.estimatedPrepTimeMinutes ?? 0} minutes`}
						/>
						<Separator />
						<InfoRow
							label="Rating"
							value={`${vendor?.rating?.toFixed(1) ?? "0.0"} (${vendor?.totalReviews ?? 0} reviews)`}
							icon={<Star className="h-3.5 w-3.5 text-amber-500" />}
						/>
						<Separator />
						<InfoRow
							label="Total Orders"
							value={String(vendor?.totalOrders ?? 0)}
							icon={
								<ShoppingBag className="h-3.5 w-3.5 text-muted-foreground" />
							}
						/>
					</CardContent>
				</Card>
			</div>

			{/* Categories */}
			{vendor?.serviceCategories && vendor.serviceCategories.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle className="text-base">Service Categories</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="flex flex-wrap gap-2">
							{vendor.serviceCategories.map((cat) => (
								<Badge key={cat.id} variant="outline">
									{cat.name}
								</Badge>
							))}
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}

function InfoRow({
	label,
	value,
	icon,
}: {
	label: string;
	value?: string | null;
	icon?: React.ReactNode;
}) {
	return (
		<div>
			<p className="text-xs text-muted-foreground">{label}</p>
			<p className="mt-0.5 flex items-center gap-1.5 text-sm font-medium">
				{icon}
				{value || "—"}
			</p>
		</div>
	);
}
