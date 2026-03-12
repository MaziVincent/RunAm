"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import {
	ArrowLeft,
	Star,
	MapPin,
	Phone,
	Clock,
	CheckCircle,
	XCircle,
	Package,
	Store,
} from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api/client";
import {
	cn,
	vendorStatusLabel,
	vendorStatusColor,
	formatCurrency,
} from "@/lib/utils";
import type { VendorDetailDto } from "@/types";
import { VendorStatus } from "@/types";

export default function VendorDetailPage() {
	const params = useParams();
	const router = useRouter();
	const queryClient = useQueryClient();
	const vendorId = params.id as string;

	const { data: res, isLoading } = useQuery({
		queryKey: ["vendor", vendorId],
		queryFn: () => api.get<VendorDetailDto>(`/vendors/${vendorId}`),
		enabled: !!vendorId,
	});

	const vendor = res?.data;

	const approveMutation = useMutation({
		mutationFn: () => api.post(`/vendors/${vendorId}/approve`),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["vendor", vendorId] });
			queryClient.invalidateQueries({ queryKey: ["vendors"] });
		},
	});

	const suspendMutation = useMutation({
		mutationFn: () =>
			api.put(`/vendors/${vendorId}/status`, {
				status: VendorStatus.Suspended,
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["vendor", vendorId] });
			queryClient.invalidateQueries({ queryKey: ["vendors"] });
		},
	});

	if (isLoading) {
		return (
			<div className="flex min-h-[400px] items-center justify-center">
				<div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
			</div>
		);
	}

	if (!vendor) {
		return (
			<div className="text-center py-20">
				<p className="text-slate-500">Vendor not found</p>
				<Link
					href="/vendors"
					className="mt-4 inline-flex items-center gap-2 text-blue-600 hover:text-blue-500">
					<ArrowLeft className="h-4 w-4" /> Back to vendors
				</Link>
			</div>
		);
	}

	const totalProducts =
		vendor.productCategories?.reduce(
			(acc, cat) => acc + (cat.products?.length ?? 0),
			0,
		) ?? 0;

	return (
		<div className="space-y-6">
			{/* Back */}
			<Link
				href="/vendors"
				className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white">
				<ArrowLeft className="h-4 w-4" /> Back to vendors
			</Link>

			{/* Header Card */}
			<div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
					<div className="flex items-start gap-4">
						<div className="flex h-16 w-16 items-center justify-center rounded-xl bg-purple-100 text-2xl font-bold text-purple-700 dark:bg-purple-900/50 dark:text-purple-400">
							{vendor.logoUrl ? (
								<img
									src={vendor.logoUrl}
									alt=""
									className="h-16 w-16 rounded-xl object-cover"
								/>
							) : (
								vendor.businessName
									.split(" ")
									.map((n) => n[0])
									.join("")
									.slice(0, 2)
							)}
						</div>
						<div>
							<h1 className="text-2xl font-bold text-slate-900 dark:text-white">
								{vendor.businessName}
							</h1>
							{vendor.description && (
								<p className="mt-1 max-w-xl text-sm text-slate-500">
									{vendor.description}
								</p>
							)}
							<div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500">
								<span className="flex items-center gap-1">
									<MapPin className="h-4 w-4" /> {vendor.address}
								</span>
								{vendor.phoneNumber && (
									<span className="flex items-center gap-1">
										<Phone className="h-4 w-4" /> {vendor.phoneNumber}
									</span>
								)}
							</div>
							<div className="mt-2 flex flex-wrap gap-1">
								{vendor.serviceCategories?.map((sc) => (
									<span
										key={sc.id}
										className="inline-flex rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
										{sc.name}
									</span>
								))}
							</div>
						</div>
					</div>

					<div className="flex items-center gap-2">
						<span
							className={cn(
								"inline-flex rounded-full px-3 py-1 text-sm font-medium",
								vendorStatusColor[vendor.status],
							)}>
							{vendorStatusLabel[vendor.status]}
						</span>
						{vendor.status === VendorStatus.Pending && (
							<button
								onClick={() => approveMutation.mutate()}
								disabled={approveMutation.isPending}
								className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50">
								<CheckCircle className="h-4 w-4" />
								Approve
							</button>
						)}
						{vendor.status === VendorStatus.Active && (
							<button
								onClick={() => suspendMutation.mutate()}
								disabled={suspendMutation.isPending}
								className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50 dark:bg-red-900/30 dark:text-red-400">
								<XCircle className="h-4 w-4" />
								Suspend
							</button>
						)}
					</div>
				</div>
			</div>

			{/* Stats Grid */}
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
				{[
					{
						label: "Rating",
						value: `⭐ ${vendor.rating.toFixed(1)}`,
						sub: `${vendor.totalReviews} reviews`,
					},
					{
						label: "Total Orders",
						value: vendor.totalOrders.toString(),
						sub: "all time",
					},
					{
						label: "Products",
						value: totalProducts.toString(),
						sub: `${vendor.productCategories?.length ?? 0} categories`,
					},
					{
						label: "Delivery Fee",
						value: formatCurrency(vendor.deliveryFee),
						sub: `Min: ${formatCurrency(vendor.minimumOrderAmount)}`,
					},
					{
						label: "Prep Time",
						value: `${vendor.estimatedPrepTimeMinutes} min`,
						sub: vendor.isOpen ? "🟢 Open now" : "⚫ Closed",
					},
				].map((stat) => (
					<div
						key={stat.label}
						className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
						<p className="text-sm text-slate-500">{stat.label}</p>
						<p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
							{stat.value}
						</p>
						<p className="mt-0.5 text-xs text-slate-400">{stat.sub}</p>
					</div>
				))}
			</div>

			{/* Product Catalog */}
			<div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
				<div className="border-b border-slate-200 px-6 py-4 dark:border-slate-800">
					<h2 className="text-lg font-semibold text-slate-900 dark:text-white">
						Product Catalog
					</h2>
				</div>
				<div className="p-6">
					{!vendor.productCategories ||
					vendor.productCategories.length === 0 ? (
						<p className="py-8 text-center text-sm text-slate-400">
							No products yet
						</p>
					) : (
						<div className="space-y-6">
							{vendor.productCategories.map((category) => (
								<div key={category.id}>
									<h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
										{category.name}
										{!category.isActive && (
											<span className="ml-2 text-xs font-normal text-red-500">
												(Inactive)
											</span>
										)}
									</h3>
									{!category.products || category.products.length === 0 ? (
										<p className="text-sm text-slate-400">
											No products in this category
										</p>
									) : (
										<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
											{category.products.map((product) => (
												<div
													key={product.id}
													className="flex gap-3 rounded-lg border border-slate-100 p-3 dark:border-slate-800">
													{product.imageUrl ? (
														<img
															src={product.imageUrl}
															alt={product.name}
															className="h-16 w-16 rounded-lg object-cover"
														/>
													) : (
														<div className="flex h-16 w-16 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
															<Package className="h-6 w-6 text-slate-400" />
														</div>
													)}
													<div className="flex-1">
														<div className="flex items-start justify-between">
															<p className="font-medium text-slate-900 dark:text-white">
																{product.name}
															</p>
															{!product.isAvailable && (
																<span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-700">
																	Unavailable
																</span>
															)}
														</div>
														{product.description && (
															<p className="mt-0.5 text-xs text-slate-500 line-clamp-2">
																{product.description}
															</p>
														)}
														<div className="mt-1 flex items-center gap-2">
															<span className="text-sm font-semibold text-slate-900 dark:text-white">
																{formatCurrency(product.price)}
															</span>
															{product.compareAtPrice != null &&
																product.compareAtPrice > product.price && (
																	<span className="text-xs text-slate-400 line-through">
																		{formatCurrency(product.compareAtPrice)}
																	</span>
																)}
														</div>
													</div>
												</div>
											))}
										</div>
									)}
								</div>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
