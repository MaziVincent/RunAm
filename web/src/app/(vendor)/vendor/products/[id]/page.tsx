"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Upload, Plus, X, Loader2, ImageIcon } from "lucide-react";
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
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	useMyProducts,
	useMyProductCategories,
	useCreateProduct,
	useUpdateProduct,
	useCreateProductCategory,
} from "@/lib/hooks";
import { api } from "@/lib/api/client";
import { toast } from "sonner";

interface VariantOption {
	label: string;
	priceAdjustment: number;
}

interface VariantGroup {
	name: string;
	options: VariantOption[];
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
	variantGroups: VariantGroup[];
	extras: Extra[];
}

const emptyForm: ProductForm = {
	name: "",
	description: "",
	categoryId: "",
	price: 0,
	compareAtPrice: 0,
	isAvailable: true,
	variantGroups: [],
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
	const [imageFile, setImageFile] = useState<File | null>(null);
	const [imagePreview, setImagePreview] = useState<string | null>(null);
	const [uploading, setUploading] = useState(false);
	const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
	const [newCategoryName, setNewCategoryName] = useState("");
	const [newCategoryDescription, setNewCategoryDescription] = useState("");
	const fileInputRef = useRef<HTMLInputElement>(null);
	const createCategory = useCreateProductCategory();

	// Parse variant JSON — handles both grouped and legacy flat format
	function parseVariantGroups(json: string): VariantGroup[] {
		try {
			const parsed = JSON.parse(json);
			if (!Array.isArray(parsed)) return [];
			// Detect grouped format (has .options array)
			if (parsed.length > 0 && Array.isArray(parsed[0]?.options)) {
				return parsed.map((g: any) => ({
					name: g.name ?? "",
					options: Array.isArray(g.options)
						? g.options.map((o: any) => ({
								label: o.label ?? "",
								priceAdjustment: o.priceAdjustment ?? 0,
							}))
						: [],
				}));
			}
			// Legacy flat format: [{ name: "Small", priceAdjustment: 0 }]
			// Convert to a single group called "Options"
			return [
				{
					name: "Options",
					options: parsed.map((v: any) => ({
						label: v.name ?? "",
						priceAdjustment: v.priceAdjustment ?? 0,
					})),
				},
			];
		} catch {
			return [];
		}
	}

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
				variantGroups: existingProduct.variantsJson
					? parseVariantGroups(existingProduct.variantsJson)
					: [],
				extras: existingProduct.extrasJson
					? JSON.parse(existingProduct.extrasJson)
					: [],
			});
			if (existingProduct.imageUrl) {
				setImagePreview(existingProduct.imageUrl);
			}
			setInitialized(true);
		}
	}, [existingProduct, initialized]);

	function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (!file) return;
		if (file.size > 5 * 1024 * 1024) {
			toast.error("Image must be under 5 MB");
			return;
		}
		setImageFile(file);
		setImagePreview(URL.createObjectURL(file));
	}

	function removeImage() {
		setImageFile(null);
		setImagePreview(null);
		if (fileInputRef.current) fileInputRef.current.value = "";
	}

	async function handleCreateCategory() {
		if (!newCategoryName.trim()) {
			toast.error("Category name required");
			return;
		}
		try {
			const res = await createCategory.mutateAsync({
				name: newCategoryName,
				description: newCategoryDescription || undefined,
			});
			if (res?.data?.id) {
				update("categoryId", res.data.id);
			}
			toast.success("Category created");
			setCategoryDialogOpen(false);
			setNewCategoryName("");
			setNewCategoryDescription("");
		} catch {
			toast.error("Failed to create category");
		}
	}

	function update(key: keyof ProductForm, value: any) {
		setForm((prev) => ({ ...prev, [key]: value }));
	}

	function addVariantGroup() {
		setForm((prev) => ({
			...prev,
			variantGroups: [
				...prev.variantGroups,
				{ name: "", options: [{ label: "", priceAdjustment: 0 }] },
			],
		}));
	}

	function removeVariantGroup(gIdx: number) {
		setForm((prev) => ({
			...prev,
			variantGroups: prev.variantGroups.filter((_, i) => i !== gIdx),
		}));
	}

	function updateVariantGroupName(gIdx: number, name: string) {
		setForm((prev) => ({
			...prev,
			variantGroups: prev.variantGroups.map((g, i) =>
				i === gIdx ? { ...g, name } : g,
			),
		}));
	}

	function addVariantOption(gIdx: number) {
		setForm((prev) => ({
			...prev,
			variantGroups: prev.variantGroups.map((g, i) =>
				i === gIdx
					? { ...g, options: [...g.options, { label: "", priceAdjustment: 0 }] }
					: g,
			),
		}));
	}

	function updateVariantOption(
		gIdx: number,
		oIdx: number,
		key: keyof VariantOption,
		value: any,
	) {
		setForm((prev) => ({
			...prev,
			variantGroups: prev.variantGroups.map((g, gi) =>
				gi === gIdx
					? {
							...g,
							options: g.options.map((o, oi) =>
								oi === oIdx ? { ...o, [key]: value } : o,
							),
						}
					: g,
			),
		}));
	}

	function removeVariantOption(gIdx: number, oIdx: number) {
		setForm((prev) => ({
			...prev,
			variantGroups: prev.variantGroups.map((g, gi) =>
				gi === gIdx
					? { ...g, options: g.options.filter((_, oi) => oi !== oIdx) }
					: g,
			),
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

		let imageUrl: string | undefined;

		// Upload image if a new file was selected
		if (imageFile) {
			setUploading(true);
			try {
				const uploadRes = await api.upload<{ url: string }>(
					"/files/product-image",
					imageFile,
				);
				if (!uploadRes.success || !uploadRes.data?.url) {
					toast.error("Image upload failed");
					setUploading(false);
					return;
				}
				imageUrl = uploadRes.data.url;
			} catch {
				toast.error("Image upload failed");
				setUploading(false);
				return;
			}
			setUploading(false);
		} else if (imagePreview && !imageFile) {
			// Keep existing image URL when editing
			imageUrl = imagePreview;
		}

		const payload = {
			name: form.name,
			description: form.description,
			productCategoryId: form.categoryId || "",
			price: form.price,
			compareAtPrice: form.compareAtPrice || undefined,
			imageUrl,
			isAvailable: form.isAvailable,
			sortOrder: existingProduct?.sortOrder ?? 0,
			variantsJson: form.variantGroups.length
				? JSON.stringify(
						form.variantGroups.filter(
							(g) => g.name && g.options.some((o) => o.label),
						),
					)
				: undefined,
			extrasJson: form.extras.length ? JSON.stringify(form.extras) : undefined,
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

	const isSaving =
		createProduct.isPending || updateProduct.isPending || uploading;

	return (
		<div className="mx-auto max-w-2xl space-y-6">
			{/* Header */}
			<div className="flex items-center gap-3">
				<Button variant="ghost" size="icon" onClick={() => router.back()}>
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
						<div className="flex gap-2">
							<Select
								value={form.categoryId}
								onValueChange={(v) => update("categoryId", v)}>
								<SelectTrigger className="h-10 flex-1">
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
							<Button
								type="button"
								variant="outline"
								size="icon"
								className="h-10 w-10 shrink-0"
								onClick={() => setCategoryDialogOpen(true)}
								title="Create new category">
								<Plus className="h-4 w-4" />
							</Button>
						</div>
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
									update("compareAtPrice", parseFloat(e.target.value) || 0)
								}
								placeholder="0"
							/>
						</div>
					</div>
					<div className="space-y-2">
						<Label>Image</Label>
						<input
							ref={fileInputRef}
							type="file"
							accept="image/jpeg,image/png,image/webp,image/gif"
							className="hidden"
							onChange={handleImageSelect}
						/>
						{imagePreview ? (
							<div className="relative h-32 w-32 overflow-hidden rounded-lg border">
								<img
									src={imagePreview}
									alt="Product"
									className="h-full w-full object-cover"
								/>
								<Button
									variant="destructive"
									size="icon"
									className="absolute right-1 top-1 h-6 w-6"
									onClick={removeImage}>
									<X className="h-3 w-3" />
								</Button>
							</div>
						) : (
							<div
								className="flex h-32 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed transition-colors hover:border-primary"
								onClick={() => fileInputRef.current?.click()}>
								<div className="flex flex-col items-center text-muted-foreground">
									<Upload className="h-8 w-8" />
									<span className="mt-1 text-xs">Upload product image</span>
								</div>
							</div>
						)}
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
						onClick={addVariantGroup}
						className="gap-1">
						<Plus className="h-3.5 w-3.5" />
						Add Group
					</Button>
				</CardHeader>
				<CardContent>
					{form.variantGroups.length === 0 ? (
						<p className="text-sm text-muted-foreground">
							No variants. Add variant groups like Size, Flavor, etc.
						</p>
					) : (
						<div className="space-y-4">
							{form.variantGroups.map((group, gIdx) => (
								<div
									key={gIdx}
									className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
									<div className="mb-2 flex items-center gap-2">
										<Input
											placeholder="Group name (e.g. Size)"
											value={group.name}
											onChange={(e) =>
												updateVariantGroupName(gIdx, e.target.value)
											}
											className="flex-1 font-medium"
										/>
										<Button
											variant="ghost"
											size="icon"
											className="h-9 w-9 shrink-0 text-destructive"
											onClick={() => removeVariantGroup(gIdx)}>
											<X className="h-4 w-4" />
										</Button>
									</div>
									<div className="space-y-2 pl-2">
										{group.options.map((opt, oIdx) => (
											<div key={oIdx} className="flex items-center gap-2">
												<span className="text-xs text-muted-foreground">↳</span>
												<Input
													placeholder="Option (e.g. Large)"
													value={opt.label}
													onChange={(e) =>
														updateVariantOption(
															gIdx,
															oIdx,
															"label",
															e.target.value,
														)
													}
													className="flex-1"
												/>
												<Input
													type="number"
													placeholder="+ ₦0"
													value={opt.priceAdjustment || ""}
													onChange={(e) =>
														updateVariantOption(
															gIdx,
															oIdx,
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
													onClick={() => removeVariantOption(gIdx, oIdx)}>
													<X className="h-4 w-4" />
												</Button>
											</div>
										))}
										<Button
											variant="ghost"
											size="sm"
											onClick={() => addVariantOption(gIdx)}
											className="gap-1 text-xs">
											<Plus className="h-3 w-3" />
											Add Option
										</Button>
									</div>
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
										onChange={(e) => updateExtra(idx, "name", e.target.value)}
										className="flex-1"
									/>
									<Input
										type="number"
										placeholder="₦0"
										value={extra.price || ""}
										onChange={(e) =>
											updateExtra(idx, "price", parseFloat(e.target.value) || 0)
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

			{/* Create Category Dialog */}
			<Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>New Category</DialogTitle>
						<DialogDescription>
							Create a new product category for your store.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<div className="space-y-2">
							<Label>Name *</Label>
							<Input
								value={newCategoryName}
								onChange={(e) => setNewCategoryName(e.target.value)}
								placeholder="e.g. Breakfast, Drinks"
							/>
						</div>
						<div className="space-y-2">
							<Label>Description</Label>
							<Input
								value={newCategoryDescription}
								onChange={(e) => setNewCategoryDescription(e.target.value)}
								placeholder="Optional description"
							/>
						</div>
						<div className="flex justify-end gap-2">
							<Button
								variant="outline"
								onClick={() => setCategoryDialogOpen(false)}>
								Cancel
							</Button>
							<Button
								onClick={handleCreateCategory}
								disabled={createCategory.isPending}
								className="gap-2">
								{createCategory.isPending && (
									<Loader2 className="h-4 w-4 animate-spin" />
								)}
								Create
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
