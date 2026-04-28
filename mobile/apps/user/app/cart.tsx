import { useMemo } from "react";
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
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { getVendorById } from "@runam/shared/api/vendors";
import { useCartStore } from "@runam/shared/stores/cart-store";
import type { CartItem, Product, VendorDetail } from "@runam/shared/types";
import BackHeader from "./components/BackHeader";
import EmptyState from "./components/EmptyState";
import HeroCard from "./components/HeroCard";
import StickyBottomBar from "./components/StickyBottomBar";

function getItemUnitPrice(item: CartItem): number {
	let price = item.product.price;
	if (item.selectedVariants) {
		for (const variant of item.selectedVariants) {
			price += variant.option.priceAdjustment;
		}
	}
	if (item.selectedExtras) {
		for (const extra of item.selectedExtras) {
			price += extra.extra.price * extra.quantity;
		}
	}
	return price;
}

function formatCurrency(amount: number): string {
	return `₦${amount.toLocaleString()}`;
}

export default function CartScreen() {
	const router = useRouter();
	const {
		items,
		vendorName,
		vendorId,
		updateQuantity,
		removeItem,
		clearCart,
		getSubtotal,
	} = useCartStore();

	const subtotal = getSubtotal();
	const itemCount = items.reduce((count, item) => count + item.quantity, 0);

	const { data: vendorDetail } = useQuery<VendorDetail>({
		queryKey: ["vendor", vendorId],
		queryFn: () => getVendorById(vendorId as string),
		enabled: !!vendorId,
	});

	const upsellProducts = useMemo<Product[]>(() => {
		if (!vendorDetail) return [];
		const inCartIds = new Set(items.map((item) => item.product.id));
		const all = (vendorDetail.productCategories ?? []).flatMap(
			(category) => category.products ?? [],
		);
		return all
			.filter((product) => product.isAvailable && !inCartIds.has(product.id))
			.sort((first, second) => first.sortOrder - second.sortOrder)
			.slice(0, 6);
	}, [vendorDetail, items]);

	const openUpsellProduct = (product: Product) => {
		if (!vendorId) return;
		router.push({
			pathname: "/vendors/product",
			params: {
				productId: product.id,
				vendorId,
				vendorName: vendorName ?? "",
				productJson: JSON.stringify(product),
			},
		});
	};

	const handleCheckout = () => {
		if (!vendorId || items.length === 0) {
			return;
		}
		router.push("/checkout" as any);
	};

	if (items.length === 0) {
		return (
			<SafeAreaView style={styles.container} edges={["top"]}>
				<BackHeader title="Cart" onBack={() => router.back()} />
				<EmptyState
					icon="cart-outline"
					title="Your cart is empty"
					description="Browse vendors and add products before heading to checkout."
					actionLabel="Browse categories"
					onAction={() => router.push("/vendors/categories" as any)}
				/>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<BackHeader
				title="Cart"
				onBack={() => router.back()}
				rightSlot={
					<TouchableOpacity
						style={styles.headerButton}
						onPress={() =>
							Alert.alert("Clear cart", "Remove all items from this cart?", [
								{ text: "Cancel", style: "cancel" },
								{ text: "Clear", style: "destructive", onPress: clearCart },
							])
						}>
						<Ionicons name="trash-outline" size={18} color="#C93C37" />
					</TouchableOpacity>
				}
			/>

			<ScrollView
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}>
				<HeroCard
					kicker="Cart"
					title="Review your items before checkout."
					subtitle="Your cart stays scoped to one vendor so checkout remains predictable."
					style={styles.heroCard}>
					<View style={styles.heroMetaRow}>
						<View style={styles.heroMetaChip}>
							<Ionicons name="storefront-outline" size={14} color="#19543B" />
							<Text style={styles.heroMetaText}>{vendorName}</Text>
						</View>
						<View style={styles.heroMetaChip}>
							<Ionicons name="basket-outline" size={14} color="#19543B" />
							<Text style={styles.heroMetaText}>{itemCount} items</Text>
						</View>
					</View>
				</HeroCard>

				<View style={styles.itemsSection}>
					{items.map((item) => {
						const unitPrice = getItemUnitPrice(item);
						return (
							<View key={item.cartItemId} style={styles.itemCard}>
								{item.product.imageUrl ? (
									<Image
										source={{ uri: item.product.imageUrl }}
										style={styles.itemImage}
									/>
								) : (
									<View style={styles.itemImageFallback}>
										<Ionicons name="cube-outline" size={24} color="#19543B" />
									</View>
								)}
								<View style={styles.itemContent}>
									<Text style={styles.itemName}>{item.product.name}</Text>
									{item.selectedVariants && item.selectedVariants.length > 0 ? (
										<Text style={styles.itemMeta}>
											{item.selectedVariants
												.map(
													(variant) =>
														`${variant.name}: ${variant.option.label}`,
												)
												.join(", ")}
										</Text>
									) : null}
									{item.selectedExtras && item.selectedExtras.length > 0 ? (
										<Text style={styles.itemMeta}>
											+{" "}
											{item.selectedExtras
												.map(
													(extra) => `${extra.extra.name} x${extra.quantity}`,
												)
												.join(", ")}
										</Text>
									) : null}
									<Text style={styles.itemPrice}>
										{formatCurrency(unitPrice * item.quantity)}
									</Text>
								</View>
								<View style={styles.itemSide}>
									<TouchableOpacity
										style={styles.removeButton}
										onPress={() => removeItem(item.cartItemId)}
										activeOpacity={0.8}>
										<Ionicons name="close" size={16} color="#C93C37" />
									</TouchableOpacity>
									<View style={styles.qtyControl}>
										<TouchableOpacity
											style={styles.qtyButton}
											onPress={() =>
												updateQuantity(item.cartItemId, item.quantity - 1)
											}
											activeOpacity={0.8}>
											<Ionicons name="remove" size={16} color="#142013" />
										</TouchableOpacity>
										<Text style={styles.qtyValue}>{item.quantity}</Text>
										<TouchableOpacity
											style={styles.qtyButton}
											onPress={() =>
												updateQuantity(item.cartItemId, item.quantity + 1)
											}
											activeOpacity={0.8}>
											<Ionicons name="add" size={16} color="#142013" />
										</TouchableOpacity>
									</View>
								</View>
							</View>
						);
					})}
				</View>

				{upsellProducts.length > 0 ? (
					<View style={styles.upsellSection}>
						<Text style={styles.upsellTitle}>Frequently added with this</Text>
						<ScrollView
							horizontal
							showsHorizontalScrollIndicator={false}
							contentContainerStyle={styles.upsellRail}>
							{upsellProducts.map((product) => (
								<TouchableOpacity
									key={product.id}
									style={styles.upsellCard}
									activeOpacity={0.85}
									onPress={() => openUpsellProduct(product)}>
									{product.imageUrl ? (
										<Image
											source={{ uri: product.imageUrl }}
											style={styles.upsellImage}
										/>
									) : (
										<View style={styles.upsellImageFallback}>
											<Ionicons name="cube-outline" size={22} color="#19543B" />
										</View>
									)}
									<Text style={styles.upsellName} numberOfLines={2}>
										{product.name}
									</Text>
									<View style={styles.upsellFooter}>
										<Text style={styles.upsellPrice}>
											{formatCurrency(product.price)}
										</Text>
										<View style={styles.upsellAdd}>
											<Ionicons name="add" size={14} color="#FFFFFF" />
										</View>
									</View>
								</TouchableOpacity>
							))}
						</ScrollView>
					</View>
				) : null}

				<View style={styles.summaryCard}>
					<Text style={styles.summaryTitle}>Before you pay</Text>
					<View style={styles.summaryRow}>
						<Text style={styles.summaryLabel}>Subtotal</Text>
						<Text style={styles.summaryValue}>{formatCurrency(subtotal)}</Text>
					</View>
					<View style={styles.summaryRow}>
						<Text style={styles.summaryLabel}>Delivery fee</Text>
						<Text style={styles.summaryValue}>Calculated at checkout</Text>
					</View>
					<View style={styles.summaryHint}>
						<Ionicons
							name="information-circle-outline"
							size={16}
							color="#19543B"
						/>
						<Text style={styles.summaryHintText}>
							Delivery price depends on the selected address and vendor route.
						</Text>
					</View>
				</View>

				<View style={styles.footerSpacer} />
			</ScrollView>

			<StickyBottomBar>
				<View>
					<Text style={styles.bottomBarLabel}>Subtotal</Text>
					<Text style={styles.bottomBarValue}>{formatCurrency(subtotal)}</Text>
				</View>
				<TouchableOpacity
					style={styles.primaryButton}
					onPress={handleCheckout}
					activeOpacity={0.85}>
					<Text style={styles.primaryButtonText}>Continue to checkout</Text>
				</TouchableOpacity>
			</StickyBottomBar>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#F3F5EF",
	},
	headerButton: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: "#FFFFFF",
		alignItems: "center",
		justifyContent: "center",
		borderWidth: 1,
		borderColor: "#E4E8DE",
	},
	scrollContent: {
		paddingHorizontal: 20,
		paddingBottom: 24,
	},
	heroCard: {
		marginBottom: 16,
	},
	heroMetaRow: {
		flexDirection: "row",
		gap: 8,
		flexWrap: "wrap",
		marginTop: 16,
	},
	heroMetaChip: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		backgroundColor: "#FFFFFF",
		borderRadius: 999,
		paddingHorizontal: 12,
		paddingVertical: 8,
	},
	heroMetaText: {
		fontSize: 12,
		fontWeight: "700",
		color: "#19543B",
	},
	itemsSection: {
		gap: 12,
	},
	itemCard: {
		flexDirection: "row",
		alignItems: "stretch",
		gap: 12,
		backgroundColor: "#FFFFFF",
		borderRadius: 22,
		padding: 14,
		borderWidth: 1,
		borderColor: "#E4E8DE",
	},
	itemImage: {
		width: 76,
		height: 76,
		borderRadius: 18,
	},
	itemImageFallback: {
		width: 76,
		height: 76,
		borderRadius: 18,
		backgroundColor: "#EDF2EA",
		alignItems: "center",
		justifyContent: "center",
	},
	itemContent: {
		flex: 1,
	},
	itemName: {
		fontSize: 15,
		fontWeight: "800",
		color: "#142013",
	},
	itemMeta: {
		fontSize: 12,
		lineHeight: 17,
		color: "#667268",
		marginTop: 4,
	},
	itemPrice: {
		fontSize: 15,
		fontWeight: "800",
		color: "#142013",
		marginTop: 8,
	},
	itemSide: {
		justifyContent: "space-between",
		alignItems: "flex-end",
	},
	removeButton: {
		width: 28,
		height: 28,
		borderRadius: 14,
		backgroundColor: "#FDE7E6",
		alignItems: "center",
		justifyContent: "center",
	},
	qtyControl: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
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
	qtyValue: {
		fontSize: 14,
		fontWeight: "800",
		color: "#142013",
		minWidth: 18,
		textAlign: "center",
	},
	summaryCard: {
		backgroundColor: "#FFFFFF",
		borderRadius: 22,
		padding: 18,
		marginTop: 16,
		borderWidth: 1,
		borderColor: "#E4E8DE",
	},
	summaryTitle: {
		fontSize: 18,
		fontWeight: "800",
		color: "#142013",
		marginBottom: 12,
	},
	summaryRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 10,
	},
	summaryLabel: {
		fontSize: 14,
		color: "#667268",
	},
	summaryValue: {
		fontSize: 14,
		fontWeight: "700",
		color: "#142013",
	},
	summaryHint: {
		marginTop: 8,
		padding: 12,
		borderRadius: 16,
		backgroundColor: "#EDF2EA",
		flexDirection: "row",
		gap: 8,
	},
	summaryHintText: {
		flex: 1,
		fontSize: 12,
		lineHeight: 17,
		color: "#3D5140",
	},
	bottomBar: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		gap: 12,
	},
	bottomBarLabel: {
		fontSize: 11,
		fontWeight: "700",
		letterSpacing: 1,
		textTransform: "uppercase",
		color: "#7A8579",
	},
	bottomBarValue: {
		fontSize: 22,
		fontWeight: "800",
		color: "#142013",
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
	primaryButtonText: {
		fontSize: 15,
		fontWeight: "800",
		color: "#FFFFFF",
	},
	footerSpacer: {
		height: 128,
	},
	upsellSection: {
		marginTop: 18,
		marginBottom: 6,
	},
	upsellTitle: {
		fontSize: 16,
		fontWeight: "800",
		color: "#142013",
		marginBottom: 12,
	},
	upsellRail: {
		gap: 12,
		paddingRight: 4,
	},
	upsellCard: {
		width: 148,
		backgroundColor: "#FFFFFF",
		borderRadius: 18,
		borderWidth: 1,
		borderColor: "#E4E8DE",
		padding: 10,
	},
	upsellImage: {
		width: "100%",
		height: 90,
		borderRadius: 14,
		marginBottom: 8,
	},
	upsellImageFallback: {
		width: "100%",
		height: 90,
		borderRadius: 14,
		marginBottom: 8,
		backgroundColor: "#EDF2EA",
		alignItems: "center",
		justifyContent: "center",
	},
	upsellName: {
		fontSize: 13,
		fontWeight: "700",
		color: "#142013",
		minHeight: 36,
	},
	upsellFooter: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		marginTop: 8,
	},
	upsellPrice: {
		fontSize: 13,
		fontWeight: "800",
		color: "#19543B",
	},
	upsellAdd: {
		width: 26,
		height: 26,
		borderRadius: 13,
		backgroundColor: "#19543B",
		alignItems: "center",
		justifyContent: "center",
	},
});
