import { useState, useMemo } from "react";
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	ScrollView,
	Image,
	Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useCartStore } from "@runam/shared/stores/cart-store";
import type {
	Product,
	ProductVariant,
	ProductVariantOption,
	ProductExtra,
} from "@runam/shared/types";

export default function ProductDetailScreen() {
	const router = useRouter();
	const params = useLocalSearchParams<{
		productId: string;
		vendorId: string;
		vendorName: string;
		productJson: string;
	}>();

	const product: Product = useMemo(() => {
		try {
			return JSON.parse(params.productJson!);
		} catch {
			return null;
		}
	}, [params.productJson]);

	const addItem = useCartStore((s) => s.addItem);
	const cartVendorId = useCartStore((s) => s.vendorId);

	const variants: ProductVariant[] = useMemo(() => {
		if (!product?.variantsJson) return [];
		try {
			return JSON.parse(product.variantsJson);
		} catch {
			return [];
		}
	}, [product?.variantsJson]);

	const extras: ProductExtra[] = useMemo(() => {
		if (!product?.extrasJson) return [];
		try {
			return JSON.parse(product.extrasJson);
		} catch {
			return [];
		}
	}, [product?.extrasJson]);

	const [quantity, setQuantity] = useState(1);
	const [selectedVariants, setSelectedVariants] = useState<
		Record<string, { name: string; option: ProductVariantOption }>
	>({});
	const [selectedExtras, setSelectedExtras] = useState<Record<string, number>>(
		{},
	);

	if (!product) {
		return (
			<SafeAreaView style={styles.container}>
				<View style={styles.center}>
					<Text style={styles.errorText}>Product not found</Text>
					<TouchableOpacity onPress={() => router.back()}>
						<Text style={styles.linkText}>Go back</Text>
					</TouchableOpacity>
				</View>
			</SafeAreaView>
		);
	}

	const unitPrice = useMemo(() => {
		let price = product.price;
		Object.values(selectedVariants).forEach((v) => {
			price += v.option.priceAdjustment;
		});
		Object.entries(selectedExtras).forEach(([name, qty]) => {
			const extra = extras.find((e) => e.name === name);
			if (extra && qty > 0) {
				price += extra.price * qty;
			}
		});
		return price;
	}, [product.price, selectedVariants, selectedExtras, extras]);

	const totalPrice = unitPrice * quantity;

	const handleAddToCart = () => {
		if (cartVendorId && cartVendorId !== params.vendorId) {
			Alert.alert(
				"Replace cart?",
				"Your cart contains items from a different vendor. Adding this item will clear your current cart.",
				[
					{ text: "Cancel", style: "cancel" },
					{
						text: "Replace",
						style: "destructive",
						onPress: () => doAdd(),
					},
				],
			);
			return;
		}
		doAdd();
	};

	const doAdd = () => {
		// Build selected variant (first one if any)
		const variantEntries = Object.values(selectedVariants);
		const selectedVariant =
			variantEntries.length > 0 ? variantEntries[0] : null;

		const extrasArr = Object.entries(selectedExtras)
			.filter(([, qty]) => qty > 0)
			.map(([name, qty]) => ({
				extra: extras.find((e) => e.name === name)!,
				quantity: qty,
			}))
			.filter((e) => e.extra);

		addItem(
			params.vendorId!,
			params.vendorName!,
			product,
			quantity,
			selectedVariant,
			extrasArr.length > 0 ? extrasArr : undefined,
		);
		router.back();
	};

	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<ScrollView showsVerticalScrollIndicator={false}>
				{/* Image */}
				{product.imageUrl ? (
					<Image source={{ uri: product.imageUrl }} style={styles.image} />
				) : (
					<View style={styles.imagePlaceholder}>
						<Text style={{ fontSize: 64 }}>📦</Text>
					</View>
				)}

				{/* Back button */}
				<TouchableOpacity
					style={styles.backOverlay}
					onPress={() => router.back()}>
					<Text style={styles.backIcon}>‹</Text>
				</TouchableOpacity>

				{/* Product Info */}
				<View style={styles.infoSection}>
					<Text style={styles.productName}>{product.name}</Text>
					{product.description ? (
						<Text style={styles.productDesc}>{product.description}</Text>
					) : null}
					<View style={styles.priceRow}>
						<Text style={styles.price}>₦{product.price.toLocaleString()}</Text>
						{product.compareAtPrice != null &&
							product.compareAtPrice > product.price && (
								<Text style={styles.comparePrice}>
									₦{product.compareAtPrice.toLocaleString()}
								</Text>
							)}
					</View>
				</View>

				{/* Variants */}
				{variants.map((variant) => (
					<View key={variant.name} style={styles.optionSection}>
						<Text style={styles.optionTitle}>{variant.name}</Text>
						<View style={styles.optionRow}>
							{variant.options.map((option) => {
								const isSelected =
									selectedVariants[variant.name]?.option.label === option.label;
								return (
									<TouchableOpacity
										key={option.label}
										style={[
											styles.optionChip,
											isSelected && styles.optionChipActive,
										]}
										onPress={() =>
											setSelectedVariants((prev) => ({
												...prev,
												[variant.name]: { name: variant.name, option },
											}))
										}>
										<Text
											style={[
												styles.optionChipText,
												isSelected && styles.optionChipTextActive,
											]}>
											{option.label}
											{option.priceAdjustment !== 0 &&
												` (+₦${option.priceAdjustment.toLocaleString()})`}
										</Text>
									</TouchableOpacity>
								);
							})}
						</View>
					</View>
				))}

				{/* Extras */}
				{extras.length > 0 && (
					<View style={styles.optionSection}>
						<Text style={styles.optionTitle}>Extras</Text>
						{extras.map((extra) => {
							const qty = selectedExtras[extra.name] ?? 0;
							return (
								<View key={extra.name} style={styles.extraRow}>
									<View style={{ flex: 1 }}>
										<Text style={styles.extraName}>{extra.name}</Text>
										<Text style={styles.extraPrice}>
											+₦{extra.price.toLocaleString()}
										</Text>
									</View>
									<View style={styles.qtyControl}>
										<TouchableOpacity
											style={styles.qtyBtn}
											onPress={() =>
												setSelectedExtras((prev) => ({
													...prev,
													[extra.name]: Math.max(0, qty - 1),
												}))
											}>
											<Text style={styles.qtyBtnText}>−</Text>
										</TouchableOpacity>
										<Text style={styles.qtyText}>{qty}</Text>
										<TouchableOpacity
											style={styles.qtyBtn}
											onPress={() =>
												setSelectedExtras((prev) => ({
													...prev,
													[extra.name]: Math.min(
														extra.maxQuantity ?? 10,
														qty + 1,
													),
												}))
											}>
											<Text style={styles.qtyBtnText}>+</Text>
										</TouchableOpacity>
									</View>
								</View>
							);
						})}
					</View>
				)}

				{/* Quantity */}
				<View style={styles.optionSection}>
					<Text style={styles.optionTitle}>Quantity</Text>
					<View style={styles.quantityRow}>
						<TouchableOpacity
							style={styles.qtyBtnLg}
							onPress={() => setQuantity((q) => Math.max(1, q - 1))}>
							<Text style={styles.qtyBtnLgText}>−</Text>
						</TouchableOpacity>
						<Text style={styles.quantityText}>{quantity}</Text>
						<TouchableOpacity
							style={styles.qtyBtnLg}
							onPress={() => setQuantity((q) => q + 1)}>
							<Text style={styles.qtyBtnLgText}>+</Text>
						</TouchableOpacity>
					</View>
				</View>

				<View style={{ height: 120 }} />
			</ScrollView>

			{/* Add to Cart Button */}
			<View style={styles.bottomBar}>
				<TouchableOpacity
					style={[styles.addBtn, !product.isAvailable && styles.addBtnDisabled]}
					activeOpacity={0.8}
					disabled={!product.isAvailable}
					onPress={handleAddToCart}>
					<Text style={styles.addBtnText}>
						{product.isAvailable
							? `Add to Cart · ₦${totalPrice.toLocaleString()}`
							: "Currently Unavailable"}
					</Text>
				</TouchableOpacity>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#FFFFFF",
	},
	center: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	errorText: {
		fontSize: 16,
		color: "#6B7280",
		fontWeight: "600",
	},
	linkText: {
		fontSize: 15,
		color: "#3B82F6",
		fontWeight: "600",
		marginTop: 8,
	},
	image: {
		width: "100%",
		height: 280,
	},
	imagePlaceholder: {
		width: "100%",
		height: 280,
		backgroundColor: "#F3F4F6",
		alignItems: "center",
		justifyContent: "center",
	},
	backOverlay: {
		position: "absolute",
		top: 12,
		left: 12,
		width: 36,
		height: 36,
		borderRadius: 18,
		backgroundColor: "rgba(255,255,255,0.92)",
		alignItems: "center",
		justifyContent: "center",
	},
	backIcon: {
		fontSize: 24,
		color: "#374151",
		fontWeight: "300",
		marginTop: -2,
	},
	infoSection: {
		padding: 20,
		borderBottomWidth: 1,
		borderBottomColor: "#F3F4F6",
	},
	productName: {
		fontSize: 22,
		fontWeight: "800",
		color: "#111827",
	},
	productDesc: {
		fontSize: 14,
		color: "#6B7280",
		marginTop: 6,
		lineHeight: 20,
	},
	priceRow: {
		flexDirection: "row",
		alignItems: "center",
		marginTop: 10,
		gap: 8,
	},
	price: {
		fontSize: 20,
		fontWeight: "800",
		color: "#111827",
	},
	comparePrice: {
		fontSize: 16,
		color: "#9CA3AF",
		textDecorationLine: "line-through",
	},
	optionSection: {
		padding: 20,
		borderBottomWidth: 1,
		borderBottomColor: "#F3F4F6",
	},
	optionTitle: {
		fontSize: 16,
		fontWeight: "700",
		color: "#111827",
		marginBottom: 12,
	},
	optionRow: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 8,
	},
	optionChip: {
		paddingHorizontal: 16,
		paddingVertical: 10,
		borderRadius: 12,
		borderWidth: 1.5,
		borderColor: "#E5E7EB",
		backgroundColor: "#FFFFFF",
	},
	optionChipActive: {
		borderColor: "#3B82F6",
		backgroundColor: "#EFF6FF",
	},
	optionChipText: {
		fontSize: 14,
		fontWeight: "600",
		color: "#6B7280",
	},
	optionChipTextActive: {
		color: "#3B82F6",
	},
	extraRow: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 12,
	},
	extraName: {
		fontSize: 14,
		fontWeight: "600",
		color: "#374151",
	},
	extraPrice: {
		fontSize: 12,
		color: "#6B7280",
		marginTop: 1,
	},
	qtyControl: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
	},
	qtyBtn: {
		width: 32,
		height: 32,
		borderRadius: 8,
		backgroundColor: "#F3F4F6",
		alignItems: "center",
		justifyContent: "center",
	},
	qtyBtnText: {
		fontSize: 18,
		fontWeight: "600",
		color: "#374151",
	},
	qtyText: {
		fontSize: 15,
		fontWeight: "700",
		color: "#111827",
		minWidth: 24,
		textAlign: "center",
	},
	quantityRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 24,
	},
	qtyBtnLg: {
		width: 44,
		height: 44,
		borderRadius: 12,
		backgroundColor: "#F3F4F6",
		alignItems: "center",
		justifyContent: "center",
	},
	qtyBtnLgText: {
		fontSize: 22,
		fontWeight: "600",
		color: "#374151",
	},
	quantityText: {
		fontSize: 22,
		fontWeight: "800",
		color: "#111827",
		minWidth: 40,
		textAlign: "center",
	},
	bottomBar: {
		position: "absolute",
		bottom: 0,
		left: 0,
		right: 0,
		padding: 16,
		paddingBottom: 32,
		backgroundColor: "rgba(255,255,255,0.97)",
		borderTopWidth: 1,
		borderTopColor: "#F3F4F6",
	},
	addBtn: {
		backgroundColor: "#3B82F6",
		paddingVertical: 16,
		borderRadius: 14,
		alignItems: "center",
	},
	addBtnDisabled: {
		backgroundColor: "#D1D5DB",
	},
	addBtnText: {
		fontSize: 16,
		fontWeight: "700",
		color: "#FFFFFF",
	},
});
