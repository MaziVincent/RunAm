import { useMemo, useState } from "react";
import {
	Alert,
	Image,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useCartStore } from "@runam/shared/stores/cart-store";
import type {
	Product,
	ProductExtra,
	ProductVariant,
	ProductVariantOption,
} from "@runam/shared/types";

function formatCurrency(amount: number): string {
	return `₦${amount.toLocaleString()}`;
}

export default function ProductDetailScreen() {
	const router = useRouter();
	const params = useLocalSearchParams<{
		productId: string;
		vendorId: string;
		vendorName: string;
		productJson: string;
	}>();

	const product = useMemo<Product | null>(() => {
		try {
			return JSON.parse(params.productJson!);
		} catch {
			return null;
		}
	}, [params.productJson]);

	const addItem = useCartStore((state) => state.addItem);
	const cartVendorId = useCartStore((state) => state.vendorId);
	const cartCount = useCartStore((state) => state.getItemCount());

	const variants = useMemo<ProductVariant[]>(() => {
		if (!product?.variantsJson) {
			return [];
		}
		try {
			return JSON.parse(product.variantsJson);
		} catch {
			return [];
		}
	}, [product?.variantsJson]);

	const extras = useMemo<ProductExtra[]>(() => {
		if (!product?.extrasJson) {
			return [];
		}
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
				<View style={styles.centered}>
					<Text style={styles.emptyTitle}>Product not found</Text>
					<TouchableOpacity onPress={() => router.back()} activeOpacity={0.8}>
						<Text style={styles.linkText}>Go back</Text>
					</TouchableOpacity>
				</View>
			</SafeAreaView>
		);
	}

	const requiredVariants = variants.filter(
		(variant) => variant.options.length > 0,
	);
	const missingRequiredVariantNames = requiredVariants
		.filter((variant) => !selectedVariants[variant.name])
		.map((variant) => variant.name);

	const unitPrice = useMemo(() => {
		let price = product.price;
		Object.values(selectedVariants).forEach((variant) => {
			price += variant.option.priceAdjustment;
		});
		Object.entries(selectedExtras).forEach(([name, qty]) => {
			const extra = extras.find((item) => item.name === name);
			if (extra && qty > 0) {
				price += extra.price * qty;
			}
		});
		return price;
	}, [extras, product.price, selectedExtras, selectedVariants]);

	const totalPrice = unitPrice * quantity;
	const variantSummary = Object.values(selectedVariants).map(
		(entry) => `${entry.name}: ${entry.option.label}`,
	);
	const extrasSummary = Object.entries(selectedExtras)
		.filter(([, qty]) => qty > 0)
		.map(([name, qty]) => `${name} x${qty}`);
	const isReadyToAdd =
		product.isAvailable && missingRequiredVariantNames.length === 0;

	const doAdd = () => {
		const variantEntries = Object.values(selectedVariants);
		const extrasArray = Object.entries(selectedExtras)
			.filter(([, qty]) => qty > 0)
			.map(([name, qty]) => ({
				extra: extras.find((entry) => entry.name === name)!,
				quantity: qty,
			}))
			.filter((entry) => entry.extra);

		addItem(
			params.vendorId!,
			params.vendorName!,
			product,
			quantity,
			variantEntries.length > 0 ? variantEntries : undefined,
			extrasArray.length > 0 ? extrasArray : undefined,
		);
		router.back();
	};

	const handleAddToCart = () => {
		if (!isReadyToAdd) {
			return;
		}

		if (cartVendorId && cartVendorId !== params.vendorId) {
			Alert.alert(
				"Replace cart?",
				"Your cart contains items from another vendor. Adding this item will replace the current cart.",
				[
					{ text: "Cancel", style: "cancel" },
					{ text: "Replace", style: "destructive", onPress: () => doAdd() },
				],
			);
			return;
		}
		doAdd();
	};

	const addButtonLabel = !product.isAvailable
		? "Currently unavailable"
		: missingRequiredVariantNames.length > 0
			? `Choose ${missingRequiredVariantNames[0]}`
			: "Add to cart";

	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<ScrollView
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}>
				<View style={styles.heroWrap}>
					{product.imageUrl ? (
						<Image
							source={{ uri: product.imageUrl }}
							style={styles.heroImage}
						/>
					) : (
						<View style={styles.heroFallback}>
							<Ionicons name="cube-outline" size={44} color="#19543B" />
						</View>
					)}
					<View style={styles.topBar}>
						<TouchableOpacity
							style={styles.topButton}
							onPress={() => router.back()}>
							<Ionicons name="chevron-back" size={22} color="#142013" />
						</TouchableOpacity>
						{cartVendorId === params.vendorId && cartCount > 0 ? (
							<TouchableOpacity
								style={styles.cartButton}
								onPress={() => router.push("/cart" as any)}>
								<Ionicons name="cart-outline" size={18} color="#142013" />
								<Text style={styles.cartButtonText}>{cartCount}</Text>
							</TouchableOpacity>
						) : null}
					</View>
				</View>

				<View style={styles.infoCard}>
					<Text style={styles.productName}>{product.name}</Text>
					{product.description ? (
						<Text style={styles.productDescription}>{product.description}</Text>
					) : null}
					<View style={styles.priceRow}>
						<Text style={styles.price}>{formatCurrency(product.price)}</Text>
						{product.compareAtPrice != null &&
						product.compareAtPrice > product.price ? (
							<Text style={styles.comparePrice}>
								{formatCurrency(product.compareAtPrice)}
							</Text>
						) : null}
						{!product.isAvailable ? (
							<View style={styles.unavailableBadge}>
								<Text style={styles.unavailableText}>Unavailable</Text>
							</View>
						) : null}
					</View>
				</View>

				<View style={styles.summaryCard}>
					<View style={styles.summaryHeader}>
						<View>
							<Text style={styles.summaryEyebrow}>Builder</Text>
							<Text style={styles.summaryTitle}>Review before you add</Text>
						</View>
						<Text style={styles.summaryPrice}>
							{formatCurrency(unitPrice)} each
						</Text>
					</View>
					{missingRequiredVariantNames.length > 0 ? (
						<View style={styles.inlineWarning}>
							<Ionicons name="alert-circle-outline" size={18} color="#A15C00" />
							<Text style={styles.inlineWarningText}>
								Choose {missingRequiredVariantNames.join(", ")} to continue.
							</Text>
						</View>
					) : (
						<View style={styles.readyPill}>
							<Ionicons name="checkmark-circle" size={18} color="#19543B" />
							<Text style={styles.readyPillText}>
								Required selections complete
							</Text>
						</View>
					)}
					<View style={styles.selectionGroup}>
						<Text style={styles.selectionLabel}>Required choices</Text>
						<View style={styles.selectionWrap}>
							{variantSummary.length > 0 ? (
								variantSummary.map((item) => (
									<View key={item} style={styles.selectionChip}>
										<Text style={styles.selectionChipText}>{item}</Text>
									</View>
								))
							) : (
								<Text style={styles.selectionPlaceholder}>
									Nothing chosen yet
								</Text>
							)}
						</View>
					</View>
					{extras.length > 0 ? (
						<View style={styles.selectionGroup}>
							<Text style={styles.selectionLabel}>Optional extras</Text>
							<View style={styles.selectionWrap}>
								{extrasSummary.length > 0 ? (
									extrasSummary.map((item) => (
										<View key={item} style={styles.selectionChipSecondary}>
											<Text style={styles.selectionChipSecondaryText}>
												{item}
											</Text>
										</View>
									))
								) : (
									<Text style={styles.selectionPlaceholder}>
										No extras selected
									</Text>
								)}
							</View>
						</View>
					) : null}
				</View>

				{variants.map((variant) => (
					<View key={variant.name} style={styles.sectionCard}>
						<View style={styles.sectionHeader}>
							<View>
								<Text style={styles.sectionTitle}>{variant.name}</Text>
								<Text style={styles.sectionMeta}>Required selection</Text>
							</View>
							{selectedVariants[variant.name] ? (
								<Text style={styles.sectionStatus}>Selected</Text>
							) : (
								<Text style={styles.sectionStatusMuted}>Choose one</Text>
							)}
						</View>
						<View style={styles.choiceWrap}>
							{variant.options.map((option) => {
								const isSelected =
									selectedVariants[variant.name]?.option.label === option.label;
								return (
									<TouchableOpacity
										key={option.label}
										style={[
											styles.choiceChip,
											isSelected && styles.choiceChipActive,
										]}
										onPress={() =>
											setSelectedVariants((prev) => ({
												...prev,
												[variant.name]: { name: variant.name, option },
											}))
										}
										activeOpacity={0.82}>
										<Text
											style={[
												styles.choiceText,
												isSelected && styles.choiceTextActive,
											]}>
											{option.label}
										</Text>
										{option.priceAdjustment !== 0 ? (
											<Text
												style={[
													styles.choiceMeta,
													isSelected && styles.choiceMetaActive,
												]}>
												{option.priceAdjustment > 0 ? "+" : ""}
												{formatCurrency(option.priceAdjustment)}
											</Text>
										) : null}
									</TouchableOpacity>
								);
							})}
						</View>
					</View>
				))}

				{extras.length > 0 ? (
					<View style={styles.sectionCard}>
						<View style={styles.sectionHeader}>
							<View>
								<Text style={styles.sectionTitle}>Extras</Text>
								<Text style={styles.sectionMeta}>Optional add-ons</Text>
							</View>
						</View>
						{extras.map((extra) => {
							const qty = selectedExtras[extra.name] ?? 0;
							return (
								<View key={extra.name} style={styles.extraRow}>
									<View style={styles.extraCopy}>
										<Text style={styles.extraName}>{extra.name}</Text>
										<Text style={styles.extraMeta}>
											Add {formatCurrency(extra.price)} each
										</Text>
									</View>
									<View style={styles.qtyControl}>
										<TouchableOpacity
											style={styles.qtyButton}
											onPress={() =>
												setSelectedExtras((prev) => ({
													...prev,
													[extra.name]: Math.max(0, qty - 1),
												}))
											}
											activeOpacity={0.82}>
											<Ionicons name="remove" size={16} color="#142013" />
										</TouchableOpacity>
										<Text style={styles.qtyText}>{qty}</Text>
										<TouchableOpacity
											style={styles.qtyButton}
											onPress={() =>
												setSelectedExtras((prev) => ({
													...prev,
													[extra.name]: Math.min(
														extra.maxQuantity ?? 10,
														qty + 1,
													),
												}))
											}
											activeOpacity={0.82}>
											<Ionicons name="add" size={16} color="#142013" />
										</TouchableOpacity>
									</View>
								</View>
							);
						})}
					</View>
				) : null}

				<View style={styles.sectionCard}>
					<View style={styles.sectionHeader}>
						<View>
							<Text style={styles.sectionTitle}>Quantity</Text>
							<Text style={styles.sectionMeta}>Adjust your order</Text>
						</View>
					</View>
					<View style={styles.quantityRow}>
						<TouchableOpacity
							style={styles.quantityButton}
							onPress={() => setQuantity((value) => Math.max(1, value - 1))}>
							<Ionicons name="remove" size={18} color="#142013" />
						</TouchableOpacity>
						<Text style={styles.quantityValue}>{quantity}</Text>
						<TouchableOpacity
							style={styles.quantityButton}
							onPress={() => setQuantity((value) => value + 1)}>
							<Ionicons name="add" size={18} color="#142013" />
						</TouchableOpacity>
					</View>
				</View>

				<View style={styles.footerSpacer} />
			</ScrollView>

			<View style={styles.bottomBar}>
				<View style={styles.bottomInfo}>
					<Text style={styles.bottomLabel}>Total</Text>
					<Text style={styles.bottomValue}>{formatCurrency(totalPrice)}</Text>
					<Text style={styles.bottomHelper}>
						{missingRequiredVariantNames.length > 0
							? `Required: ${missingRequiredVariantNames.join(", ")}`
							: "Ready to add"}
					</Text>
				</View>
				<TouchableOpacity
					style={[
						styles.primaryButton,
						!isReadyToAdd && styles.primaryButtonDisabled,
					]}
					onPress={handleAddToCart}
					disabled={!isReadyToAdd}
					activeOpacity={0.85}>
					<Text style={styles.primaryButtonText}>{addButtonLabel}</Text>
				</TouchableOpacity>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: "#F3F5EF" },
	content: { paddingBottom: 24 },
	centered: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		padding: 32,
	},
	emptyTitle: { fontSize: 18, fontWeight: "800", color: "#142013" },
	linkText: {
		fontSize: 14,
		fontWeight: "800",
		color: "#19543B",
		marginTop: 12,
	},
	heroWrap: { position: "relative" },
	heroImage: { width: "100%", height: 280 },
	heroFallback: {
		width: "100%",
		height: 280,
		backgroundColor: "#DDF3E7",
		alignItems: "center",
		justifyContent: "center",
	},
	topBar: {
		position: "absolute",
		top: 12,
		left: 16,
		right: 16,
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	topButton: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: "rgba(255,255,255,0.94)",
		alignItems: "center",
		justifyContent: "center",
	},
	cartButton: {
		minWidth: 52,
		height: 40,
		borderRadius: 20,
		backgroundColor: "rgba(255,255,255,0.94)",
		paddingHorizontal: 12,
		alignItems: "center",
		justifyContent: "center",
		flexDirection: "row",
		gap: 6,
	},
	cartButtonText: { fontSize: 13, fontWeight: "800", color: "#142013" },
	infoCard: {
		marginHorizontal: 20,
		marginTop: -28,
		backgroundColor: "#FFFFFF",
		borderRadius: 28,
		padding: 20,
		borderWidth: 1,
		borderColor: "#E4E8DE",
	},
	productName: { fontSize: 24, fontWeight: "800", color: "#142013" },
	productDescription: {
		fontSize: 14,
		lineHeight: 20,
		color: "#667268",
		marginTop: 8,
	},
	priceRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
		marginTop: 14,
		flexWrap: "wrap",
	},
	price: { fontSize: 22, fontWeight: "800", color: "#142013" },
	comparePrice: {
		fontSize: 14,
		color: "#9CA3AF",
		textDecorationLine: "line-through",
	},
	unavailableBadge: {
		paddingHorizontal: 10,
		paddingVertical: 6,
		borderRadius: 999,
		backgroundColor: "#FDE7E6",
	},
	unavailableText: {
		fontSize: 11,
		fontWeight: "800",
		color: "#C93C37",
		textTransform: "uppercase",
		letterSpacing: 0.5,
	},
	summaryCard: {
		marginHorizontal: 20,
		marginTop: 14,
		backgroundColor: "#FFFFFF",
		borderRadius: 22,
		padding: 18,
		borderWidth: 1,
		borderColor: "#E4E8DE",
	},
	summaryHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "flex-start",
		gap: 10,
	},
	summaryEyebrow: {
		fontSize: 11,
		fontWeight: "700",
		textTransform: "uppercase",
		letterSpacing: 0.8,
		color: "#7A8579",
	},
	summaryTitle: {
		fontSize: 18,
		fontWeight: "800",
		color: "#142013",
		marginTop: 4,
	},
	summaryPrice: {
		fontSize: 14,
		fontWeight: "800",
		color: "#19543B",
	},
	inlineWarning: {
		marginTop: 14,
		borderRadius: 16,
		backgroundColor: "#FFF5DE",
		padding: 14,
		flexDirection: "row",
		gap: 10,
		alignItems: "flex-start",
	},
	inlineWarningText: {
		flex: 1,
		fontSize: 13,
		lineHeight: 18,
		color: "#7A4A00",
	},
	readyPill: {
		marginTop: 14,
		borderRadius: 16,
		backgroundColor: "#EDF7F1",
		padding: 14,
		flexDirection: "row",
		gap: 10,
		alignItems: "center",
	},
	readyPillText: {
		fontSize: 13,
		fontWeight: "700",
		color: "#19543B",
	},
	selectionGroup: {
		marginTop: 14,
	},
	selectionLabel: {
		fontSize: 12,
		fontWeight: "700",
		textTransform: "uppercase",
		letterSpacing: 0.8,
		color: "#7A8579",
		marginBottom: 8,
	},
	selectionWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
	selectionChip: {
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 999,
		backgroundColor: "#EDF2EA",
	},
	selectionChipText: {
		fontSize: 12,
		fontWeight: "700",
		color: "#19543B",
	},
	selectionChipSecondary: {
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 999,
		backgroundColor: "#F7F8F4",
		borderWidth: 1,
		borderColor: "#E4E8DE",
	},
	selectionChipSecondaryText: {
		fontSize: 12,
		fontWeight: "700",
		color: "#4B5563",
	},
	selectionPlaceholder: {
		fontSize: 13,
		color: "#7A8579",
	},
	sectionCard: {
		marginHorizontal: 20,
		marginTop: 14,
		backgroundColor: "#FFFFFF",
		borderRadius: 22,
		padding: 18,
		borderWidth: 1,
		borderColor: "#E4E8DE",
	},
	sectionHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "flex-start",
		gap: 12,
		marginBottom: 12,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: "800",
		color: "#142013",
	},
	sectionMeta: {
		fontSize: 12,
		fontWeight: "700",
		textTransform: "uppercase",
		letterSpacing: 0.8,
		color: "#7A8579",
		marginTop: 4,
	},
	sectionStatus: {
		fontSize: 12,
		fontWeight: "800",
		color: "#19543B",
	},
	sectionStatusMuted: {
		fontSize: 12,
		fontWeight: "700",
		color: "#7A8579",
	},
	choiceWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
	choiceChip: {
		paddingHorizontal: 14,
		paddingVertical: 11,
		borderRadius: 18,
		backgroundColor: "#F7F8F4",
		borderWidth: 1,
		borderColor: "#E4E8DE",
		minWidth: 120,
	},
	choiceChipActive: { backgroundColor: "#19543B", borderColor: "#19543B" },
	choiceText: { fontSize: 13, fontWeight: "700", color: "#374151" },
	choiceTextActive: { color: "#FFFFFF" },
	choiceMeta: { fontSize: 12, color: "#7A8579", marginTop: 4 },
	choiceMetaActive: { color: "rgba(255,255,255,0.85)" },
	extraRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingVertical: 10,
		borderBottomWidth: 1,
		borderBottomColor: "#EEF1EA",
	},
	extraCopy: { flex: 1, paddingRight: 12 },
	extraName: { fontSize: 15, fontWeight: "700", color: "#142013" },
	extraMeta: { fontSize: 12, color: "#7A8579", marginTop: 4 },
	qtyControl: { flexDirection: "row", alignItems: "center", gap: 8 },
	qtyButton: {
		width: 30,
		height: 30,
		borderRadius: 10,
		backgroundColor: "#F3F5EF",
		alignItems: "center",
		justifyContent: "center",
		borderWidth: 1,
		borderColor: "#E4E8DE",
	},
	qtyText: {
		minWidth: 18,
		textAlign: "center",
		fontSize: 14,
		fontWeight: "800",
		color: "#142013",
	},
	quantityRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 16,
	},
	quantityButton: {
		width: 44,
		height: 44,
		borderRadius: 22,
		backgroundColor: "#F3F5EF",
		alignItems: "center",
		justifyContent: "center",
		borderWidth: 1,
		borderColor: "#E4E8DE",
	},
	quantityValue: {
		fontSize: 24,
		fontWeight: "800",
		color: "#142013",
		minWidth: 40,
		textAlign: "center",
	},
	bottomBar: {
		position: "absolute",
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: "rgba(255,255,255,0.98)",
		borderTopWidth: 1,
		borderTopColor: "#E4E8DE",
		paddingHorizontal: 20,
		paddingTop: 14,
		paddingBottom: 24,
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		gap: 12,
	},
	bottomInfo: { flex: 1 },
	bottomLabel: {
		fontSize: 11,
		fontWeight: "700",
		textTransform: "uppercase",
		letterSpacing: 1,
		color: "#7A8579",
	},
	bottomValue: {
		fontSize: 22,
		fontWeight: "800",
		color: "#142013",
		marginTop: 4,
	},
	bottomHelper: {
		fontSize: 12,
		color: "#7A8579",
		marginTop: 4,
	},
	primaryButton: {
		backgroundColor: "#19543B",
		borderRadius: 18,
		paddingHorizontal: 20,
		paddingVertical: 15,
		alignItems: "center",
		justifyContent: "center",
	},
	primaryButtonDisabled: { opacity: 0.45 },
	primaryButtonText: { fontSize: 15, fontWeight: "800", color: "#FFFFFF" },
	footerSpacer: { height: 120 },
});
