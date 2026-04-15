import { useState } from "react";
import {
	View,
	Text,
	TextInput,
	TouchableOpacity,
	StyleSheet,
	ScrollView,
	Alert,
	ActivityIndicator,
	Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import {
	onboardRider,
	uploadRiderSelfie,
	validateRiderBankAccount,
} from "@runam/shared/api/rider";
import type { VehicleType, RiderOnboardingRequest } from "@runam/shared/types";

const vehicleOptions: { type: VehicleType; icon: string; label: string }[] = [
	{ type: "Bicycle", icon: "🚲", label: "Bicycle" },
	{ type: "Motorcycle", icon: "🏍️", label: "Motorcycle" },
	{ type: "Car", icon: "🚗", label: "Car" },
	{ type: "Van", icon: "🚐", label: "Van" },
];

export default function RiderOnboardingScreen() {
	const router = useRouter();
	const [vehicleType, setVehicleType] = useState<VehicleType | null>(null);
	const [licensePlate, setLicensePlate] = useState("");
	const [nin, setNin] = useState("");
	const [selfiePreviewUri, setSelfiePreviewUri] = useState("");
	const [selfieUrl, setSelfieUrl] = useState("");
	const [address, setAddress] = useState("");
	const [city, setCity] = useState("");
	const [state, setState] = useState("");
	const [settlementBankName, setSettlementBankName] = useState("");
	const [settlementBankCode, setSettlementBankCode] = useState("");
	const [settlementAccountNumber, setSettlementAccountNumber] = useState("");
	const [settlementAccountName, setSettlementAccountName] = useState("");
	const [bankVerified, setBankVerified] = useState(false);
	const [agreedToTerms, setAgreedToTerms] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [isUploadingSelfie, setIsUploadingSelfie] = useState(false);
	const [isVerifyingBank, setIsVerifyingBank] = useState(false);

	const handleUploadSelfie = async () => {
		const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
		if (status !== "granted") {
			Alert.alert(
				"Permission Required",
				"Please allow photo library access to upload your passport photograph.",
			);
			return;
		}

		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ["images"],
			allowsEditing: true,
			aspect: [1, 1],
			quality: 0.8,
		});

		if (result.canceled || !result.assets[0]) {
			return;
		}

		const asset = result.assets[0];
		const extension = asset.uri.split(".").pop()?.toLowerCase() || "jpg";
		const mimeType =
			extension === "png"
				? "image/png"
				: extension === "webp"
					? "image/webp"
					: "image/jpeg";

		setSelfiePreviewUri(asset.uri);
		setIsUploadingSelfie(true);
		try {
			const uploadedUrl = await uploadRiderSelfie({
				uri: asset.uri,
				name: `rider-selfie-${Date.now()}.${extension}`,
				type: mimeType,
			});
			setSelfieUrl(uploadedUrl);
		} catch (error: any) {
			setSelfiePreviewUri("");
			setSelfieUrl("");
			Alert.alert(
				"Upload Failed",
				error?.message || "Failed to upload your passport photograph.",
			);
		} finally {
			setIsUploadingSelfie(false);
		}
	};

	const handleVerifyBank = async () => {
		if (!settlementBankCode.trim() || settlementAccountNumber.trim().length < 10) {
			Alert.alert(
				"Verify Account",
				"Enter a valid bank code and 10-digit account number first.",
			);
			return;
		}

		setIsVerifyingBank(true);
		try {
			const result = await validateRiderBankAccount(
				settlementBankCode.trim(),
				settlementAccountNumber.trim(),
			);

			if (!result.success || !result.accountName) {
				setBankVerified(false);
				Alert.alert(
					"Verification Failed",
					result.message ||
						"Could not verify this bank account. Check the details and try again.",
				);
				return;
			}

			setSettlementAccountName(result.accountName);
			setBankVerified(true);
		} catch (error: any) {
			setBankVerified(false);
			Alert.alert(
				"Verification Failed",
				error?.message || "Could not verify this bank account.",
			);
		} finally {
			setIsVerifyingBank(false);
		}
	};

	const handleSubmit = async () => {
		if (!vehicleType) {
			Alert.alert("Error", "Please select a vehicle type.");
			return;
		}

		if (vehicleType !== "Bicycle" && !licensePlate.trim()) {
			Alert.alert("Error", "Please enter your license plate number.");
			return;
		}

		if (nin.replace(/\D/g, "").length !== 11) {
			Alert.alert("Error", "Please enter a valid 11-digit NIN.");
			return;
		}

		if (!selfieUrl) {
			Alert.alert("Error", "Please upload your passport photograph.");
			return;
		}

		if (!address.trim() || !city.trim() || !state.trim()) {
			Alert.alert("Error", "Please enter your address, city, and state.");
			return;
		}

		if (
			!settlementBankName.trim() ||
			!settlementBankCode.trim() ||
			!settlementAccountNumber.trim() ||
			!settlementAccountName.trim()
		) {
			Alert.alert("Error", "Please enter your settlement bank details.");
			return;
		}

		if (!bankVerified) {
			Alert.alert(
				"Error",
				"Please verify your settlement account before submitting.",
			);
			return;
		}

		if (!agreedToTerms) {
			Alert.alert(
				"Error",
				"You must agree to the rider terms before submitting.",
			);
			return;
		}

		setIsLoading(true);
		try {
			const body: RiderOnboardingRequest = {
				vehicleType,
				licensePlate: licensePlate.trim() || undefined,
				nin: nin.replace(/\D/g, ""),
				selfieUrl,
				address: address.trim(),
				city: city.trim(),
				state: state.trim(),
				settlementBankCode: settlementBankCode.trim(),
				settlementBankName: settlementBankName.trim(),
				settlementAccountNumber: settlementAccountNumber.trim(),
				settlementAccountName: settlementAccountName.trim(),
				agreedToTerms: true,
			};

			await onboardRider(body);
			Alert.alert(
				"Application Submitted",
				"Your rider application has been submitted for review. You will be notified once approved.",
				[{ text: "OK", onPress: () => router.replace("/(tabs)") }],
			);
		} catch (error: any) {
			Alert.alert("Error", error?.message || "Failed to submit application.");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<SafeAreaView style={styles.container} edges={["bottom"]}>
			<ScrollView
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
				keyboardShouldPersistTaps="handled">
				<Text style={styles.title}>Become a Rider</Text>
				<Text style={styles.subtitle}>
					Complete your profile to start receiving delivery tasks and earning
					money.
				</Text>

				{/* Vehicle Type Selection */}
				<Text style={styles.sectionLabel}>Select Your Vehicle</Text>
				<View style={styles.vehicleGrid}>
					{vehicleOptions.map((option) => (
						<TouchableOpacity
							key={option.type}
							style={[
								styles.vehicleCard,
								vehicleType === option.type && styles.vehicleCardSelected,
							]}
							onPress={() => setVehicleType(option.type)}
							activeOpacity={0.7}>
							<Text style={styles.vehicleIcon}>{option.icon}</Text>
							<Text
								style={[
									styles.vehicleLabel,
									vehicleType === option.type && styles.vehicleLabelSelected,
								]}>
								{option.label}
							</Text>
						</TouchableOpacity>
					))}
				</View>

				{/* License Plate */}
				{vehicleType && vehicleType !== "Bicycle" && (
					<>
						<Text style={styles.sectionLabel}>License Plate Number</Text>
						<TextInput
							style={styles.input}
							placeholder="e.g., ABC-123-XY"
							placeholderTextColor="#9CA3AF"
							value={licensePlate}
							onChangeText={setLicensePlate}
							autoCapitalize="characters"
						/>
					</>
				)}

				<Text style={styles.sectionLabel}>NIN</Text>
				<TextInput
					style={styles.input}
					placeholder="11-digit NIN"
					placeholderTextColor="#9CA3AF"
					value={nin}
					onChangeText={(value) => setNin(value.replace(/\D/g, ""))}
					keyboardType="number-pad"
					maxLength={11}
				/>

				<Text style={styles.sectionLabel}>Passport Photograph</Text>
				<TouchableOpacity
					style={styles.uploadCard}
					onPress={handleUploadSelfie}
					disabled={isUploadingSelfie}
					activeOpacity={0.7}>
					{isUploadingSelfie ? (
						<ActivityIndicator color="#2F8F4E" />
					) : selfiePreviewUri ? (
						<Image source={{ uri: selfiePreviewUri }} style={styles.selfiePreview} />
					) : (
						<Text style={styles.uploadIcon}>📷</Text>
					)}
					<View style={styles.uploadInfo}>
						<Text style={styles.uploadTitle}>Upload a clear passport photo</Text>
						<Text style={styles.uploadSubtitle}>
							JPEG, PNG, or WebP. This is used for identity verification.
						</Text>
					</View>
				</TouchableOpacity>

				<Text style={styles.sectionLabel}>Address</Text>
				<TextInput
					style={styles.input}
					placeholder="Street address"
					placeholderTextColor="#9CA3AF"
					value={address}
					onChangeText={setAddress}
				/>
				<TextInput
					style={styles.input}
					placeholder="City"
					placeholderTextColor="#9CA3AF"
					value={city}
					onChangeText={setCity}
				/>
				<TextInput
					style={styles.input}
					placeholder="State"
					placeholderTextColor="#9CA3AF"
					value={state}
					onChangeText={setState}
				/>

				<Text style={styles.sectionLabel}>Settlement Account</Text>
				<TextInput
					style={styles.input}
					placeholder="Bank name"
					placeholderTextColor="#9CA3AF"
					value={settlementBankName}
					onChangeText={(value) => {
						setSettlementBankName(value);
						setBankVerified(false);
					}}
				/>
				<TextInput
					style={styles.input}
					placeholder="Bank code"
					placeholderTextColor="#9CA3AF"
					value={settlementBankCode}
					onChangeText={(value) => {
						setSettlementBankCode(value);
						setBankVerified(false);
					}}
				/>
				<TextInput
					style={styles.input}
					placeholder="Account number"
					placeholderTextColor="#9CA3AF"
					value={settlementAccountNumber}
					onChangeText={(value) =>
						{
							setSettlementAccountNumber(value.replace(/\D/g, ""));
							setBankVerified(false);
						}
					}
					keyboardType="number-pad"
					maxLength={10}
				/>
				<TouchableOpacity
					style={styles.secondaryButton}
					onPress={handleVerifyBank}
					disabled={isVerifyingBank}
					activeOpacity={0.8}>
					{isVerifyingBank ? (
						<ActivityIndicator color="#2F8F4E" />
					) : (
						<Text style={styles.secondaryButtonText}>Verify Account</Text>
					)}
				</TouchableOpacity>
				<TextInput
					style={styles.input}
					placeholder="Account name"
					placeholderTextColor="#9CA3AF"
					value={settlementAccountName}
					onChangeText={setSettlementAccountName}
				/>
				<Text style={[styles.helperText, bankVerified && styles.helperTextSuccess]}>
					{bankVerified
						? `Verified account name: ${settlementAccountName}`
						: "Verify the account before you submit your application."}
				</Text>

				<TouchableOpacity
					style={styles.checkboxRow}
					onPress={() => setAgreedToTerms((value) => !value)}
					activeOpacity={0.8}>
					<View
						style={[
							styles.checkbox,
							agreedToTerms && styles.checkboxChecked,
						]}>
						{agreedToTerms && <Text style={styles.checkboxMark}>✓</Text>}
					</View>
					<Text style={styles.checkboxLabel}>
						I agree to the rider terms, verification checks, and payout policy.
					</Text>
				</TouchableOpacity>

				<Text style={styles.disclaimer}>
					By submitting, you agree to our Terms of Service and confirm that the
					information provided is accurate. Your application will be reviewed
					within 24–48 hours.
				</Text>
			</ScrollView>

			{/* Submit Button */}
			<View style={styles.bottomBar}>
				<TouchableOpacity
					style={[styles.submitButton, isLoading && styles.buttonDisabled]}
					onPress={handleSubmit}
					disabled={isLoading}
					activeOpacity={0.8}>
					{isLoading ? (
						<ActivityIndicator color="#FFFFFF" />
					) : (
						<Text style={styles.submitButtonText}>Submit Application</Text>
					)}
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
	content: {
		padding: 20,
		paddingBottom: 24,
	},
	title: {
		fontSize: 28,
		fontWeight: "800",
		color: "#111827",
		marginBottom: 8,
	},
	subtitle: {
		fontSize: 15,
		color: "#6B7280",
		lineHeight: 22,
		marginBottom: 28,
	},
	sectionLabel: {
		fontSize: 16,
		fontWeight: "700",
		color: "#374151",
		marginBottom: 12,
	},
	vehicleGrid: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 12,
		marginBottom: 24,
	},
	vehicleCard: {
		width: "47%",
		backgroundColor: "#F9FAFB",
		borderRadius: 14,
		padding: 20,
		alignItems: "center",
		borderWidth: 2,
		borderColor: "#E5E7EB",
	},
	vehicleCardSelected: {
		borderColor: "#2F8F4E",
		backgroundColor: "#F0FDF4",
	},
	vehicleIcon: {
		fontSize: 36,
		marginBottom: 10,
	},
	vehicleLabel: {
		fontSize: 15,
		fontWeight: "600",
		color: "#374151",
	},
	vehicleLabelSelected: {
		color: "#2F8F4E",
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
		marginBottom: 16,
	},
	uploadCard: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#F9FAFB",
		borderRadius: 12,
		padding: 14,
		borderWidth: 1,
		borderColor: "#E5E7EB",
		marginBottom: 24,
	},
	selfiePreview: {
		width: 56,
		height: 56,
		borderRadius: 28,
		marginRight: 14,
	},
	uploadIcon: {
		fontSize: 28,
		marginRight: 14,
	},
	uploadInfo: {
		flex: 1,
	},
	uploadTitle: {
		fontSize: 14,
		fontWeight: "700",
		color: "#374151",
	},
	uploadSubtitle: {
		fontSize: 12,
		color: "#6B7280",
		marginTop: 4,
		lineHeight: 18,
	},
	secondaryButton: {
		borderWidth: 1,
		borderColor: "#2F8F4E",
		borderRadius: 12,
		paddingVertical: 14,
		alignItems: "center",
		marginBottom: 16,
	},
	secondaryButtonText: {
		fontSize: 15,
		fontWeight: "700",
		color: "#2F8F4E",
	},
	helperText: {
		fontSize: 12,
		color: "#6B7280",
		marginBottom: 24,
	},
	helperTextSuccess: {
		color: "#15803D",
	},
	checkboxRow: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 20,
	},
	checkbox: {
		width: 24,
		height: 24,
		borderRadius: 6,
		borderWidth: 2,
		borderColor: "#D1D5DB",
		alignItems: "center",
		justifyContent: "center",
		marginRight: 14,
	},
	checkboxChecked: {
		backgroundColor: "#2F8F4E",
		borderColor: "#2F8F4E",
	},
	checkboxMark: {
		color: "#FFFFFF",
		fontSize: 14,
		fontWeight: "700",
	},
	checkboxLabel: {
		flex: 1,
		fontSize: 14,
		color: "#374151",
		lineHeight: 20,
	},
	disclaimer: {
		fontSize: 13,
		color: "#9CA3AF",
		lineHeight: 20,
		textAlign: "center",
	},
	bottomBar: {
		paddingHorizontal: 20,
		paddingVertical: 16,
		borderTopWidth: 1,
		borderTopColor: "#F3F4F6",
		backgroundColor: "#FFFFFF",
	},
	submitButton: {
		backgroundColor: "#2F8F4E",
		borderRadius: 14,
		paddingVertical: 18,
		alignItems: "center",
	},
	buttonDisabled: {
		opacity: 0.6,
	},
	submitButtonText: {
		fontSize: 17,
		fontWeight: "700",
		color: "#FFFFFF",
	},
});
