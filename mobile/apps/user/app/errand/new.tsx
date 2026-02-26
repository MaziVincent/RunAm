import { useState, useRef } from "react";
import {
	View,
	Text,
	TextInput,
	TouchableOpacity,
	StyleSheet,
	ScrollView,
	Switch,
	Alert,
	ActivityIndicator,
	KeyboardAvoidingView,
	Platform,
	Image,
	Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import apiClient from "@runam/shared/api/client";
import type {
	CreateErrandRequest,
	ErrandCategory,
	PriceEstimate,
	Errand,
	PaymentMethod,
	ApplyPromoResult,
} from "@runam/shared/types";
import { useQuery } from "@tanstack/react-query";

type Step = 1 | 2 | 3 | 4;

type DeliveryPriority = "Standard" | "Express" | "Scheduled";
type PaymentOption = "Wallet" | "Card" | "Cash";

export default function NewErrandScreen() {
	const router = useRouter();
	const { category } = useLocalSearchParams<{ category?: string }>();

	const [step, setStep] = useState<Step>(1);
	const [isLoading, setIsLoading] = useState(false);
	const [priceEstimate, setPriceEstimate] = useState<PriceEstimate | null>(
		null,
	);

	// Step 1 – Addresses
	const [pickupAddress, setPickupAddress] = useState("");
	const [pickupContactName, setPickupContactName] = useState("");
	const [pickupContactPhone, setPickupContactPhone] = useState("");
	const [pickupInstructions, setPickupInstructions] = useState("");
	const [dropoffAddress, setDropoffAddress] = useState("");
	const [dropoffContactName, setDropoffContactName] = useState("");
	const [dropoffContactPhone, setDropoffContactPhone] = useState("");
	const [dropoffInstructions, setDropoffInstructions] = useState("");

	// Step 2 – Package Details
	const [description, setDescription] = useState("");
	const [packageDescription, setPackageDescription] = useState("");
	const [weight, setWeight] = useState("");
	const [dimensions, setDimensions] = useState("");
	const [isFragile, setIsFragile] = useState(false);
	const [requiresSignature, setRequiresSignature] = useState(false);
	const [packageImages, setPackageImages] = useState<string[]>([]);

	// Step 3 – Delivery options
	const [priority, setPriority] = useState<DeliveryPriority>("Standard");
	const [scheduledDate, setScheduledDate] = useState("");
	const [scheduledTime, setScheduledTime] = useState("");

	// Step 4 – Payment
	const [paymentOption, setPaymentOption] = useState<PaymentOption>("Wallet");
	const [promoCode, setPromoCode] = useState("");
	const [promoResult, setPromoResult] = useState<ApplyPromoResult | null>(null);
	const [isApplyingPromo, setIsApplyingPromo] = useState(false);

	const { data: paymentMethods } = useQuery<PaymentMethod[]>({
		queryKey: ["payment-methods"],
		queryFn: () => apiClient.get("/payments/methods"),
	});

	const pickImage = async () => {
		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ["images"],
			allowsMultipleSelection: true,
			quality: 0.7,
			selectionLimit: 3,
		});
		if (!result.canceled) {
			setPackageImages((prev) =>
				[...prev, ...result.assets.map((a) => a.uri)].slice(0, 3),
			);
		}
	};

	const takePhoto = async () => {
		const { status } = await ImagePicker.requestCameraPermissionsAsync();
		if (status !== "granted") {
			Alert.alert(
				"Permission needed",
				"Camera access is required to take photos.",
			);
			return;
		}
		const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
		if (!result.canceled) {
			setPackageImages((prev) => [...prev, result.assets[0].uri].slice(0, 3));
		}
	};

	const applyPromo = async () => {
		if (!promoCode.trim()) return;
		setIsApplyingPromo(true);
		try {
			const result = await apiClient.post<ApplyPromoResult>(
				"/promo-codes/apply",
				{
					code: promoCode.trim(),
					errandAmount: priceEstimate?.estimatedPrice ?? 0,
				},
			);
			setPromoResult(result);
			if (!result.valid) Alert.alert("Invalid Code", result.message);
		} catch (error: any) {
			Alert.alert("Error", error?.message || "Could not apply promo code.");
			setPromoResult(null);
		} finally {
			setIsApplyingPromo(false);
		}
	};

	const handleNext = async () => {
		if (step === 1) {
			if (!pickupAddress.trim() || !dropoffAddress.trim()) {
				Alert.alert("Error", "Please enter both pickup and dropoff addresses.");
				return;
			}
			setStep(2);
		} else if (step === 2) {
			if (!description.trim()) {
				Alert.alert("Error", "Please enter an errand description.");
				return;
			}
			setStep(3);
		} else if (step === 3) {
			if (priority === "Scheduled" && (!scheduledDate || !scheduledTime)) {
				Alert.alert("Error", "Please select a scheduled date and time.");
				return;
			}
			// Fetch price estimate
			setIsLoading(true);
			try {
				const estimate = await apiClient.get<PriceEstimate>(
					"/errands/estimate",
					{
						pickupAddress: pickupAddress.trim(),
						dropoffAddress: dropoffAddress.trim(),
						category: category || "PackageDelivery",
						priority,
					},
				);
				setPriceEstimate(estimate);
				setStep(4);
			} catch (error: any) {
				Alert.alert("Error", error?.message || "Failed to get price estimate.");
			} finally {
				setIsLoading(false);
			}
		}
	};

	const handleBack = () => {
		if (step > 1) setStep((s) => (s - 1) as Step);
	};

	const handleConfirm = async () => {
		setIsLoading(true);
		try {
			const body: CreateErrandRequest = {
				category: (category as ErrandCategory) || "PackageDelivery",
				description: description.trim(),
				stops: [
					{
						address: pickupAddress.trim(),
						latitude: 0,
						longitude: 0,
						contactName: pickupContactName.trim() || undefined,
						contactPhone: pickupContactPhone.trim() || undefined,
						instructions: pickupInstructions.trim() || undefined,
						stopOrder: 0,
						stopType: "Pickup",
					},
					{
						address: dropoffAddress.trim(),
						latitude: 0,
						longitude: 0,
						contactName: dropoffContactName.trim() || undefined,
						contactPhone: dropoffContactPhone.trim() || undefined,
						instructions: dropoffInstructions.trim() || undefined,
						stopOrder: 1,
						stopType: "Dropoff",
					},
				],
				packageDetails: {
					description: packageDescription.trim() || description.trim(),
					weight: weight ? parseFloat(weight) : undefined,
					dimensions: dimensions.trim() || undefined,
					isFragile,
					requiresSignature,
				},
			};

			const errand = await apiClient.post<Errand>("/errands", {
				...body,
				priority,
				paymentMethod: paymentOption,
				promoCode: promoResult?.valid ? promoCode.trim() : undefined,
				scheduledDate:
					priority === "Scheduled"
						? `${scheduledDate}T${scheduledTime}:00`
						: undefined,
			});
			Alert.alert("Success", "Your errand has been created!", [
				{
					text: "Track",
					onPress: () =>
						router.replace({
							pathname: "/errand/tracking" as any,
							params: { id: errand.id },
						}),
				},
				{ text: "OK", onPress: () => router.back() },
			]);
		} catch (error: any) {
			Alert.alert("Error", error?.message || "Failed to create errand.");
		} finally {
			setIsLoading(false);
		}
	};

	const discount = promoResult?.valid ? promoResult.discount : 0;
	const totalPrice = (priceEstimate?.estimatedPrice ?? 0) - discount;

	const renderStepIndicator = () => (
		<View style={styles.stepIndicator}>
			{[1, 2, 3, 4].map((s) => (
				<View key={s} style={styles.stepRow}>
					<View style={[styles.stepDot, s <= step && styles.stepDotActive]}>
						<Text
							style={[styles.stepNumber, s <= step && styles.stepNumberActive]}>
							{s}
						</Text>
					</View>
					{s < 4 && (
						<View
							style={[styles.stepLine, s < step && styles.stepLineActive]}
						/>
					)}
				</View>
			))}
		</View>
	);

	return (
		<SafeAreaView style={styles.container} edges={["bottom"]}>
			<KeyboardAvoidingView
				behavior={Platform.OS === "ios" ? "padding" : "height"}
				style={{ flex: 1 }}>
				<ScrollView
					contentContainerStyle={styles.scrollContent}
					showsVerticalScrollIndicator={false}
					keyboardShouldPersistTaps="handled">
					{renderStepIndicator()}

					{/* Step 1: Addresses */}
					{step === 1 && (
						<View style={styles.stepContent}>
							<Text style={styles.stepTitle}>Pickup & Dropoff</Text>

							<Text style={styles.sectionLabel}>📍 Pickup Location</Text>
							<TextInput
								style={styles.input}
								placeholder="Enter pickup address"
								placeholderTextColor="#9CA3AF"
								value={pickupAddress}
								onChangeText={setPickupAddress}
							/>
							<TextInput
								style={styles.input}
								placeholder="Contact name (optional)"
								placeholderTextColor="#9CA3AF"
								value={pickupContactName}
								onChangeText={setPickupContactName}
							/>
							<TextInput
								style={styles.input}
								placeholder="Contact phone (optional)"
								placeholderTextColor="#9CA3AF"
								value={pickupContactPhone}
								onChangeText={setPickupContactPhone}
								keyboardType="phone-pad"
							/>
							<TextInput
								style={[styles.input, styles.textArea]}
								placeholder="Pickup instructions (optional)"
								placeholderTextColor="#9CA3AF"
								value={pickupInstructions}
								onChangeText={setPickupInstructions}
								multiline
								numberOfLines={3}
							/>

							<Text style={styles.sectionLabel}>📦 Dropoff Location</Text>
							<TextInput
								style={styles.input}
								placeholder="Enter dropoff address"
								placeholderTextColor="#9CA3AF"
								value={dropoffAddress}
								onChangeText={setDropoffAddress}
							/>
							<TextInput
								style={styles.input}
								placeholder="Contact name (optional)"
								placeholderTextColor="#9CA3AF"
								value={dropoffContactName}
								onChangeText={setDropoffContactName}
							/>
							<TextInput
								style={styles.input}
								placeholder="Contact phone (optional)"
								placeholderTextColor="#9CA3AF"
								value={dropoffContactPhone}
								onChangeText={setDropoffContactPhone}
								keyboardType="phone-pad"
							/>
							<TextInput
								style={[styles.input, styles.textArea]}
								placeholder="Dropoff instructions (optional)"
								placeholderTextColor="#9CA3AF"
								value={dropoffInstructions}
								onChangeText={setDropoffInstructions}
								multiline
								numberOfLines={3}
							/>
						</View>
					)}

					{/* Step 2: Package Details */}
					{step === 2 && (
						<View style={styles.stepContent}>
							<Text style={styles.stepTitle}>Package Details</Text>

							<Text style={styles.label}>Errand Description</Text>
							<TextInput
								style={[styles.input, styles.textArea]}
								placeholder="Describe what you need done..."
								placeholderTextColor="#9CA3AF"
								value={description}
								onChangeText={setDescription}
								multiline
								numberOfLines={3}
							/>

							<Text style={styles.label}>Package Description</Text>
							<TextInput
								style={styles.input}
								placeholder="e.g., Small brown box"
								placeholderTextColor="#9CA3AF"
								value={packageDescription}
								onChangeText={setPackageDescription}
							/>

							<View style={styles.row}>
								<View style={styles.half}>
									<Text style={styles.label}>Weight (kg)</Text>
									<TextInput
										style={styles.input}
										placeholder="0.0"
										placeholderTextColor="#9CA3AF"
										value={weight}
										onChangeText={setWeight}
										keyboardType="decimal-pad"
									/>
								</View>
								<View style={styles.half}>
									<Text style={styles.label}>Dimensions</Text>
									<TextInput
										style={styles.input}
										placeholder="L×W×H cm"
										placeholderTextColor="#9CA3AF"
										value={dimensions}
										onChangeText={setDimensions}
									/>
								</View>
							</View>

							<View style={styles.switchRow}>
								<Text style={styles.switchLabel}>Fragile item</Text>
								<Switch
									value={isFragile}
									onValueChange={setIsFragile}
									trackColor={{ false: "#E5E7EB", true: "#93C5FD" }}
									thumbColor={isFragile ? "#3B82F6" : "#F9FAFB"}
								/>
							</View>

							<View style={styles.switchRow}>
								<Text style={styles.switchLabel}>Requires signature</Text>
								<Switch
									value={requiresSignature}
									onValueChange={setRequiresSignature}
									trackColor={{ false: "#E5E7EB", true: "#93C5FD" }}
									thumbColor={requiresSignature ? "#3B82F6" : "#F9FAFB"}
								/>
							</View>

							{/* Photo upload */}
							<Text style={styles.label}>Package Photos (optional)</Text>
							<View style={styles.photoRow}>
								{packageImages.map((uri, idx) => (
									<View key={idx} style={styles.photoWrapper}>
										<Image source={{ uri }} style={styles.photoThumb} />
										<TouchableOpacity
											style={styles.photoRemove}
											onPress={() =>
												setPackageImages((p) => p.filter((_, i) => i !== idx))
											}>
											<Text style={styles.photoRemoveText}>✕</Text>
										</TouchableOpacity>
									</View>
								))}
								{packageImages.length < 3 && (
									<View style={styles.photoActions}>
										<TouchableOpacity
											style={styles.photoAddBtn}
											onPress={pickImage}>
											<Text style={styles.photoAddIcon}>🖼️</Text>
											<Text style={styles.photoAddText}>Gallery</Text>
										</TouchableOpacity>
										<TouchableOpacity
											style={styles.photoAddBtn}
											onPress={takePhoto}>
											<Text style={styles.photoAddIcon}>📷</Text>
											<Text style={styles.photoAddText}>Camera</Text>
										</TouchableOpacity>
									</View>
								)}
							</View>
						</View>
					)}

					{/* Step 3: Delivery Options */}
					{step === 3 && (
						<View style={styles.stepContent}>
							<Text style={styles.stepTitle}>Delivery Options</Text>

							<Text style={styles.label}>Priority</Text>
							<View style={styles.priorityRow}>
								{(
									["Standard", "Express", "Scheduled"] as DeliveryPriority[]
								).map((p) => (
									<TouchableOpacity
										key={p}
										style={[
											styles.priorityCard,
											priority === p && styles.priorityCardActive,
										]}
										onPress={() => setPriority(p)}
										activeOpacity={0.7}>
										<Text style={styles.priorityIcon}>
											{p === "Standard" ? "🚗" : p === "Express" ? "⚡" : "📅"}
										</Text>
										<Text
											style={[
												styles.priorityLabel,
												priority === p && styles.priorityLabelActive,
											]}>
											{p}
										</Text>
										<Text style={styles.priorityDesc}>
											{p === "Standard"
												? "1-2 hours"
												: p === "Express"
													? "30 mins"
													: "Pick a time"}
										</Text>
									</TouchableOpacity>
								))}
							</View>

							{priority === "Scheduled" && (
								<>
									<Text style={styles.label}>Scheduled Date</Text>
									<TextInput
										style={styles.input}
										placeholder="YYYY-MM-DD"
										placeholderTextColor="#9CA3AF"
										value={scheduledDate}
										onChangeText={setScheduledDate}
									/>
									<Text style={styles.label}>Scheduled Time</Text>
									<TextInput
										style={styles.input}
										placeholder="HH:MM (24h)"
										placeholderTextColor="#9CA3AF"
										value={scheduledTime}
										onChangeText={setScheduledTime}
									/>
								</>
							)}
						</View>
					)}

					{/* Step 4: Confirm & Pay */}
					{step === 4 && priceEstimate && (
						<View style={styles.stepContent}>
							<Text style={styles.stepTitle}>Confirm & Pay</Text>

							<View style={styles.summaryCard}>
								<View style={styles.summaryRow}>
									<Text style={styles.summaryLabel}>Pickup</Text>
									<Text style={styles.summaryValue} numberOfLines={2}>
										{pickupAddress}
									</Text>
								</View>
								<View style={styles.summaryRow}>
									<Text style={styles.summaryLabel}>Dropoff</Text>
									<Text style={styles.summaryValue} numberOfLines={2}>
										{dropoffAddress}
									</Text>
								</View>
								<View style={styles.divider} />
								<View style={styles.summaryRow}>
									<Text style={styles.summaryLabel}>Distance</Text>
									<Text style={styles.summaryValue}>
										{priceEstimate.distanceKm.toFixed(1)} km
									</Text>
								</View>
								<View style={styles.summaryRow}>
									<Text style={styles.summaryLabel}>Est. Duration</Text>
									<Text style={styles.summaryValue}>
										{priceEstimate.estimatedDurationMinutes} mins
									</Text>
								</View>
								<View style={styles.summaryRow}>
									<Text style={styles.summaryLabel}>Priority</Text>
									<Text style={styles.summaryValue}>{priority}</Text>
								</View>
								<View style={styles.divider} />
								<View style={styles.summaryRow}>
									<Text style={styles.summaryLabel}>Subtotal</Text>
									<Text style={styles.summaryValue}>
										{priceEstimate.currency}{" "}
										{priceEstimate.estimatedPrice.toLocaleString()}
									</Text>
								</View>
								{discount > 0 && (
									<View style={styles.summaryRow}>
										<Text style={[styles.summaryLabel, { color: "#10B981" }]}>
											Discount
										</Text>
										<Text style={[styles.summaryValue, { color: "#10B981" }]}>
											-{priceEstimate.currency} {discount.toLocaleString()}
										</Text>
									</View>
								)}
								<View style={styles.divider} />
								<View style={styles.summaryRow}>
									<Text style={styles.priceLabel}>Total</Text>
									<Text style={styles.priceValue}>
										{priceEstimate.currency} {totalPrice.toLocaleString()}
									</Text>
								</View>
							</View>

							{/* Promo Code */}
							<Text style={styles.sectionLabel}>🎟️ Promo Code</Text>
							<View style={styles.promoRow}>
								<TextInput
									style={[styles.input, { flex: 1, marginBottom: 0 }]}
									placeholder="Enter promo code"
									placeholderTextColor="#9CA3AF"
									value={promoCode}
									onChangeText={(t) => {
										setPromoCode(t);
										setPromoResult(null);
									}}
									autoCapitalize="characters"
								/>
								<TouchableOpacity
									style={styles.promoApplyBtn}
									onPress={applyPromo}
									disabled={isApplyingPromo || !promoCode.trim()}>
									{isApplyingPromo ? (
										<ActivityIndicator color="#FFF" size="small" />
									) : (
										<Text style={styles.promoApplyText}>Apply</Text>
									)}
								</TouchableOpacity>
							</View>
							{promoResult?.valid && (
								<Text style={styles.promoSuccess}>
									✅ {promoResult.message}
								</Text>
							)}

							{/* Payment Method */}
							<Text style={styles.sectionLabel}>💳 Payment Method</Text>
							{(["Wallet", "Card", "Cash"] as PaymentOption[]).map((opt) => (
								<TouchableOpacity
									key={opt}
									style={[
										styles.paymentOption,
										paymentOption === opt && styles.paymentOptionActive,
									]}
									onPress={() => setPaymentOption(opt)}>
									<Text style={styles.paymentIcon}>
										{opt === "Wallet" ? "👛" : opt === "Card" ? "💳" : "💵"}
									</Text>
									<View style={{ flex: 1 }}>
										<Text style={styles.paymentLabel}>
											{opt === "Wallet"
												? "Wallet Balance"
												: opt === "Card"
													? "Debit/Credit Card"
													: "Cash on Delivery"}
										</Text>
										{opt === "Card" &&
											paymentMethods?.find((m) => m.type === "Card") && (
												<Text style={styles.paymentSub}>
													****{" "}
													{paymentMethods.find((m) => m.type === "Card")?.last4}
												</Text>
											)}
									</View>
									<View
										style={[
											styles.radioOuter,
											paymentOption === opt && styles.radioOuterActive,
										]}>
										{paymentOption === opt && (
											<View style={styles.radioInner} />
										)}
									</View>
								</TouchableOpacity>
							))}
						</View>
					)}
				</ScrollView>

				{/* Bottom Buttons */}
				<View style={styles.bottomBar}>
					{step > 1 && (
						<TouchableOpacity
							style={styles.backButton}
							onPress={handleBack}
							activeOpacity={0.7}>
							<Text style={styles.backButtonText}>Back</Text>
						</TouchableOpacity>
					)}
					<TouchableOpacity
						style={[
							styles.nextButton,
							step === 1 && { flex: 1 },
							isLoading && styles.buttonDisabled,
						]}
						onPress={step === 4 ? handleConfirm : handleNext}
						disabled={isLoading}
						activeOpacity={0.8}>
						{isLoading ? (
							<ActivityIndicator color="#FFFFFF" />
						) : (
							<Text style={styles.nextButtonText}>
								{step === 4
									? `Pay ${priceEstimate?.currency ?? ""} ${totalPrice.toLocaleString()}`
									: "Continue"}
							</Text>
						)}
					</TouchableOpacity>
				</View>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#FFFFFF",
	},
	scrollContent: {
		padding: 20,
		paddingBottom: 24,
	},
	stepIndicator: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 28,
	},
	stepRow: {
		flexDirection: "row",
		alignItems: "center",
	},
	stepDot: {
		width: 32,
		height: 32,
		borderRadius: 16,
		backgroundColor: "#F3F4F6",
		alignItems: "center",
		justifyContent: "center",
	},
	stepDotActive: {
		backgroundColor: "#3B82F6",
	},
	stepNumber: {
		fontSize: 14,
		fontWeight: "700",
		color: "#9CA3AF",
	},
	stepNumberActive: {
		color: "#FFFFFF",
	},
	stepLine: {
		width: 48,
		height: 2,
		backgroundColor: "#F3F4F6",
		marginHorizontal: 4,
	},
	stepLineActive: {
		backgroundColor: "#3B82F6",
	},
	stepContent: {},
	stepTitle: {
		fontSize: 24,
		fontWeight: "800",
		color: "#111827",
		marginBottom: 20,
	},
	sectionLabel: {
		fontSize: 16,
		fontWeight: "700",
		color: "#374151",
		marginBottom: 10,
		marginTop: 8,
	},
	label: {
		fontSize: 14,
		fontWeight: "600",
		color: "#374151",
		marginBottom: 6,
	},
	input: {
		backgroundColor: "#F9FAFB",
		borderWidth: 1,
		borderColor: "#E5E7EB",
		borderRadius: 12,
		paddingHorizontal: 16,
		paddingVertical: 14,
		fontSize: 16,
		color: "#111827",
		marginBottom: 12,
	},
	textArea: {
		minHeight: 80,
		textAlignVertical: "top",
	},
	row: {
		flexDirection: "row",
		gap: 12,
	},
	half: {
		flex: 1,
	},
	switchRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		backgroundColor: "#F9FAFB",
		borderRadius: 12,
		paddingHorizontal: 16,
		paddingVertical: 14,
		marginBottom: 12,
		borderWidth: 1,
		borderColor: "#E5E7EB",
	},
	switchLabel: {
		fontSize: 15,
		fontWeight: "500",
		color: "#374151",
	},
	summaryCard: {
		backgroundColor: "#F9FAFB",
		borderRadius: 16,
		padding: 20,
		borderWidth: 1,
		borderColor: "#E5E7EB",
	},
	summaryRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "flex-start",
		marginBottom: 14,
	},
	summaryLabel: {
		fontSize: 14,
		color: "#6B7280",
		fontWeight: "500",
		width: 100,
	},
	summaryValue: {
		fontSize: 14,
		color: "#111827",
		fontWeight: "600",
		flex: 1,
		textAlign: "right",
	},
	divider: {
		height: 1,
		backgroundColor: "#E5E7EB",
		marginVertical: 8,
	},
	priceLabel: {
		fontSize: 16,
		fontWeight: "700",
		color: "#111827",
	},
	priceValue: {
		fontSize: 20,
		fontWeight: "800",
		color: "#3B82F6",
	},
	bottomBar: {
		flexDirection: "row",
		paddingHorizontal: 20,
		paddingVertical: 16,
		gap: 12,
		borderTopWidth: 1,
		borderTopColor: "#F3F4F6",
		backgroundColor: "#FFFFFF",
	},
	backButton: {
		flex: 0.4,
		paddingVertical: 16,
		borderRadius: 12,
		alignItems: "center",
		backgroundColor: "#F3F4F6",
	},
	backButtonText: {
		fontSize: 16,
		fontWeight: "600",
		color: "#374151",
	},
	nextButton: {
		flex: 0.6,
		paddingVertical: 16,
		borderRadius: 12,
		alignItems: "center",
		backgroundColor: "#3B82F6",
	},
	buttonDisabled: {
		opacity: 0.6,
	},
	nextButtonText: {
		fontSize: 16,
		fontWeight: "700",
		color: "#FFFFFF",
	},
	photoRow: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 10,
		marginBottom: 16,
	},
	photoWrapper: {
		position: "relative",
	},
	photoThumb: {
		width: 80,
		height: 80,
		borderRadius: 12,
		backgroundColor: "#F3F4F6",
	},
	photoRemove: {
		position: "absolute",
		top: -6,
		right: -6,
		backgroundColor: "#EF4444",
		width: 22,
		height: 22,
		borderRadius: 11,
		alignItems: "center",
		justifyContent: "center",
	},
	photoRemoveText: {
		color: "#FFF",
		fontSize: 12,
		fontWeight: "700",
	},
	photoActions: {
		flexDirection: "row",
		gap: 8,
	},
	photoAddBtn: {
		width: 80,
		height: 80,
		borderRadius: 12,
		borderWidth: 2,
		borderColor: "#E5E7EB",
		borderStyle: "dashed",
		alignItems: "center",
		justifyContent: "center",
	},
	photoAddIcon: {
		fontSize: 24,
		marginBottom: 2,
	},
	photoAddText: {
		fontSize: 10,
		color: "#9CA3AF",
		fontWeight: "600",
	},
	priorityRow: {
		flexDirection: "row",
		gap: 10,
		marginBottom: 20,
	},
	priorityCard: {
		flex: 1,
		backgroundColor: "#F9FAFB",
		borderRadius: 14,
		paddingVertical: 16,
		paddingHorizontal: 10,
		alignItems: "center",
		borderWidth: 2,
		borderColor: "#E5E7EB",
	},
	priorityCardActive: {
		borderColor: "#3B82F6",
		backgroundColor: "#EFF6FF",
	},
	priorityIcon: {
		fontSize: 24,
		marginBottom: 6,
	},
	priorityLabel: {
		fontSize: 13,
		fontWeight: "700",
		color: "#374151",
		marginBottom: 2,
	},
	priorityLabelActive: {
		color: "#3B82F6",
	},
	priorityDesc: {
		fontSize: 11,
		color: "#9CA3AF",
	},
	promoRow: {
		flexDirection: "row",
		gap: 10,
		alignItems: "center",
		marginBottom: 8,
	},
	promoApplyBtn: {
		backgroundColor: "#3B82F6",
		paddingVertical: 14,
		paddingHorizontal: 20,
		borderRadius: 12,
	},
	promoApplyText: {
		color: "#FFF",
		fontWeight: "700",
		fontSize: 14,
	},
	promoSuccess: {
		color: "#10B981",
		fontSize: 13,
		fontWeight: "600",
		marginBottom: 16,
	},
	paymentOption: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		backgroundColor: "#F9FAFB",
		borderRadius: 14,
		padding: 16,
		marginBottom: 10,
		borderWidth: 2,
		borderColor: "#E5E7EB",
	},
	paymentOptionActive: {
		borderColor: "#3B82F6",
		backgroundColor: "#EFF6FF",
	},
	paymentIcon: {
		fontSize: 24,
	},
	paymentLabel: {
		fontSize: 15,
		fontWeight: "600",
		color: "#111827",
	},
	paymentSub: {
		fontSize: 12,
		color: "#9CA3AF",
		marginTop: 2,
	},
	radioOuter: {
		width: 22,
		height: 22,
		borderRadius: 11,
		borderWidth: 2,
		borderColor: "#D1D5DB",
		alignItems: "center",
		justifyContent: "center",
	},
	radioOuterActive: {
		borderColor: "#3B82F6",
	},
	radioInner: {
		width: 12,
		height: 12,
		borderRadius: 6,
		backgroundColor: "#3B82F6",
	},
});
