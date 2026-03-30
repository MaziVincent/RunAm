import { useState, useMemo, useEffect } from "react";
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	ScrollView,
	TextInput,
	ActivityIndicator,
	Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useCartStore } from "@runam/shared/stores/cart-store";
import { getAddresses } from "@runam/shared/api/addresses";
import {
	createMarketplaceOrder,
	getDeliveryEstimate,
} from "@runam/shared/api/errands";
import { getVendorById } from "@runam/shared/api/vendors";
import type {
	Address,
	CreateMarketplaceOrderRequest,
	CreateOrderItemRequest,
	CartItem,
} from "@runam/shared/types";

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

const PAYMENT_METHODS = [
	{ value: 0, label: "Wallet", icon: "💰" },
	{ value: 1, label: "Card", icon: "💳" },
] as const;

export default function CheckoutScreen() {
	const router = useRouter();
	const { items, vendorId, vendorName, getSubtotal, clearCart } =
		useCartStore();

	const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
		null,
	);
	const [recipientName, setRecipientName] = useState("");
	const [recipientPhone, setRecipientPhone] = useState("");
	const [specialInstructions, setSpecialInstructions] = useState("");
	const [promoCode, setPromoCode] = useState("");
	const [paymentMethod, setPaymentMethod] = useState(0);

	const { data: addresses, isLoading: loadingAddresses } = useQuery<Address[]>({
		queryKey: ["addresses"],
		queryFn: getAddresses,
	});

	// Fetch vendor details for open status, minimum order, and coordinates
	const { data: vendor } = useQuery({
		queryKey: ["vendor", vendorId],
		queryFn: () => getVendorById(vendorId!),
		enabled: !!vendorId,
	});

	// Auto-select default address
	const selectedAddress = useMemo(() => {
		if (!addresses || addresses.length === 0) return null;
		if (selectedAddressId)
			return addresses.find((a) => a.id === selectedAddressId) ?? null;
		const defaultAddr = addresses.find((a) => a.isDefault);
		return defaultAddr ?? addresses[0];
	}, [addresses, selectedAddressId]);

	// Fetch delivery estimate when address + vendor coords available
	const { data: estimate, isLoading: loadingEstimate } = useQuery({
		queryKey: [
			"delivery-estimate",
			vendorId,
			selectedAddress?.latitude,
			selectedAddress?.longitude,
		],
		queryFn: () =>
			getDeliveryEstimate({
				category: "FoodDelivery",
				pickupLatitude: vendor!.latitude,
				pickupLongitude: vendor!.longitude,
				dropoffLatitude: selectedAddress!.latitude,
				dropoffLongitude: selectedAddress!.longitude,
			}),
		enabled: !!vendor && !!selectedAddress,
	});

	const subtotal = getSubtotal();
	const deliveryFee =
		vendor?.deliveryFee && vendor.deliveryFee > 0
			? vendor.deliveryFee
			: (estimate?.estimatedPrice ?? 0);
	const total = subtotal + deliveryFee;
	const belowMinimum = vendor ? subtotal < vendor.minimumOrderAmount : false;
	const vendorClosed = vendor ? !vendor.isOpen : false;

	const orderMutation = useMutation({
		mutationFn: createMarketplaceOrder,
		onSuccess: (errand) => {
			clearCart();
			router.replace({
				pathname: "/order-confirmation" as any,
				params: {
					errandId: errand.id,
					vendorName: vendorName ?? "",
					total: total.toString(),
				},
			});
		},
		onError: (err: any) => {
			let title = "Order Failed";
			let message = err.message || "Something went wrong.";
			if (message.includes("closed"))
				message = "This vendor is currently closed.";
			else if (message.includes("Minimum order"))
				message = `Your order doesn't meet the minimum amount of ₦${vendor?.minimumOrderAmount?.toLocaleString()}.`;
			Alert.alert(title, message);
		},
	});

	const handlePlaceOrder = () => {
		if (!vendorId || items.length === 0) return;

		if (vendorClosed) {
			Alert.alert(
				"Vendor Closed",
				"This vendor is currently closed. Please try again later.",
			);
			return;
		}

		if (belowMinimum && vendor) {
			Alert.alert(
				"Minimum Order",
				`The minimum order amount is ₦${vendor.minimumOrderAmount.toLocaleString()}.`,
			);
			return;
		}

		if (!selectedAddress) {
			Alert.alert("No Address", "Please select a delivery address.");
			return;
		}

		const orderItems: CreateOrderItemRequest[] = items.map((item) => ({
			productId: item.product.id,
			quantity: item.quantity,
			notes: item.notes,
			selectedVariantJson:
				item.selectedVariants && item.selectedVariants.length > 0
					? JSON.stringify(item.selectedVariants)
					: undefined,
			selectedExtrasJson: item.selectedExtras
				? JSON.stringify(item.selectedExtras)
				: undefined,
		}));

		const request: CreateMarketplaceOrderRequest = {
			vendorId,
			dropoffAddress: selectedAddress.address,
			dropoffLatitude: selectedAddress.latitude,
			dropoffLongitude: selectedAddress.longitude,
			recipientName: recipientName || undefined,
			recipientPhone: recipientPhone || undefined,
			specialInstructions: specialInstructions || undefined,
			paymentMethod,
			promoCode: promoCode || undefined,
			items: orderItems,
		};

		orderMutation.mutate(request);
	};

	if (items.length === 0) {
		return (
			<SafeAreaView style={styles.container} edges={["top"]}>
				<View style={styles.center}>
					<Text style={styles.emptyIcon}>🛒</Text>
					<Text style={styles.emptyText}>Your cart is empty</Text>
					<TouchableOpacity
						style={styles.primaryBtn}
						onPress={() => router.replace("/(tabs)")}>
						<Text style={styles.primaryBtnText}>Go Home</Text>
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
				<Text style={styles.headerTitle}>Checkout</Text>
				<View style={{ width: 40 }} />
			</View>

			<ScrollView
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}>
				{/* Vendor */}
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Order from</Text>
					<View style={styles.vendorRow}>
						<Text style={styles.vendorIcon}>🏪</Text>
						<Text style={styles.vendorName}>{vendorName}</Text>
						{vendor && (
							<View
								style={[
									styles.statusBadge,
									vendorClosed && styles.statusBadgeClosed,
								]}>
								<Text
									style={[
										styles.statusBadgeText,
										vendorClosed && styles.statusBadgeTextClosed,
									]}>
									{vendorClosed ? "Closed" : "Open"}
								</Text>
							</View>
						)}
					</View>
					{vendorClosed && (
						<Text style={styles.warningText}>
							This vendor is currently closed. You cannot place an order right
							now.
						</Text>
					)}
					{belowMinimum && vendor && !vendorClosed && (
						<Text style={styles.warningText}>
							Minimum order: ₦{vendor.minimumOrderAmount.toLocaleString()}. Add
							₦{(vendor.minimumOrderAmount - subtotal).toLocaleString()} more.
						</Text>
					)}
				</View>

				{/* Delivery Address */}
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Delivery Address</Text>
					{loadingAddresses ? (
						<ActivityIndicator size="small" color="#2F8F4E" />
					) : !addresses || addresses.length === 0 ? (
						<View style={styles.noAddress}>
							<Text style={styles.noAddressText}>No saved addresses</Text>
							<TouchableOpacity
								onPress={() => router.push("/settings/payment-methods")}>
								<Text style={styles.linkText}>Add address</Text>
							</TouchableOpacity>
						</View>
					) : (
						addresses.map((addr) => {
							const isSelected = selectedAddress?.id === addr.id;
							return (
								<TouchableOpacity
									key={addr.id}
									style={[
										styles.addressCard,
										isSelected && styles.addressCardActive,
									]}
									onPress={() => setSelectedAddressId(addr.id)}>
									<View style={styles.radioOuter}>
										{isSelected && <View style={styles.radioInner} />}
									</View>
									<View style={{ flex: 1 }}>
										<Text style={styles.addressLabel}>{addr.label}</Text>
										<Text style={styles.addressText} numberOfLines={2}>
											{addr.address}
										</Text>
									</View>
									{addr.isDefault && (
										<View style={styles.defaultBadge}>
											<Text style={styles.defaultBadgeText}>Default</Text>
										</View>
									)}
								</TouchableOpacity>
							);
						})
					)}
				</View>

				{/* Recipient (optional) */}
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Recipient (optional)</Text>
					<TextInput
						style={styles.input}
						placeholder="Recipient name"
						placeholderTextColor="#9CA3AF"
						value={recipientName}
						onChangeText={setRecipientName}
					/>
					<TextInput
						style={[styles.input, { marginTop: 10 }]}
						placeholder="Recipient phone"
						placeholderTextColor="#9CA3AF"
						value={recipientPhone}
						onChangeText={setRecipientPhone}
						keyboardType="phone-pad"
					/>
				</View>

				{/* Special Instructions */}
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Special Instructions</Text>
					<TextInput
						style={[styles.input, styles.textArea]}
						placeholder="Any instructions for the vendor or rider…"
						placeholderTextColor="#9CA3AF"
						value={specialInstructions}
						onChangeText={setSpecialInstructions}
						multiline
						numberOfLines={3}
					/>
				</View>

				{/* Promo Code */}
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Promo Code</Text>
					<TextInput
						style={styles.input}
						placeholder="Enter promo code"
						placeholderTextColor="#9CA3AF"
						value={promoCode}
						onChangeText={setPromoCode}
						autoCapitalize="characters"
					/>
				</View>

				{/* Payment Method */}
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Payment Method</Text>
					<View style={styles.paymentRow}>
						{PAYMENT_METHODS.map((pm) => {
							const isSelected = paymentMethod === pm.value;
							return (
								<TouchableOpacity
									key={pm.value}
									style={[
										styles.paymentOption,
										isSelected && styles.paymentOptionActive,
									]}
									onPress={() => setPaymentMethod(pm.value)}>
									<Text style={styles.paymentIcon}>{pm.icon}</Text>
									<Text
										style={[
											styles.paymentLabel,
											isSelected && styles.paymentLabelActive,
										]}>
										{pm.label}
									</Text>
								</TouchableOpacity>
							);
						})}
					</View>
				</View>

				{/* Order Summary */}
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>
						Order Summary ({items.length} items)
					</Text>
					{items.map((item) => (
						<View key={item.cartItemId} style={styles.summaryItem}>
							<View style={{ flex: 1 }}>
								<Text style={styles.summaryItemName}>
									{item.quantity}× {item.product.name}
								</Text>
								{item.selectedVariants && item.selectedVariants.length > 0 && (
									<Text style={styles.summaryItemMeta}>
										{item.selectedVariants
											.map((v) => `${v.name}: ${v.option.label}`)
											.join(", ")}
									</Text>
								)}
							</View>
							<Text style={styles.summaryItemPrice}>
								₦{(getItemUnitPrice(item) * item.quantity).toLocaleString()}
							</Text>
						</View>
					))}
				</View>

				{/* Totals */}
				<View style={styles.totals}>
					<View style={styles.totalRow}>
						<Text style={styles.totalLabel}>Subtotal</Text>
						<Text style={styles.totalValue}>₦{subtotal.toLocaleString()}</Text>
					</View>
					<View style={styles.totalRow}>
						<Text style={styles.totalLabel}>Delivery Fee</Text>
						<Text style={styles.totalValue}>
							{loadingEstimate
								? "Calculating…"
								: deliveryFee > 0
									? `₦${deliveryFee.toLocaleString()}`
									: selectedAddress
										? "Free"
										: "Select address"}
						</Text>
					</View>
					<View style={[styles.totalRow, styles.totalRowFinal]}>
						<Text style={styles.totalFinalLabel}>Total</Text>
						<Text style={styles.totalFinalValue}>
							₦{total.toLocaleString()}
						</Text>
					</View>
				</View>

				<View style={{ height: 120 }} />
			</ScrollView>

			{/* Place Order Button */}
			<View style={styles.bottomBar}>
				<TouchableOpacity
					style={[
						styles.placeOrderBtn,
						(orderMutation.isPending ||
							!selectedAddress ||
							vendorClosed ||
							belowMinimum) &&
							styles.placeOrderBtnDisabled,
					]}
					activeOpacity={0.8}
					disabled={
						orderMutation.isPending ||
						!selectedAddress ||
						vendorClosed ||
						belowMinimum
					}
					onPress={handlePlaceOrder}>
					<Text style={styles.placeOrderBtnText}>
						{orderMutation.isPending
							? "Placing Order…"
							: `Place Order · ₦${total.toLocaleString()}`}
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
	emptyText: {
		fontSize: 18,
		fontWeight: "700",
		color: "#374151",
		marginBottom: 16,
	},
	section: {
		backgroundColor: "#FFFFFF",
		borderRadius: 16,
		padding: 16,
		marginBottom: 12,
		borderWidth: 1,
		borderColor: "#F3F4F6",
	},
	sectionTitle: {
		fontSize: 14,
		fontWeight: "700",
		color: "#6B7280",
		textTransform: "uppercase",
		letterSpacing: 0.5,
		marginBottom: 12,
	},
	vendorRow: {
		flexDirection: "row",
		alignItems: "center",
	},
	vendorIcon: {
		fontSize: 20,
		marginRight: 8,
	},
	vendorName: {
		fontSize: 16,
		fontWeight: "700",
		color: "#111827",
		flex: 1,
	},
	statusBadge: {
		backgroundColor: "#D1FAE5",
		paddingHorizontal: 8,
		paddingVertical: 3,
		borderRadius: 6,
		marginLeft: 8,
	},
	statusBadgeClosed: {
		backgroundColor: "#FEE2E2",
	},
	statusBadgeText: {
		fontSize: 11,
		fontWeight: "700",
		color: "#065F46",
	},
	statusBadgeTextClosed: {
		color: "#991B1B",
	},
	warningText: {
		fontSize: 13,
		color: "#DC2626",
		marginTop: 8,
		fontWeight: "500",
	},
	noAddress: {
		alignItems: "center",
		paddingVertical: 12,
	},
	noAddressText: {
		fontSize: 14,
		color: "#9CA3AF",
	},
	linkText: {
		fontSize: 14,
		color: "#2F8F4E",
		fontWeight: "600",
		marginTop: 6,
	},
	addressCard: {
		flexDirection: "row",
		alignItems: "center",
		padding: 12,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: "#F3F4F6",
		marginBottom: 8,
	},
	addressCardActive: {
		borderColor: "#2F8F4E",
		backgroundColor: "#F0FDF4",
	},
	radioOuter: {
		width: 22,
		height: 22,
		borderRadius: 11,
		borderWidth: 2,
		borderColor: "#D1D5DB",
		alignItems: "center",
		justifyContent: "center",
		marginRight: 12,
	},
	radioInner: {
		width: 12,
		height: 12,
		borderRadius: 6,
		backgroundColor: "#2F8F4E",
	},
	addressLabel: {
		fontSize: 15,
		fontWeight: "700",
		color: "#111827",
	},
	addressText: {
		fontSize: 13,
		color: "#6B7280",
		marginTop: 2,
	},
	defaultBadge: {
		backgroundColor: "#F0FDF4",
		paddingHorizontal: 8,
		paddingVertical: 3,
		borderRadius: 6,
		marginLeft: 8,
	},
	defaultBadgeText: {
		fontSize: 11,
		fontWeight: "600",
		color: "#1F6B3A",
	},
	input: {
		backgroundColor: "#F9FAFB",
		borderWidth: 1,
		borderColor: "#E5E7EB",
		borderRadius: 12,
		paddingHorizontal: 14,
		paddingVertical: 12,
		fontSize: 15,
		color: "#111827",
	},
	textArea: {
		minHeight: 80,
		textAlignVertical: "top",
	},
	summaryItem: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "flex-start",
		paddingVertical: 6,
	},
	summaryItemName: {
		fontSize: 14,
		fontWeight: "600",
		color: "#111827",
	},
	summaryItemMeta: {
		fontSize: 12,
		color: "#6B7280",
		marginTop: 1,
	},
	summaryItemPrice: {
		fontSize: 14,
		fontWeight: "700",
		color: "#111827",
		marginLeft: 12,
	},
	totals: {
		backgroundColor: "#FFFFFF",
		borderRadius: 16,
		padding: 16,
		marginBottom: 12,
		borderWidth: 1,
		borderColor: "#F3F4F6",
	},
	totalRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		paddingVertical: 6,
	},
	totalLabel: {
		fontSize: 14,
		color: "#6B7280",
	},
	totalValue: {
		fontSize: 14,
		fontWeight: "600",
		color: "#374151",
	},
	totalRowFinal: {
		borderTopWidth: 1,
		borderTopColor: "#F3F4F6",
		marginTop: 8,
		paddingTop: 12,
	},
	totalFinalLabel: {
		fontSize: 16,
		fontWeight: "800",
		color: "#111827",
	},
	totalFinalValue: {
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
		backgroundColor: "#FFFFFF",
		borderTopWidth: 1,
		borderTopColor: "#F3F4F6",
	},
	placeOrderBtn: {
		backgroundColor: "#2F8F4E",
		borderRadius: 16,
		paddingVertical: 16,
		alignItems: "center",
	},
	placeOrderBtnDisabled: {
		opacity: 0.5,
	},
	placeOrderBtnText: {
		fontSize: 16,
		fontWeight: "700",
		color: "#FFFFFF",
	},
	paymentRow: {
		flexDirection: "row",
		gap: 12,
	},
	paymentOption: {
		flex: 1,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		padding: 14,
		borderRadius: 12,
		borderWidth: 2,
		borderColor: "#E5E7EB",
		backgroundColor: "#F9FAFB",
	},
	paymentOptionActive: {
		borderColor: "#2F8F4E",
		backgroundColor: "#F0FDF4",
	},
	paymentIcon: {
		fontSize: 18,
		marginRight: 8,
	},
	paymentLabel: {
		fontSize: 15,
		fontWeight: "600",
		color: "#6B7280",
	},
	paymentLabelActive: {
		color: "#2F8F4E",
	},
	primaryBtn: {
		backgroundColor: "#2F8F4E",
		paddingHorizontal: 24,
		paddingVertical: 12,
		borderRadius: 12,
	},
	primaryBtnText: {
		fontSize: 15,
		fontWeight: "700",
		color: "#FFFFFF",
	},
});
