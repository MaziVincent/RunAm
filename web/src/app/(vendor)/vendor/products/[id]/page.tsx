"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
	ArrowLeft,
	Upload,
	Plus,
	X,
	Loader2,
	ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	useMyProducts,
	useMyProductCategories,
	useCreateProduct,
	useUpdateProduct,
} from "@/lib/hooks";
import { toast } from "sonner";

interface Variant {
	name: string;
	priceAdjustment: number;
}

interface Extra {
	name: string;
	price: number;
}

interface ProductForm {
	name: string;
	description: string;
	categoryId: string;
	price: number;
	compareAtPrice: number;
	isAvailable: boolean;
	variants: Variant[];
	extras: Extra[];
}

const emptyForm: ProductForm = {
	name: "",
	description: "",
	categoryId: "",
	price: 0,
	compareAtPrice: 0,
	isAvailable: true,
	variants: [],
	extras: [],
};

export default function ProductEditorPage() {
	const params = useParams();
	const router = useRouter();
	const productId = params.id as string;
	const isNew = productId === "new";

	const { data: productsData } = useMyProducts();
	const { data: categoriesData } = useMyProductCategories();
	const createProduct = useCreateProduct();
	const updateProduct = useUpdateProduct();

	const [form, setForm] = useState<ProductForm>(emptyForm);
	const [initialized, setInitialized] = useState(isNew);

	const categories = categoriesData?.data ?? [];
	const existingProduct = !isNew
		? productsData?.data?.find((p) => p.id === productId)
		: null;

	// Initialize form with existing product data
	useEffect(() => {
		if (existingProduct && !initialized) {
			setForm({
				name: existingProduct.name,
				description: existingProduct.description ?? "",
				categoryId: existingProduct.productCategoryId ?? "",
				price: existingProduct.price,
				compareAtPrice: existingProduct.compareAtPrice ?? 0,
				isAvailable: existingProduct.isAvailable ?? true,
				variants: existingProduct.variantsJson
					? JSON.parse(existingProduct.variantsJson)
					: [],
				extras: existingProduct.extrasJson
					? JSON.parse(existingProduct.extrasJson)
					: [],
			});
			setInitialized(true);
		}
	}, [existingProduct, initialized]);

	function update(key: keyof ProductForm, value: any) {
		setForm((prev) => ({ ...prev, [key]: value }));
	}

	function addVariant() {
		setForm((prev) => ({
			...prev,
			variants: [...prev.variants, { name: "", priceAdjustment: 0 }],
		}));
	}

	function updateVariant(idx: number, key: keyof Variant, value: any) {
		setForm((prev) => ({
			...prev,
			variants: prev.variants.map((v, i) =>
				i === idx ? { ...v, [key]: value } : v,
			),
		}));
	}

	function removeVariant(idx: number) {
		setForm((prev) => ({
			...prev,
			variants: prev.variants.filter((_, i) => i !== idx),
		}));
	}

	function addExtra() {
		setForm((prev) => ({
			...prev,
			extras: [...prev.extras, { name: "", price: 0 }],
		}));
	}

	function updateExtra(idx: number, key: keyof Extra, value: any) {
		setForm((prev) => ({
			...prev,
			extras: prev.extras.map((e, i) =>
				i === idx ? { ...e, [key]: value } : e,
			),
		}));
	}

	function removeExtra(idx: number) {
		setForm((prev) => ({
			...prev,
			extras: prev.extras.filter((_, i) => i !== idx),
		}));
	}

	async function handleSave() {
		if (!form.name) {
			toast.error("Product name required");
			return;
		}
		if (!form.price || form.price < 0) {
			toast.error("Valid price required");
			return;
		}

		const payload = {
			name: form.name,
			description: form.description,
			productCategoryId: form.categoryId || "",
			price: form.price,
			compareAtPrice: form.compareAtPrice || undefined,
			isAvailable: form.isAvailable,
			variantsJson: form.variants.length
				? JSON.stringify(form.variants)
				: undefined,
			extrasJson: form.extras.length
				? JSON.stringify(form.extras)
				: undefined,
		};

		try {
			if (isNew) {
				await createProduct.mutateAsync(payload);
				toast.success("Product created");
			} else {
				await updateProduct.mutateAsync({ id: productId, ...payload });
				toast.success("Product updated");
			}
			router.push("/vendor/products");
		} catch {
			toast.error("Failed to save product");
		}
	}

	const isSaving = createProduct.isPending || updateProduct.isPending;

	return (
		<div className="mx-auto max-w-2xl space-y-6">
			{/* Header */}
			<div className="flex items-center gap-3">
				<Button
					variant="ghost"
					size="icon"
					onClick={() => router.back()}>
					<ArrowLeft className="h-4 w-4" />
				</Button>
				<h1 className="text-xl font-bold">
					{isNew ? "Add Product" : "Edit Product"}
				</h1>
			</div>

			{/* Product Details */}
			<Card>
				<CardHeader>
					<CardTitle className="text-base">Product Details</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<Label>Name *</Label>
						<Input
							value={form.name}
							onChange={(e) => update("name", e.target.value)}
							placeholder="e.g. Chicken & Chips Combo"
						/>
					</div>
					<div className="space-y-2">
						<Label>Description</Label>
						<Textarea
							value={form.description}
							onChange={(e) => update("description", e.target.value)}
							placeholder="Describe the product..."
							rows={3}
						/>
					</div>
					<div className="space-y-2">
						<Label>Category</Label>
						<Select
							value={form.categoryId}
							onValueChange={(v) => update("categoryId", v)}>
							<SelectTrigger className="h-10">
								<SelectValue placeholder="Select category" />
							</SelectTrigger>
							<SelectContent>
								{categories.map((cat) => (
									<SelectItem key={cat.id} value={cat.id}>
										{cat.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-2">
							<Label>Price (₦) *</Label>
							<Input
								type="number"
								value={form.price || ""}
								onChange={(e) =>
									update("price", parseFloat(e.target.value) || 0)
								}
								placeholder="0"
							/>
						</div>
						<div className="space-y-2">
							<Label>Compare at (₦)</Label>
							<Input
								type="number"
								value={form.compareAtPrice || ""}
								onChange={(e) =>
									update(
										"compareAtPrice",
										parseFloat(e.target.value) || 0,
									)
								}
								placeholder="0"
							/>
						</div>
					</div>
					<div className="space-y-2">
						<Label>Image</Label>
						<div className="flex h-32 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed transition-colors hover:border-primary">
							<div className="flex flex-col items-center text-muted-foreground">
								<Upload className="h-8 w-8" />
								<span className="mt-1 text-xs">Upload product image</span>
							</div>
						</div>
					</div>
					<div className="flex items-center justify-between">
						<Label>Available for ordering</Label>
						<Switch
							checked={form.isAvailable}
							onCheckedChange={(v) => update("isAvailable", v)}
						/>
					</div>
				</CardContent>
			</Card>

			{/* Variants */}
			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<CardTitle className="text-base">Variants</CardTitle>
					<Button
						variant="outline"
						size="sm"
						onClick={addVariant}
						className="gap-1">
						<Plus className="h-3.5 w-3.5" />
						Add
					</Button>
				</CardHeader>
				<CardContent>
					{form.variants.length === 0 ? (
						<p className="text-sm text-muted-foreground">
							No variants. Add options like size, flavor, etc.
						</p>
					) : (
						<div className="space-y-2">
							{form.variants.map((variant, idx) => (
								<div key={idx} className="flex items-center gap-2">
									<Input
										placeholder="Option name"
										value={variant.name}
										onChange={(e) =>
											updateVariant(idx, "name", e.target.value)
										}
										className="flex-1"
									/>
									<Input
										type="number"
										placeholder="+ ₦0"
										value={variant.priceAdjustment || ""}
										onChange={(e) =>
											updateVariant(
												idx,
												"priceAdjustment",
												parseFloat(e.target.value) || 0,
											)
										}
										className="w-24"
									/>
									<Button
										variant="ghost"
										size="icon"
										className="h-9 w-9 shrink-0"
										onClick={() => removeVariant(idx)}>
										<X className="h-4 w-4" />
									</Button>
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>

			{/* Extras */}
			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<CardTitle className="text-base">Extras</CardTitle>
					<Button
						variant="outline"
						size="sm"
						onClick={addExtra}
						className="gap-1">
						<Plus className="h-3.5 w-3.5" />
						Add
					</Button>
				</CardHeader>
				<CardContent>
					{form.extras.length === 0 ? (
						<p className="text-sm text-muted-foreground">
							No extras. Add add-ons like toppings, sides, etc.
						</p>
					) : (
						<div className="space-y-2">
							{form.extras.map((extra, idx) => (
								<div key={idx} className="flex items-center gap-2">
									<Input
										placeholder="Extra name"
										value={extra.name}
										onChange={(e) =>
											updateExtra(idx, "name", e.target.value)
										}
										className="flex-1"
									/>
									<Input
										type="number"
										placeholder="₦0"
										value={extra.price || ""}
										onChange={(e) =>
											updateExtra(
												idx,
												"price",
												parseFloat(e.target.value) || 0,
											)
										}
										className="w-24"
									/>
									<Button
										variant="ghost"
										size="icon"
										className="h-9 w-9 shrink-0"
										onClick={() => removeExtra(idx)}>
										<X className="h-4 w-4" />
									</Button>
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>

			{/* Save */}
			<div className="flex justify-end gap-3 pb-4">
				<Button variant="outline" onClick={() => router.back()}>
					Cancel
				</Button>
				<Button onClick={handleSave} disabled={isSaving} className="gap-2">
					{isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
					{isNew ? "Create Product" : "Save Changes"}
				</Button>
			</div>
		</div>
	);
}
