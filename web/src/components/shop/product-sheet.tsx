"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { Minus, Plus, ShoppingCart, Package, X } from "lucide-react";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
	useCartStore,
	type CartItemVariant,
	type CartItemExtra,
} from "@/lib/stores/cart-store";
import { formatCurrency, cn } from "@/lib/utils";
import { toast } from "sonner";
import { VendorSwitchDialog } from "@/components/shop/vendor-switch-dialog";
import type { ProductDto } from "@/types";

/* ------------------------------------------------------------------ */
/*  Parse variant/extras JSON from product                            */
/* ------------------------------------------------------------------ */
interface VariantOption {
	name: string;
	options: { label: string; priceAdjustment: number }[];
}

interface ExtraOption {
	name: string;
	price: number;
}

function parseVariants(json: string | null): VariantOption[] {
	if (!json) return [];
	try {
		const parsed = JSON.parse(json);
		if (!Array.isArray(parsed)) return [];
		return parsed.map((v: any) => ({
			name: v.name ?? "",
			options: Array.isArray(v.options) ? v.options : [],
		}));
	} catch {
		return [];
	}
}

function parseExtras(json: string | null): ExtraOption[] {
	if (!json) return [];
	try {
		const parsed = JSON.parse(json);
		if (!Array.isArray(parsed)) return [];
		return parsed.filter(
			(e: any) => typeof e.name === "string" && typeof e.price === "number",
		);
	} catch {
		return [];
	}
}

/* ------------------------------------------------------------------ */
/*  Product Sheet                                                     */
/* ------------------------------------------------------------------ */
interface ProductSheetProps {
	product: ProductDto | null;
	vendor: { id: string; name: string; isOpen: boolean };
	onClose: () => void;
}

export function ProductSheet({ product, vendor, onClose }: ProductSheetProps) {
	const addItem = useCartStore((s) => s.addItem);
	const cartVendorId = useCartStore((s) => s.vendorId);
	const cartVendorName = useCartStore((s) => s.vendorName);
	const cartItemCount = useCartStore((s) => s.getItemCount());

	// Local state resets when product changes
	const [quantity, setQuantity] = useState(1);
	const [selectedVariant, setSelectedVariant] = useState<string>("");
	const [selectedExtras, setSelectedExtras] = useState<Set<string>>(new Set());
	const [notes, setNotes] = useState("");
	const [showVendorSwitch, setShowVendorSwitch] = useState(false);

	// Reset when product changes
	useEffect(() => {
		if (product) {
			setQuantity(1);
			setSelectedVariant("");
			setSelectedExtras(new Set());
			setNotes("");
		}
	}, [product?.id]);

	const variantsJson = product?.variantsJson ?? null;
	const extrasJson = product?.extrasJson ?? null;

	const variants = useMemo(() => parseVariants(variantsJson), [variantsJson]);
	const extras = useMemo(() => parseExtras(extrasJson), [extrasJson]);

	// Find selected variant details
	const activeVariant = useMemo(() => {
		if (!selectedVariant) return null;
		for (const v of variants) {
			const opt = v.options.find((o) => o.label === selectedVariant);
			if (opt) {
				return {
					name: v.name,
					option: opt.label,
					priceAdjustment: opt.priceAdjustment,
				} satisfies CartItemVariant;
			}
		}
		return null;
	}, [selectedVariant, variants]);

	// Active extras
	const activeExtras: CartItemExtra[] = useMemo(() => {
		return extras
			.filter((e) => selectedExtras.has(e.name))
			.map((e) => ({ name: e.name, price: e.price }));
	}, [selectedExtras, extras]);

	if (!product) return null;

	// Calculate total
	const basePrice = product.price;
	const variantAdj = activeVariant?.priceAdjustment ?? 0;
	const extrasTotal = activeExtras.reduce((s, e) => s + e.price, 0);
	const lineTotal = (basePrice + variantAdj + extrasTotal) * quantity;

	const requiresVariant = variants.length > 0;
	const canAdd =
		product.isAvailable &&
		vendor.isOpen &&
		(!requiresVariant || !!selectedVariant);

	function handleToggleExtra(name: string) {
		setSelectedExtras((prev) => {
			const next = new Set(prev);
			if (next.has(name)) next.delete(name);
			else next.add(name);
			return next;
		});
	}

	function doAddToCart() {
		if (!product) return;

		addItem(
			vendor.id,
			vendor.name,
			product,
			quantity,
			activeVariant,
			activeExtras,
			notes.trim(),
		);

		toast.success(`${product.name} added to cart`, {
			description: `${quantity}× — ${formatCurrency(lineTotal)}`,
		});

		onClose();
	}

	function handleAddToCart() {
		if (!canAdd) return;

		// Check if switching vendors
		if (cartVendorId && cartVendorId !== vendor.id && cartItemCount > 0) {
			setShowVendorSwitch(true);
			return;
		}

		doAddToCart();
	}

	return (
		<Sheet open={!!product} onOpenChange={(open) => !open && onClose()}>
			<SheetContent
				side="bottom"
				className="max-h-[90vh] overflow-y-auto rounded-t-2xl sm:max-w-lg sm:mx-auto pb-0">
				<SheetHeader className="pb-0">
					<div className="flex items-start justify-between">
						<SheetTitle className="text-left text-lg">
							{product.name}
						</SheetTitle>
					</div>
				</SheetHeader>

				{/* Product Image */}
				{product.imageUrl && (
					<div className="relative mt-3 aspect-video w-full overflow-hidden rounded-lg">
						<Image
							src={product.imageUrl}
							alt={product.name}
							fill
							sizes="(max-width: 640px) 100vw, 32rem"
							className="object-cover"
						/>
					</div>
				)}

				{/* Description + Price */}
				<div className="mt-3">
					{product.description && (
						<p className="text-sm text-muted-foreground">
							{product.description}
						</p>
					)}
					<div className="mt-2 flex items-center gap-2">
						<span className="text-lg font-bold">
							{formatCurrency(product.price)}
						</span>
						{product.compareAtPrice && (
							<span className="text-sm text-muted-foreground line-through">
								{formatCurrency(product.compareAtPrice)}
							</span>
						)}
					</div>
				</div>

				<Separator className="my-4" />

				{/* Variants */}
				{variants.map((v) => (
					<div key={v.name} className="mb-4">
						<Label className="mb-2 block text-sm font-semibold">
							{v.name}{" "}
							<span className="text-xs font-normal text-destructive">
								(Required)
							</span>
						</Label>
						<RadioGroup
							value={selectedVariant}
							onValueChange={setSelectedVariant}>
							{v.options.map((opt) => (
								<label
									key={opt.label}
									className={cn(
										"flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors",
										selectedVariant === opt.label
											? "border-primary bg-primary/5"
											: "hover:bg-accent",
									)}>
									<RadioGroupItem value={opt.label} />
									<span className="flex-1 text-sm">{opt.label}</span>
									{opt.priceAdjustment !== 0 && (
										<span className="text-sm text-muted-foreground">
											{opt.priceAdjustment > 0 ? "+" : ""}
											{formatCurrency(opt.priceAdjustment)}
										</span>
									)}
								</label>
							))}
						</RadioGroup>
					</div>
				))}

				{/* Extras */}
				{extras.length > 0 && (
					<div className="mb-4">
						<Label className="mb-2 block text-sm font-semibold">
							Extras{" "}
							<span className="text-xs font-normal text-muted-foreground">
								(Optional)
							</span>
						</Label>
						<div className="space-y-2">
							{extras.map((ext) => (
								<label
									key={ext.name}
									className={cn(
										"flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors",
										selectedExtras.has(ext.name)
											? "border-primary bg-primary/5"
											: "hover:bg-accent",
									)}>
									<Checkbox
										checked={selectedExtras.has(ext.name)}
										onCheckedChange={() => handleToggleExtra(ext.name)}
									/>
									<span className="flex-1 text-sm">{ext.name}</span>
									<span className="text-sm text-muted-foreground">
										+{formatCurrency(ext.price)}
									</span>
								</label>
							))}
						</div>
					</div>
				)}

				{/* Special Instructions */}
				<div className="mb-4">
					<Label htmlFor="notes" className="mb-2 block text-sm font-semibold">
						Special Instructions{" "}
						<span className="text-xs font-normal text-muted-foreground">
							(Optional)
						</span>
					</Label>
					<Textarea
						id="notes"
						value={notes}
						onChange={(e) => setNotes(e.target.value)}
						placeholder="e.g. No onions, extra spicy..."
						rows={2}
						className="resize-none"
					/>
				</div>

				{/* Quantity + Add to Cart */}
				<div className="sticky bottom-0 border-t bg-background pb-6 pt-4">
					<div className="flex items-center gap-4">
						{/* Quantity selector */}
						<div className="flex items-center rounded-lg border">
							<Button
								variant="ghost"
								size="icon"
								className="h-10 w-10"
								disabled={quantity <= 1}
								onClick={() => setQuantity((q) => Math.max(1, q - 1))}>
								<Minus className="h-4 w-4" />
							</Button>
							<span className="w-10 text-center font-semibold">{quantity}</span>
							<Button
								variant="ghost"
								size="icon"
								className="h-10 w-10"
								onClick={() => setQuantity((q) => q + 1)}>
								<Plus className="h-4 w-4" />
							</Button>
						</div>

						{/* Add to cart button */}
						<Button
							className="flex-1 gap-2"
							size="lg"
							disabled={!canAdd}
							onClick={handleAddToCart}>
							<ShoppingCart className="h-4 w-4" />
							Add to Cart — {formatCurrency(lineTotal)}
						</Button>
					</div>

					{/* Vendor closed warning */}
					{!vendor.isOpen && (
						<p className="mt-2 text-center text-xs text-destructive">
							This vendor is currently closed
						</p>
					)}

					{/* Variant required hint */}
					{requiresVariant && !selectedVariant && (
						<p className="mt-2 text-center text-xs text-muted-foreground">
							Please select a variant to continue
						</p>
					)}
				</div>
			</SheetContent>

			{/* Vendor switch confirmation */}
			<VendorSwitchDialog
				open={showVendorSwitch}
				currentVendor={cartVendorName}
				newVendor={vendor.name}
				onConfirm={() => {
					setShowVendorSwitch(false);
					doAddToCart();
				}}
				onCancel={() => setShowVendorSwitch(false)}
			/>
		</Sheet>
	);
}
