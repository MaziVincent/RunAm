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
import { useRouter } from "expo-router";
import { useCartStore } from "@runam/shared/stores/cart-store";
import type { CartItem } from "@runam/shared/types";

function getItemUnitPrice(item: CartItem): number {
	let price = item.product.price;
	if (item.selectedVariants) {
		for (const v of item.selectedVariants) {
			price += v.option.priceAdjustment;
		}
	}
	if (item.selectedExtras) {
		for (const e of item.selectedExtras) {
			price += e.extra.price * e.quantity;
		}
	}
	return price;
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
	const deliveryFee = 0; // calculated at checkout

	const handleCheckout = () => {
		if (!vendorId || items.length === 0) return;
		router.push("/checkout" as any);
	};

	if (items.length === 0) {
		return (
			<SafeAreaView style={styles.container} edges={["top"]}>
				<View style={styles.header}>
					<TouchableOpacity
						onPress={() => router.back()}
						style={styles.backBtn}>
						<Text style={styles.backText}>‹</Text>
					</TouchableOpacity>
					<Text style={styles.headerTitle}>Cart</Text>
					<View style={{ width: 40 }} />
				</View>
				<View style={styles.center}>
					<Text style={styles.emptyIcon}>🛒</Text>
					<Text style={styles.emptyTitle}>Your cart is empty</Text>
					<Text style={styles.emptySubtext}>
						Browse vendors and add items to get started
					</Text>
					<TouchableOpacity
						style={styles.browseBtn}
						onPress={() => router.push("/vendors/categories")}>
						<Text style={styles.browseBtnText}>Browse Services</Text>
					</TouchableOpacity>
				</View>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			{/* Header */}
			<View style={styles.header}>
				<TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
					<Text style={styles.backText}>‹</Text>
				</TouchableOpacity>
				<Text style={styles.headerTitle}>Cart</Text>
				<TouchableOpacity
					onPress={() =>
						Alert.alert("Clear Cart", "Remove all items?", [
							{ text: "Cancel", style: "cancel" },
							{ text: "Clear", style: "destructive", onPress: clearCart },
						])
					}>
					<Text style={styles.clearText}>Clear</Text>
				</TouchableOpacity>
			</View>

			{/* Vendor Name */}
			<View style={styles.vendorBanner}>
				<Text style={styles.vendorIcon}>🏪</Text>
				<Text style={styles.vendorBannerName}>{vendorName}</Text>
			</View>

			<ScrollView
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}>
				{/* Cart Items */}
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
								<View style={styles.itemImagePlaceholder}>
									<Text style={{ fontSize: 24 }}>📦</Text>
								</View>
							)}
							<View style={styles.itemContent}>
								<Text style={styles.itemName}>{item.product.name}</Text>
								{item.selectedVariants && item.selectedVariants.length > 0 && (
									<Text style={styles.itemMeta}>
										{item.selectedVariants
											.map((v) => `${v.name}: ${v.option.label}`)
											.join(", ")}
									</Text>
								)}
								{item.selectedExtras && item.selectedExtras.length > 0 && (
									<Text style={styles.itemMeta}>
										+{" "}
										{item.selectedExtras
											.map((e) => `${e.extra.name} x${e.quantity}`)
											.join(", ")}
									</Text>
								)}
								<Text style={styles.itemTotal}>
									₦{(unitPrice * item.quantity).toLocaleString()}
								</Text>
							</View>
							<View style={styles.itemActions}>
								<TouchableOpacity
									style={styles.removeBtn}
									onPress={() => removeItem(item.cartItemId)}>
									<Text style={styles.removeBtnText}>✕</Text>
								</TouchableOpacity>
								<View style={styles.qtyControl}>
									<TouchableOpacity
										style={styles.qtyBtn}
										onPress={() =>
											updateQuantity(item.cartItemId, item.quantity - 1)
										}>
										<Text style={styles.qtyBtnText}>−</Text>
									</TouchableOpacity>
									<Text style={styles.qtyText}>{item.quantity}</Text>
									<TouchableOpacity
										style={styles.qtyBtn}
										onPress={() =>
											updateQuantity(item.cartItemId, item.quantity + 1)
										}>
										<Text style={styles.qtyBtnText}>+</Text>
									</TouchableOpacity>
								</View>
							</View>
						</View>
					);
				})}

				{/* Summary */}
				<View style={styles.summary}>
					<View style={styles.summaryRow}>
						<Text style={styles.summaryLabel}>Subtotal</Text>
						<Text style={styles.summaryValue}>
							₦{subtotal.toLocaleString()}
						</Text>
					</View>
					<View style={styles.summaryRow}>
						<Text style={styles.summaryLabel}>Delivery Fee</Text>
						<Text style={styles.summaryValue}>
							{deliveryFee > 0
								? `₦${deliveryFee.toLocaleString()}`
								: "Calculated at checkout"}
						</Text>
					</View>
					<View style={[styles.summaryRow, styles.summaryTotal]}>
						<Text style={styles.totalLabel}>Total</Text>
						<Text style={styles.totalValue}>
							₦{(subtotal + deliveryFee).toLocaleString()}
						</Text>
					</View>
				</View>

				<View style={{ height: 120 }} />
			</ScrollView>

			{/* Checkout */}
			<View style={styles.bottomBar}>
				<TouchableOpacity
					style={styles.checkoutBtn}
					activeOpacity={0.8}
					onPress={handleCheckout}>
					<Text style={styles.checkoutBtnText}>
						Checkout · ₦{subtotal.toLocaleString()}
					</Text>
				</TouchableOpacity>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#F9FAFB",
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 16,
		paddingVertical: 12,
		backgroundColor: "#FFFFFF",
		borderBottomWidth: 1,
		borderBottomColor: "#F3F4F6",
	},
	backBtn: {
		width: 40,
		height: 40,
		alignItems: "center",
		justifyContent: "center",
	},
	backText: {
		fontSize: 28,
		color: "#374151",
		fontWeight: "300",
	},
	headerTitle: {
		fontSize: 18,
		fontWeight: "700",
		color: "#111827",
	},
	clearText: {
		fontSize: 14,
		fontWeight: "600",
		color: "#EF4444",
	},
	vendorBanner: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 20,
		paddingVertical: 12,
		backgroundColor: "#FFFFFF",
		borderBottomWidth: 1,
		borderBottomColor: "#F3F4F6",
	},
	vendorIcon: {
		fontSize: 20,
		marginRight: 8,
	},
	vendorBannerName: {
		fontSize: 15,
		fontWeight: "700",
		color: "#374151",
	},
	scrollContent: {
		padding: 16,
	},
	center: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		padding: 40,
	},
	emptyIcon: {
		fontSize: 56,
		marginBottom: 16,
	},
	emptyTitle: {
		fontSize: 18,
		fontWeight: "700",
		color: "#374151",
	},
	emptySubtext: {
		fontSize: 14,
		color: "#9CA3AF",
		marginTop: 4,
		textAlign: "center",
	},
	browseBtn: {
		marginTop: 20,
		backgroundColor: "#2F8F4E",
		paddingHorizontal: 24,
		paddingVertical: 12,
		borderRadius: 12,
	},
	browseBtnText: {
		fontSize: 15,
		fontWeight: "700",
		color: "#FFFFFF",
	},
	itemCard: {
		flexDirection: "row",
		backgroundColor: "#FFFFFF",
		borderRadius: 12,
		marginBottom: 12,
		padding: 12,
		borderWidth: 1,
		borderColor: "#F3F4F6",
	},
	itemImage: {
		width: 64,
		height: 64,
		borderRadius: 10,
	},
	itemImagePlaceholder: {
		width: 64,
		height: 64,
		borderRadius: 10,
		backgroundColor: "#F3F4F6",
		alignItems: "center",
		justifyContent: "center",
	},
	itemContent: {
		flex: 1,
		marginLeft: 12,
	},
	itemName: {
		fontSize: 15,
		fontWeight: "700",
		color: "#111827",
	},
	itemMeta: {
		fontSize: 12,
		color: "#6B7280",
		marginTop: 2,
	},
	itemTotal: {
		fontSize: 14,
		fontWeight: "700",
		color: "#111827",
		marginTop: 4,
	},
	itemActions: {
		alignItems: "flex-end",
		justifyContent: "space-between",
		marginLeft: 8,
	},
	removeBtn: {
		width: 24,
		height: 24,
		borderRadius: 12,
		backgroundColor: "#FEE2E2",
		alignItems: "center",
		justifyContent: "center",
	},
	removeBtnText: {
		fontSize: 12,
		fontWeight: "700",
		color: "#DC2626",
	},
	qtyControl: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	qtyBtn: {
		width: 28,
		height: 28,
		borderRadius: 8,
		backgroundColor: "#F3F4F6",
		alignItems: "center",
		justifyContent: "center",
	},
	qtyBtnText: {
		fontSize: 16,
		fontWeight: "700",
		color: "#374151",
	},
	qtyText: {
		fontSize: 14,
		fontWeight: "700",
		color: "#111827",
		minWidth: 20,
		textAlign: "center",
	},
	summary: {
		backgroundColor: "#FFFFFF",
		borderRadius: 12,
		padding: 16,
		marginTop: 8,
		borderWidth: 1,
		borderColor: "#F3F4F6",
	},
	summaryRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginBottom: 10,
	},
	summaryLabel: {
		fontSize: 14,
		color: "#6B7280",
	},
	summaryValue: {
		fontSize: 14,
		fontWeight: "600",
		color: "#374151",
	},
	summaryTotal: {
		borderTopWidth: 1,
		borderTopColor: "#F3F4F6",
		paddingTop: 10,
		marginBottom: 0,
	},
	totalLabel: {
		fontSize: 16,
		fontWeight: "700",
		color: "#111827",
	},
	totalValue: {
		fontSize: 16,
		fontWeight: "800",
		color: "#111827",
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
	checkoutBtn: {
		backgroundColor: "#2F8F4E",
		paddingVertical: 16,
		borderRadius: 14,
		alignItems: "center",
	},
	checkoutBtnText: {
		fontSize: 16,
		fontWeight: "700",
		color: "#FFFFFF",
	},
});
