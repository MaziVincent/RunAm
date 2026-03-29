"use client";

import { useState } from "react";
import Link from "next/link";
import {
	Plus,
	Search,
	Package,
	ToggleLeft,
	ToggleRight,
	Pencil,
	Trash2,
	Loader2,
	ImageIcon,
	ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
	useMyProducts,
	useMyProductCategories,
	useDeleteProduct,
	useToggleProductAvailability,
} from "@/lib/hooks";
import { formatCurrency, cn } from "@/lib/utils";
import { ProductDto } from "@/types";
import { toast } from "sonner";

function ProductCard({ product }: { product: ProductDto }) {
	const [deleteOpen, setDeleteOpen] = useState(false);
	const deleteProduct = useDeleteProduct();
	const toggleAvailability = useToggleProductAvailability();
	const isDeactivated = !product.isActive;

	return (
		<>
			<Card
				className={cn(
					!product.isAvailable && !isDeactivated && "opacity-60",
					isDeactivated && "opacity-50 border-destructive/30",
				)}>
				{isDeactivated && (
					<div className="flex items-center gap-2 border-b border-destructive/20 bg-destructive/5 px-3 py-2">
						<ShieldAlert className="h-3.5 w-3.5 text-destructive" />
						<p className="text-xs text-destructive">
							This product has been deactivated by admin. Contact support.
						</p>
					</div>
				)}
				<CardContent className="flex items-start gap-3 p-3">
					{/* Image */}
					<div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-muted">
						{product.imageUrl ? (
							<img
								src={product.imageUrl}
								alt={product.name}
								className="h-full w-full rounded-lg object-cover"
							/>
						) : (
							<ImageIcon className="h-6 w-6 text-muted-foreground/50" />
						)}
					</div>

					{/* Info */}
					<div className="min-w-0 flex-1">
						<div className="flex items-center gap-2">
							<p className="truncate text-sm font-semibold">{product.name}</p>
							{!product.isAvailable && (
								<Badge variant="secondary" className="text-[10px]">
									Hidden
								</Badge>
							)}
						</div>
						<div className="mt-1 flex items-center gap-2">
							<p className="text-sm font-bold text-primary">
								{formatCurrency(product.price)}
							</p>
							{product.compareAtPrice &&
								product.compareAtPrice > product.price && (
									<p className="text-xs text-muted-foreground line-through">
										{formatCurrency(product.compareAtPrice)}
									</p>
								)}
						</div>
					</div>

					{/* Actions */}
					<div className="flex shrink-0 flex-col items-end gap-2">
						<Switch
							checked={product.isAvailable}
							disabled={isDeactivated}
							onCheckedChange={async () => {
								try {
									await toggleAvailability.mutateAsync({
										id: product.id,
										isAvailable: !product.isAvailable,
									});
									toast.success(
										product.isAvailable ? "Product hidden" : "Product visible",
									);
								} catch {
									toast.error("Failed");
								}
							}}
						/>
						<div className="flex gap-1">
							{!isDeactivated && (
								<Link href={`/vendor/products/${product.id}`}>
									<Button variant="ghost" size="icon" className="h-8 w-8">
										<Pencil className="h-3.5 w-3.5" />
									</Button>
								</Link>
							)}
							<Button
								variant="ghost"
								size="icon"
								className="h-8 w-8 text-destructive hover:text-destructive"
								disabled={isDeactivated}
								onClick={() => setDeleteOpen(true)}>
								<Trash2 className="h-3.5 w-3.5" />
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>

			<AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Product</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete &quot;{product.name}&quot;? This
							action cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={async () => {
								try {
									await deleteProduct.mutateAsync(product.id);
									toast.success("Product deleted");
								} catch {
									toast.error("Failed to delete");
								}
							}}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}

export default function VendorProductsPage() {
	const [search, setSearch] = useState("");
	const { data, isLoading } = useMyProducts();
	const { data: categoriesData } = useMyProductCategories();
	const products = data?.data ?? [];
	const categories = categoriesData?.data ?? [];

	// Build category name lookup
	const categoryMap = categories.reduce(
		(acc, cat) => {
			acc[cat.id] = cat.name;
			return acc;
		},
		{} as Record<string, string>,
	);

	const filtered = search
		? products.filter((p) =>
				p.name.toLowerCase().includes(search.toLowerCase()),
			)
		: products;

	// Group by category
	const grouped = filtered.reduce(
		(acc, product) => {
			const cat = categoryMap[product.productCategoryId] || "Uncategorized";
			if (!acc[cat]) acc[cat] = [];
			acc[cat].push(product);
			return acc;
		},
		{} as Record<string, ProductDto[]>,
	);

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<h1 className="text-2xl font-bold">Products</h1>
				<Link href="/vendor/products/new">
					<Button className="gap-2">
						<Plus className="h-4 w-4" />
						Add Product
					</Button>
				</Link>
			</div>

			{/* Search */}
			<div className="relative">
				<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					placeholder="Search products..."
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					className="pl-9"
				/>
			</div>

			{/* Product List */}
			{isLoading ? (
				<div className="space-y-3">
					{[1, 2, 3, 4].map((i) => (
						<Skeleton key={i} className="h-24 rounded-xl" />
					))}
				</div>
			) : filtered.length === 0 ? (
				<Card>
					<CardContent className="flex flex-col items-center py-12 text-center">
						<Package className="h-10 w-10 text-muted-foreground/30" />
						<p className="mt-3 font-medium">
							{search ? "No matching products" : "No products yet"}
						</p>
						<p className="mt-1 text-sm text-muted-foreground">
							{search
								? "Try a different search term"
								: "Add your first product to start selling"}
						</p>
						{!search && (
							<Link href="/vendor/products/new">
								<Button className="mt-4 gap-2">
									<Plus className="h-4 w-4" />
									Add Product
								</Button>
							</Link>
						)}
					</CardContent>
				</Card>
			) : (
				<div className="space-y-6">
					{Object.entries(grouped).map(([category, products]) => (
						<div key={category}>
							<h3 className="mb-2 text-sm font-semibold text-muted-foreground">
								{category} ({products.length})
							</h3>
							<div className="space-y-2">
								{products.map((product) => (
									<ProductCard key={product.id} product={product} />
								))}
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
