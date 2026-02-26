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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import apiClient from "@runam/shared/api/client";
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
	const [isLoading, setIsLoading] = useState(false);

	const handleSubmit = async () => {
		if (!vehicleType) {
			Alert.alert("Error", "Please select a vehicle type.");
			return;
		}

		if (vehicleType !== "Bicycle" && !licensePlate.trim()) {
			Alert.alert("Error", "Please enter your license plate number.");
			return;
		}

		setIsLoading(true);
		try {
			const body: RiderOnboardingRequest = {
				vehicleType,
				licensePlate: licensePlate.trim() || undefined,
				documentUrls: [], // TODO: Implement document upload
			};

			await apiClient.post("/riders/onboard", body);
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

				{/* Document Upload Placeholder */}
				<Text style={styles.sectionLabel}>Required Documents</Text>
				<View style={styles.documentSection}>
					{["Government ID", "Driver's License", "Vehicle Registration"].map(
						(doc, idx) => (
							<TouchableOpacity
								key={idx}
								style={styles.documentCard}
								activeOpacity={0.7}>
								<View style={styles.documentIcon}>
									<Text style={styles.documentIconText}>📎</Text>
								</View>
								<View style={styles.documentInfo}>
									<Text style={styles.documentName}>{doc}</Text>
									<Text style={styles.documentStatus}>Tap to upload</Text>
								</View>
								<Text style={styles.uploadArrow}>↑</Text>
							</TouchableOpacity>
						),
					)}
				</View>

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
		borderColor: "#3B82F6",
		backgroundColor: "#EFF6FF",
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
		color: "#3B82F6",
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
		marginBottom: 24,
	},
	documentSection: {
		gap: 10,
		marginBottom: 24,
	},
	documentCard: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#F9FAFB",
		borderRadius: 12,
		padding: 14,
		borderWidth: 1,
		borderColor: "#E5E7EB",
		borderStyle: "dashed",
	},
	documentIcon: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: "#EFF6FF",
		alignItems: "center",
		justifyContent: "center",
		marginRight: 14,
	},
	documentIconText: {
		fontSize: 18,
	},
	documentInfo: {
		flex: 1,
	},
	documentName: {
		fontSize: 14,
		fontWeight: "600",
		color: "#374151",
	},
	documentStatus: {
		fontSize: 12,
		color: "#9CA3AF",
		marginTop: 2,
	},
	uploadArrow: {
		fontSize: 18,
		color: "#3B82F6",
		fontWeight: "700",
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
		backgroundColor: "#3B82F6",
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
