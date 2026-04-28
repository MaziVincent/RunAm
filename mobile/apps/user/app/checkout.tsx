import { useEffect, useMemo, useState } from "react";
import {
	ActivityIndicator,
	Linking,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@runam/shared/stores/auth-store";
import { useCartStore } from "@runam/shared/stores/cart-store";
import { createAddress, getAddresses } from "@runam/shared/api/addresses";
import {
	createMarketplaceOrder,
	getDeliveryEstimate,
} from "@runam/shared/api/errands";
import { getVendorById } from "@runam/shared/api/vendors";
import { getWallet } from "@runam/shared/api/wallet";
import type {
	Address,
	CartItem,
	CreateMarketplaceOrderRequest,
	CreateOrderItemRequest,
	MarketplaceOrderResult,
	Wallet,
} from "@runam/shared/types";
import AuthRequiredState from "./components/AuthRequiredState";
import BackHeader from "./components/BackHeader";
import EmptyState from "./components/EmptyState";
import HeroCard from "./components/HeroCard";
import SectionCard from "./components/SectionCard";
import StatusPill from "./components/StatusPill";
import StickyBottomBar from "./components/StickyBottomBar";
import { geocodeAddress } from "./lib/geocoding";

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

const PAYMENT_METHODS = [
	{
		value: 0,
		title: "Wallet",
		description: "Fastest option when you already have balance.",
		icon: "wallet-outline",
	},
	{
		value: 1,
		title: "Card",
		description:
			"Continue in a secure browser checkout after placing the order.",
		icon: "card-outline",
	},
] as const;

export default function CheckoutScreen() {
	const router = useRouter();
	const queryClient = useQueryClient();
	const { isAuthenticated } = useAuthStore();
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
	const [showInlineAddressForm, setShowInlineAddressForm] = useState(false);
	const [newAddressLabel, setNewAddressLabel] = useState("Home");
	const [newAddressText, setNewAddressText] = useState("");
	const [saveAsDefault, setSaveAsDefault] = useState(false);
	const [checkoutError, setCheckoutError] = useState<string | null>(null);
	const [addressFormError, setAddressFormError] = useState<string | null>(null);

	const { data: addresses, isLoading: loadingAddresses } = useQuery<Address[]>({
		queryKey: ["addresses"],
		queryFn: getAddresses,
		enabled: isAuthenticated,
	});

	useEffect(() => {
		if (!loadingAddresses && (addresses?.length ?? 0) === 0) {
			setShowInlineAddressForm(true);
		}
	}, [loadingAddresses, addresses]);

	const { data: vendor } = useQuery({
		queryKey: ["vendor", vendorId],
		queryFn: () => getVendorById(vendorId!),
		enabled: isAuthenticated && !!vendorId,
	});

	const { data: wallet } = useQuery<Wallet | null>({
		queryKey: ["wallet"],
		queryFn: getWallet,
		enabled: isAuthenticated,
	});

	const selectedAddress = useMemo(() => {
		if (!addresses || addresses.length === 0) {
			return null;
		}

		if (selectedAddressId) {
			return (
				addresses.find((address) => address.id === selectedAddressId) ?? null
			);
		}

		return addresses.find((address) => address.isDefault) ?? addresses[0];
	}, [addresses, selectedAddressId]);

	const orderedAddresses = useMemo(
		() =>
			[...(addresses ?? [])].sort(
				(first, second) => Number(second.isDefault) - Number(first.isDefault),
			),
		[addresses],
	);

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
	const deliveryFee = estimate?.estimatedPrice ?? 0;
	const total = subtotal + deliveryFee;
	const belowMinimum = vendor ? subtotal < vendor.minimumOrderAmount : false;
	const vendorClosed = vendor ? !vendor.isOpen : false;
	const walletUnavailable = paymentMethod === 0 && wallet?.isActive !== true;
	const insufficientWalletBalance =
		paymentMethod === 0 && wallet?.isActive === true && wallet.balance < total;

	const createAddressMutation = useMutation({
		mutationFn: async () => {
			if (!newAddressLabel.trim() || !newAddressText.trim()) {
				throw new Error("Enter a label and full address before saving.");
			}

			const coords = await geocodeAddress(newAddressText.trim());
			return createAddress({
				label: newAddressLabel.trim(),
				address: newAddressText.trim(),
				latitude: coords.latitude,
				longitude: coords.longitude,
				isDefault: saveAsDefault || (addresses?.length ?? 0) === 0,
			});
		},
		onSuccess: async (createdAddress) => {
			await queryClient.invalidateQueries({ queryKey: ["addresses"] });
			setSelectedAddressId(createdAddress.id);
			setShowInlineAddressForm(false);
			setNewAddressLabel("Home");
			setNewAddressText("");
			setSaveAsDefault(false);
			setAddressFormError(null);
		},
		onError: (error: any) => {
			setAddressFormError(
				error?.message || "Check the address details and try again.",
			);
		},
	});

	const orderMutation = useMutation({
		mutationFn: createMarketplaceOrder,
		onSuccess: async (result: MarketplaceOrderResult) => {
			const checkoutUrl = result.checkoutUrl ?? undefined;
			const errand = result.errand;
			setCheckoutError(null);
			clearCart();

			if (checkoutUrl) {
				router.replace({
					pathname: "/order-confirmation" as any,
					params: {
						errandId: errand.id,
						vendorName: vendorName ?? "",
						total: total.toString(),
						checkoutUrl,
						paymentPending: "true",
					},
				});

				try {
					await Linking.openURL(checkoutUrl);
				} catch {
					setCheckoutError(
						"We couldn't open the payment page automatically. Continue from the confirmation screen.",
					);
				}
				return;
			}

			router.replace({
				pathname: "/order-confirmation" as any,
				params: {
					errandId: errand.id,
					vendorName: vendorName ?? "",
					total: total.toString(),
				},
			});
		},
		onError: (error: any) => {
			let message = error?.message || "Something went wrong.";
			if (message.includes("closed")) {
				message = "This vendor is currently closed.";
			} else if (message.includes("Minimum order")) {
				message = `Your order does not meet the vendor minimum of ${formatCurrency(vendor?.minimumOrderAmount ?? 0)}.`;
			}
			setCheckoutError(message);
		},
	});

	const cannotPlaceOrder =
		orderMutation.isPending ||
		!selectedAddress ||
		vendorClosed ||
		belowMinimum ||
		walletUnavailable ||
		insufficientWalletBalance;

	const handlePlaceOrder = () => {
		setCheckoutError(null);

		if (!isAuthenticated || !vendorId || items.length === 0) {
			return;
		}

		if (vendorClosed) {
			setCheckoutError("This vendor is currently closed.");
			return;
		}

		if (belowMinimum && vendor) {
			setCheckoutError(
				`Add ${formatCurrency(vendor.minimumOrderAmount - subtotal)} more to continue.`,
			);
			return;
		}

		if (!selectedAddress) {
			setCheckoutError("Select or create a delivery address first.");
			return;
		}

		if (walletUnavailable) {
			setCheckoutError("Create your wallet first or switch to card payment.");
			return;
		}

		if (insufficientWalletBalance) {
			setCheckoutError("Top up your wallet or switch to card payment.");
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
			selectedExtrasJson:
				item.selectedExtras && item.selectedExtras.length > 0
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
				<EmptyState
					icon="cart-outline"
					title="Your cart is empty"
					description="Return to vendors and add items before checking out."
					actionLabel="Go home"
					onAction={() => router.replace("/(tabs)" as any)}
				/>
			</SafeAreaView>
		);
	}

	if (!isAuthenticated) {
		return (
			<AuthRequiredState
				title="Log in to complete your order"
				description="You can browse vendors and build your cart as a guest. Sign in to place this order."
				redirectTo="/checkout"
				showBack
			/>
		);
	}

	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<BackHeader
				title="Checkout"
				onBack={() => router.back()}
				rightSlot={
					<TouchableOpacity
						style={styles.headerButton}
						onPress={() => router.push("/(tabs)/wallet" as any)}>
						<Ionicons name="wallet-outline" size={20} color="#142013" />
					</TouchableOpacity>
				}
			/>

			<ScrollView
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}>
				<HeroCard
					kicker="Marketplace checkout"
					title="Finish with fewer dead ends."
					subtitle="Choose a delivery address, confirm payment method, and review the full order before you submit."
					style={styles.heroCard}
				/>

				{checkoutError ? (
					<View style={styles.feedbackCard}>
						<Ionicons name="alert-circle-outline" size={18} color="#B42318" />
						<Text style={styles.feedbackText}>{checkoutError}</Text>
					</View>
				) : null}

				{selectedAddress ? (
					<View style={styles.confidenceRow}>
						<View style={styles.confidenceCard}>
							<Text style={styles.confidenceLabel}>ETA</Text>
							<Text style={styles.confidenceValue}>
								{loadingEstimate
									? "Calculating"
									: estimate?.estimatedDurationMinutes
										? `${estimate.estimatedDurationMinutes} min`
										: "Pending"}
							</Text>
						</View>
						<View style={styles.confidenceCard}>
							<Text style={styles.confidenceLabel}>Delivery fee</Text>
							<Text style={styles.confidenceValue}>
								{loadingEstimate
									? "Calculating"
									: deliveryFee > 0
										? formatCurrency(deliveryFee)
										: "Free"}
							</Text>
						</View>
						<View style={styles.confidenceCard}>
							<Text style={styles.confidenceLabel}>Dropoff</Text>
							<Text style={styles.confidenceValue} numberOfLines={1}>
								{selectedAddress.label}
							</Text>
						</View>
					</View>
				) : null}

				<SectionCard
					title="Vendor"
					headerRight={
						<StatusPill
							label={vendorClosed ? "Closed" : "Open"}
							tone={vendorClosed ? "danger" : "success"}
						/>
					}
					style={styles.sectionCard}
					headerSpacing={8}>
					<Text style={styles.vendorName}>{vendorName}</Text>
					<View style={styles.vendorMetaRow}>
						<View style={styles.metaChip}>
							<Ionicons name="basket-outline" size={14} color="#19543B" />
							<Text style={styles.metaChipText}>{items.length} items</Text>
						</View>
						{vendor?.minimumOrderAmount ? (
							<View style={styles.metaChip}>
								<Ionicons name="cash-outline" size={14} color="#19543B" />
								<Text style={styles.metaChipText}>
									Min {formatCurrency(vendor.minimumOrderAmount)}
								</Text>
							</View>
						) : null}
						{estimate?.estimatedDurationMinutes ? (
							<View style={styles.metaChip}>
								<Ionicons name="time-outline" size={14} color="#19543B" />
								<Text style={styles.metaChipText}>
									{estimate.estimatedDurationMinutes} min
								</Text>
							</View>
						) : null}
					</View>
					{vendorClosed ? (
						<Text style={styles.warningText}>
							This vendor is currently closed. Orders cannot be placed right
							now.
						</Text>
					) : null}
					{belowMinimum && vendor && !vendorClosed ? (
						<Text style={styles.warningText}>
							Add {formatCurrency(vendor.minimumOrderAmount - subtotal)} more to
							reach the minimum order.
						</Text>
					) : null}
				</SectionCard>

				<SectionCard
					title="Delivery address"
					actionLabel={showInlineAddressForm ? "Hide form" : "Add new"}
					onActionPress={() => setShowInlineAddressForm((value) => !value)}
					style={styles.sectionCard}>
					{loadingAddresses ? (
						<View style={styles.loadingRow}>
							<ActivityIndicator size="small" color="#19543B" />
						</View>
					) : orderedAddresses.length > 0 ? (
						<View style={styles.addressList}>
							{orderedAddresses.map((address) => {
								const isSelected = selectedAddress?.id === address.id;
								return (
									<TouchableOpacity
										key={address.id}
										style={[
											styles.addressCard,
											isSelected && styles.addressCardActive,
										]}
										onPress={() => setSelectedAddressId(address.id)}
										activeOpacity={0.82}>
										<View
											style={[
												styles.radioOuter,
												isSelected && styles.radioOuterActive,
											]}>
											{isSelected ? <View style={styles.radioInner} /> : null}
										</View>
										<View style={styles.addressContent}>
											<Text style={styles.addressLabel}>{address.label}</Text>
											<Text style={styles.addressText} numberOfLines={2}>
												{address.address}
											</Text>
										</View>
										{address.isDefault ? (
											<Text style={styles.defaultText}>Default</Text>
										) : null}
									</TouchableOpacity>
								);
							})}
						</View>
					) : (
						<View style={styles.emptyInlineState}>
							<Text style={styles.emptyInlineTitle}>
								No saved addresses yet
							</Text>
							<Text style={styles.emptyInlineCopy}>
								Create one below and keep checkout moving without leaving this
								screen.
							</Text>
						</View>
					)}

					{showInlineAddressForm ? (
						<View style={styles.inlineForm}>
							{addressFormError ? (
								<View style={styles.inlineFormError}>
									<Ionicons name="warning-outline" size={16} color="#B42318" />
									<Text style={styles.inlineFormErrorText}>
										{addressFormError}
									</Text>
								</View>
							) : null}
							<TextInput
								style={styles.input}
								placeholder="Label"
								placeholderTextColor="#9CA3AF"
								value={newAddressLabel}
								onChangeText={setNewAddressLabel}
							/>
							<TextInput
								style={[styles.input, styles.textArea]}
								placeholder="Full delivery address"
								placeholderTextColor="#9CA3AF"
								value={newAddressText}
								onChangeText={setNewAddressText}
								multiline
								numberOfLines={3}
							/>
							<TouchableOpacity
								style={styles.defaultRow}
								onPress={() => {
									setAddressFormError(null);
									setSaveAsDefault((value) => !value);
								}}
								activeOpacity={0.82}>
								<Ionicons
									name={saveAsDefault ? "checkmark-circle" : "ellipse-outline"}
									size={20}
									color={saveAsDefault ? "#19543B" : "#9CA3AF"}
								/>
								<Text style={styles.defaultRowText}>
									Save as default address
								</Text>
							</TouchableOpacity>
							<TouchableOpacity
								style={[
									styles.primaryButton,
									createAddressMutation.isPending &&
										styles.primaryButtonDisabled,
								]}
								onPress={() => createAddressMutation.mutate()}
								disabled={createAddressMutation.isPending}
								activeOpacity={0.85}>
								{createAddressMutation.isPending ? (
									<ActivityIndicator color="#FFFFFF" />
								) : (
									<Text style={styles.primaryButtonText}>Save address</Text>
								)}
							</TouchableOpacity>
						</View>
					) : null}
				</SectionCard>

				<SectionCard title="Recipient details" style={styles.sectionCard}>
					<TextInput
						style={styles.input}
						placeholder="Recipient name"
						placeholderTextColor="#9CA3AF"
						value={recipientName}
						onChangeText={setRecipientName}
					/>
					<TextInput
						style={styles.input}
						placeholder="Recipient phone"
						placeholderTextColor="#9CA3AF"
						value={recipientPhone}
						onChangeText={setRecipientPhone}
						keyboardType="phone-pad"
					/>
					<TextInput
						style={[styles.input, styles.textArea]}
						placeholder="Delivery notes or rider instructions"
						placeholderTextColor="#9CA3AF"
						value={specialInstructions}
						onChangeText={setSpecialInstructions}
						multiline
						numberOfLines={3}
					/>
					<TextInput
						style={styles.input}
						placeholder="Promo code"
						placeholderTextColor="#9CA3AF"
						value={promoCode}
						onChangeText={setPromoCode}
						autoCapitalize="characters"
					/>
				</SectionCard>

				<SectionCard
					title="Payment method"
					actionLabel="Open wallet"
					onActionPress={() => router.push("/(tabs)/wallet" as any)}
					style={styles.sectionCard}>
					<View style={styles.paymentList}>
						{PAYMENT_METHODS.map((method) => {
							const isSelected = paymentMethod === method.value;
							const isWallet = method.value === 0;
							return (
								<TouchableOpacity
									key={method.value}
									style={[
										styles.paymentCard,
										isSelected && styles.paymentCardActive,
									]}
									onPress={() => setPaymentMethod(method.value)}
									activeOpacity={0.82}>
									<View
										style={[
											styles.paymentIconWrap,
											isSelected && styles.paymentIconWrapActive,
										]}>
										<Ionicons
											name={method.icon}
											size={20}
											color={isSelected ? "#FFFFFF" : "#19543B"}
										/>
									</View>
									<View style={styles.paymentCardContent}>
										<Text style={styles.paymentTitle}>{method.title}</Text>
										<Text style={styles.paymentDescription}>
											{method.description}
										</Text>
										{isWallet ? (
											<Text style={styles.paymentMeta}>
												{wallet?.isActive
													? `Balance ${formatCurrency(wallet.balance)}`
													: "Wallet setup required"}
											</Text>
										) : (
											<Text style={styles.paymentMeta}>
												Checkout continues in your browser
											</Text>
										)}
									</View>
									<Ionicons
										name={isSelected ? "radio-button-on" : "radio-button-off"}
										size={20}
										color={isSelected ? "#19543B" : "#9CA3AF"}
									/>
								</TouchableOpacity>
							);
						})}
					</View>
					{walletUnavailable ? (
						<Text style={styles.warningText}>
							Create your wallet before using wallet payment, or switch to card.
						</Text>
					) : null}
					{insufficientWalletBalance ? (
						<Text style={styles.warningText}>
							Wallet balance is too low for this total. Top up or switch to
							card.
						</Text>
					) : null}
				</SectionCard>

				<SectionCard title="Order summary" style={styles.sectionCard}>
					<View style={styles.orderItemsList}>
						{items.map((item) => (
							<View key={item.cartItemId} style={styles.orderItemRow}>
								<View style={styles.orderItemInfo}>
									<Text style={styles.orderItemName}>
										{item.quantity}x {item.product.name}
									</Text>
									{item.selectedVariants && item.selectedVariants.length > 0 ? (
										<Text style={styles.orderItemMeta}>
											{item.selectedVariants
												.map(
													(variant) =>
														`${variant.name}: ${variant.option.label}`,
												)
												.join(", ")}
										</Text>
									) : null}
								</View>
								<Text style={styles.orderItemPrice}>
									{formatCurrency(getItemUnitPrice(item) * item.quantity)}
								</Text>
							</View>
						))}
					</View>
				</SectionCard>

				<View style={styles.footerSpacer} />
			</ScrollView>

			<StickyBottomBar>
				<View style={styles.summaryTopRow}>
					<View>
						<Text style={styles.bottomSummaryLabel}>Delivering to</Text>
						<Text style={styles.bottomSummaryValue} numberOfLines={1}>
							{selectedAddress?.label || "Select address"}
						</Text>
					</View>
					<View style={styles.bottomTotalWrap}>
						<Text style={styles.bottomSummaryLabel}>Total</Text>
						<Text style={styles.bottomTotalValue}>{formatCurrency(total)}</Text>
					</View>
				</View>
				<View style={styles.summaryBreakdown}>
					<Text style={styles.breakdownText}>
						Subtotal {formatCurrency(subtotal)}
					</Text>
					<Text style={styles.breakdownText}>
						Delivery{" "}
						{loadingEstimate
							? "Calculating..."
							: deliveryFee > 0
								? formatCurrency(deliveryFee)
								: selectedAddress
									? "Free"
									: "Pending"}
					</Text>
				</View>
				<TouchableOpacity
					style={[
						styles.primaryButton,
						cannotPlaceOrder && styles.primaryButtonDisabled,
					]}
					onPress={handlePlaceOrder}
					disabled={cannotPlaceOrder}
					activeOpacity={0.85}>
					{orderMutation.isPending ? (
						<ActivityIndicator color="#FFFFFF" />
					) : (
						<Text style={styles.primaryButtonText}>
							{paymentMethod === 1
								? "Place order and continue to payment"
								: "Place order"}
						</Text>
					)}
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
	sectionCard: {
		marginBottom: 14,
	},
	feedbackCard: {
		backgroundColor: "#FEF3F2",
		borderRadius: 18,
		borderWidth: 1,
		borderColor: "#F3C7C4",
		padding: 14,
		marginBottom: 14,
		flexDirection: "row",
		alignItems: "flex-start",
		gap: 10,
	},
	feedbackText: {
		flex: 1,
		fontSize: 13,
		lineHeight: 18,
		color: "#B42318",
		fontWeight: "600",
	},
	confidenceRow: {
		flexDirection: "row",
		gap: 10,
		marginBottom: 14,
	},
	confidenceCard: {
		flex: 1,
		backgroundColor: "#FFFFFF",
		borderRadius: 18,
		borderWidth: 1,
		borderColor: "#E4E8DE",
		padding: 14,
	},
	confidenceLabel: {
		fontSize: 11,
		fontWeight: "700",
		letterSpacing: 0.8,
		textTransform: "uppercase",
		color: "#7A8579",
	},
	confidenceValue: {
		fontSize: 15,
		fontWeight: "800",
		color: "#142013",
		marginTop: 6,
	},
	vendorName: {
		fontSize: 17,
		fontWeight: "800",
		color: "#142013",
	},
	vendorMetaRow: {
		flexDirection: "row",
		gap: 8,
		flexWrap: "wrap",
		marginTop: 12,
	},
	metaChip: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		backgroundColor: "#EDF2EA",
		borderRadius: 999,
		paddingHorizontal: 12,
		paddingVertical: 8,
	},
	metaChipText: {
		fontSize: 12,
		fontWeight: "700",
		color: "#19543B",
	},
	warningText: {
		fontSize: 13,
		lineHeight: 19,
		color: "#B42318",
		marginTop: 12,
	},
	loadingRow: {
		paddingVertical: 10,
		alignItems: "center",
	},
	addressList: {
		gap: 10,
	},
	addressCard: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		borderRadius: 18,
		borderWidth: 1,
		borderColor: "#E4E8DE",
		padding: 14,
		backgroundColor: "#F9FBF7",
	},
	addressCardActive: {
		backgroundColor: "#EEF7F0",
		borderColor: "#19543B",
	},
	radioOuter: {
		width: 20,
		height: 20,
		borderRadius: 10,
		borderWidth: 2,
		borderColor: "#C7D0C2",
		alignItems: "center",
		justifyContent: "center",
	},
	radioOuterActive: {
		borderColor: "#19543B",
	},
	radioInner: {
		width: 8,
		height: 8,
		borderRadius: 4,
		backgroundColor: "#19543B",
	},
	addressContent: {
		flex: 1,
	},
	addressLabel: {
		fontSize: 15,
		fontWeight: "800",
		color: "#142013",
	},
	addressText: {
		fontSize: 13,
		lineHeight: 18,
		color: "#667268",
		marginTop: 3,
	},
	defaultText: {
		fontSize: 11,
		fontWeight: "800",
		color: "#19543B",
		textTransform: "uppercase",
		letterSpacing: 0.5,
	},
	emptyInlineState: {
		borderRadius: 18,
		backgroundColor: "#F9FBF7",
		padding: 14,
		borderWidth: 1,
		borderColor: "#E4E8DE",
	},
	emptyInlineTitle: {
		fontSize: 15,
		fontWeight: "800",
		color: "#142013",
	},
	emptyInlineCopy: {
		fontSize: 13,
		lineHeight: 18,
		color: "#667268",
		marginTop: 4,
	},
	inlineForm: {
		marginTop: 14,
		gap: 10,
	},
	inlineFormError: {
		backgroundColor: "#FEF3F2",
		borderRadius: 14,
		padding: 12,
		borderWidth: 1,
		borderColor: "#F3C7C4",
		flexDirection: "row",
		alignItems: "flex-start",
		gap: 8,
		marginBottom: 12,
	},
	inlineFormErrorText: {
		flex: 1,
		fontSize: 12,
		lineHeight: 17,
		color: "#B42318",
	},
	input: {
		backgroundColor: "#F7F8F4",
		borderWidth: 1,
		borderColor: "#E4E8DE",
		borderRadius: 16,
		paddingHorizontal: 14,
		paddingVertical: 14,
		fontSize: 15,
		color: "#142013",
		marginBottom: 10,
	},
	textArea: {
		minHeight: 88,
		textAlignVertical: "top",
	},
	defaultRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		marginBottom: 4,
	},
	defaultRowText: {
		fontSize: 13,
		fontWeight: "600",
		color: "#374151",
	},
	paymentList: {
		gap: 10,
	},
	paymentCard: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		borderRadius: 18,
		borderWidth: 1,
		borderColor: "#E4E8DE",
		padding: 14,
		backgroundColor: "#F9FBF7",
	},
	paymentCardActive: {
		borderColor: "#19543B",
		backgroundColor: "#EEF7F0",
	},
	paymentIconWrap: {
		width: 42,
		height: 42,
		borderRadius: 14,
		backgroundColor: "#EDF2EA",
		alignItems: "center",
		justifyContent: "center",
	},
	paymentIconWrapActive: {
		backgroundColor: "#19543B",
	},
	paymentCardContent: {
		flex: 1,
	},
	paymentTitle: {
		fontSize: 15,
		fontWeight: "800",
		color: "#142013",
	},
	paymentDescription: {
		fontSize: 13,
		lineHeight: 18,
		color: "#667268",
		marginTop: 2,
	},
	paymentMeta: {
		fontSize: 12,
		fontWeight: "700",
		color: "#19543B",
		marginTop: 6,
	},
	orderItemsList: {
		gap: 12,
	},
	orderItemRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		gap: 12,
	},
	orderItemInfo: {
		flex: 1,
	},
	orderItemName: {
		fontSize: 14,
		fontWeight: "700",
		color: "#142013",
	},
	orderItemMeta: {
		fontSize: 12,
		lineHeight: 17,
		color: "#7A8579",
		marginTop: 3,
	},
	orderItemPrice: {
		fontSize: 14,
		fontWeight: "800",
		color: "#142013",
	},
	summaryTopRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "flex-end",
		gap: 12,
	},
	bottomSummaryLabel: {
		fontSize: 11,
		fontWeight: "700",
		letterSpacing: 1,
		textTransform: "uppercase",
		color: "#7A8579",
	},
	bottomSummaryValue: {
		fontSize: 15,
		fontWeight: "800",
		color: "#142013",
		marginTop: 4,
		maxWidth: 180,
	},
	bottomTotalWrap: {
		alignItems: "flex-end",
	},
	bottomTotalValue: {
		fontSize: 22,
		fontWeight: "800",
		color: "#142013",
		marginTop: 4,
	},
	summaryBreakdown: {
		flexDirection: "row",
		justifyContent: "space-between",
		gap: 12,
		marginTop: 10,
		marginBottom: 12,
	},
	breakdownText: {
		fontSize: 12,
		color: "#667268",
	},
	primaryButton: {
		backgroundColor: "#19543B",
		borderRadius: 18,
		paddingVertical: 15,
		alignItems: "center",
		justifyContent: "center",
	},
	primaryButtonDisabled: {
		opacity: 0.45,
	},
	primaryButtonText: {
		fontSize: 15,
		fontWeight: "800",
		color: "#FFFFFF",
	},
	footerSpacer: {
		height: 168,
	},
});
