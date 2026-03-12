"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
	Package,
	Search,
	Filter,
	Plus,
	ArrowRight,
	Truck,
	Clock,
	CheckCircle2,
	XCircle,
	ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMyErrands } from "@/lib/hooks";
import {
	formatCurrency,
	errandStatusLabel,
	errandStatusColor,
	errandCategoryLabel,
} from "@/lib/utils";
import type { ErrandDto } from "@/types";

const STATUS_TABS = [
	{ value: "all", label: "All" },
	{ value: "active", label: "Active" },
	{ value: "completed", label: "Completed" },
	{ value: "cancelled", label: "Cancelled" },
] as const;

function ErrandCard({ errand }: { errand: ErrandDto }) {
	return (
		<Link href={`/dashboard/errands/${errand.id}`}>
			<Card className="transition-all hover:shadow-md">
				<CardContent className="flex items-start gap-3 p-4">
					<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
						<Truck className="h-5 w-5 text-primary" />
					</div>
					<div className="min-w-0 flex-1">
						<div className="flex items-start justify-between gap-2">
							<div className="min-w-0">
								<p className="truncate text-sm font-semibold">
									{errand.vendorName
										? `Order from ${errand.vendorName}`
										: errandCategoryLabel[errand.category]}
								</p>
								<p className="mt-0.5 truncate text-xs text-muted-foreground">
									To: {errand.dropoffAddress}
								</p>
							</div>
							<Badge
								className={`${errandStatusColor[errand.status]} shrink-0 text-[10px]`}>
								{errandStatusLabel[errand.status]}
							</Badge>
						</div>

						<div className="mt-2 flex items-center justify-between">
							<div className="flex items-center gap-3 text-xs text-muted-foreground">
								<span>
									{new Date(errand.createdAt).toLocaleDateString("en-NG", {
										month: "short",
										day: "numeric",
										year: "numeric",
									})}
								</span>
								{errand.riderName && <span>Rider: {errand.riderName}</span>}
							</div>
							<span className="text-sm font-bold">
								{formatCurrency(errand.totalAmount)}
							</span>
						</div>
					</div>
				</CardContent>
			</Card>
		</Link>
	);
}

export default function ErrandsPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const activeTab = searchParams.get("status") ?? "all";
	const page = parseInt(searchParams.get("page") ?? "1", 10);

	const statusMap: Record<string, string | undefined> = {
		all: undefined,
		active: "active",
		completed: "completed",
		cancelled: "cancelled",
	};

	const { data, isLoading } = useMyErrands({
		status: statusMap[activeTab],
		page,
		pageSize: 10,
	});

	const errands = data?.data ?? [];
	const pagination = data?.meta;

	function updateParam(key: string, value: string) {
		const sp = new URLSearchParams(searchParams.toString());
		sp.set(key, value);
		if (key !== "page") sp.set("page", "1");
		router.push(`?${sp.toString()}`, { scroll: false });
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">My Errands</h1>
					<p className="text-sm text-muted-foreground">
						Track and manage your deliveries
					</p>
				</div>
				<Button asChild className="gap-2">
					<Link href="/dashboard/errands/new">
						<Plus className="h-4 w-4" />
						<span className="hidden sm:inline">New Errand</span>
					</Link>
				</Button>
			</div>

			{/* Tabs */}
			<Tabs
				value={activeTab}
				onValueChange={(val) => updateParam("status", val)}>
				<TabsList className="w-full sm:w-auto">
					{STATUS_TABS.map((tab) => (
						<TabsTrigger
							key={tab.value}
							value={tab.value}
							className="flex-1 sm:flex-none">
							{tab.label}
						</TabsTrigger>
					))}
				</TabsList>
			</Tabs>

			{/* List */}
			{isLoading ? (
				<div className="space-y-3">
					{[1, 2, 3, 4].map((i) => (
						<Skeleton key={i} className="h-24 rounded-xl" />
					))}
				</div>
			) : errands.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-20 text-center">
					<Package className="h-16 w-16 text-muted-foreground/30" />
					<h3 className="mt-4 text-lg font-semibold">No errands found</h3>
					<p className="mt-1 text-sm text-muted-foreground">
						{activeTab === "all"
							? "You haven't placed any errands yet"
							: `No ${activeTab} errands`}
					</p>
					<Button asChild className="mt-4 gap-2">
						<Link href="/dashboard/errands/new">
							<Plus className="h-4 w-4" />
							Create Errand
						</Link>
					</Button>
				</div>
			) : (
				<div className="space-y-3">
					{errands.map((errand) => (
						<ErrandCard key={errand.id} errand={errand} />
					))}
				</div>
			)}

			{/* Pagination */}
			{pagination && pagination.totalPages > 1 && (
				<div className="flex items-center justify-center gap-2">
					<Button
						variant="outline"
						disabled={page <= 1}
						onClick={() => updateParam("page", String(page - 1))}>
						Previous
					</Button>
					<span className="text-sm text-muted-foreground">
						Page {page} of {pagination.totalPages}
					</span>
					<Button
						variant="outline"
						disabled={page >= pagination.totalPages}
						onClick={() => updateParam("page", String(page + 1))}>
						Next
					</Button>
				</div>
			)}
		</div>
	);
}
