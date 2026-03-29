import { useState, useEffect } from "react";
import {
	View,
	Text,
	StyleSheet,
	TextInput,
	TouchableOpacity,
	Alert,
	ActivityIndicator,
	ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRiderProfile, updateVehicleInfo } from "@runam/shared/api/rider";
import type { RiderProfile, VehicleType } from "@runam/shared/types";

const vehicleOptions: { type: VehicleType; icon: string; label: string }[] = [
	{ type: "Bicycle", icon: "🚲", label: "Bicycle" },
	{ type: "Motorcycle", icon: "🏍️", label: "Motorcycle" },
	{ type: "Car", icon: "🚗", label: "Car" },
	{ type: "Van", icon: "🚐", label: "Van" },
];

export default function VehicleInfoScreen() {
	const router = useRouter();
	const queryClient = useQueryClient();
	const [vehicleType, setVehicleType] = useState<VehicleType | null>(null);
	const [licensePlate, setLicensePlate] = useState("");

	const { data: profile, isLoading } = useQuery<RiderProfile>({
		queryKey: ["rider", "profile"],
		queryFn: () => getRiderProfile(),
	});

	useEffect(() => {
		if (profile) {
			setVehicleType(profile.vehicleType);
			setLicensePlate(profile.licensePlate ?? "");
		}
	}, [profile]);

	const updateMutation = useMutation({
		mutationFn: () =>
			updateVehicleInfo({
				vehicleType: vehicleType!,
				licensePlate: licensePlate.trim() || undefined,
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["rider", "profile"] });
			Alert.alert("Success", "Vehicle information updated");
			router.back();
		},
		onError: (err: Error) => {
			Alert.alert("Error", err.message);
		},
	});

	const handleSave = () => {
		if (!vehicleType) {
			Alert.alert("Error", "Please select a vehicle type");
			return;
		}
		if (vehicleType !== "Bicycle" && !licensePlate.trim()) {
			Alert.alert("Error", "Please enter your license plate number");
			return;
		}
		updateMutation.mutate();
	};

	if (isLoading) {
		return (
			<View style={styles.centered}>
				<ActivityIndicator size="large" color="#3B82F6" />
			</View>
		);
	}

	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<View style={styles.header}>
				<TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
					<Text style={styles.backText}>‹ Back</Text>
				</TouchableOpacity>
				<Text style={styles.title}>Vehicle Information</Text>
				<View style={{ width: 60 }} />
			</View>

			<ScrollView
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
				keyboardShouldPersistTaps="handled">
				<Text style={styles.sectionLabel}>Vehicle Type</Text>
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

				{profile && (
					<View style={styles.statusCard}>
						<Text style={styles.statusLabel}>Verification Status</Text>
						<View
							style={[
								styles.statusBadge,
								{
									backgroundColor: profile.isVerified ? "#D1FAE5" : "#FEF3C7",
								},
							]}>
							<Text
								style={[
									styles.statusText,
									{ color: profile.isVerified ? "#10B981" : "#F59E0B" },
								]}>
								{profile.isVerified ? "✅ Verified" : "⏳ Pending Verification"}
							</Text>
						</View>
					</View>
				)}
			</ScrollView>

			<View style={styles.bottomBar}>
				<TouchableOpacity
					style={[
						styles.saveButton,
						updateMutation.isPending && styles.buttonDisabled,
					]}
					onPress={handleSave}
					disabled={updateMutation.isPending}
					activeOpacity={0.8}>
					{updateMutation.isPending ? (
						<ActivityIndicator color="#FFFFFF" />
					) : (
						<Text style={styles.saveButtonText}>Save Changes</Text>
					)}
				</TouchableOpacity>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: "#F9FAFB" },
	centered: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "#F9FAFB",
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 20,
		paddingVertical: 12,
		borderBottomWidth: 1,
		borderBottomColor: "#F3F4F6",
		backgroundColor: "#FFFFFF",
	},
	backBtn: { width: 60 },
	backText: { fontSize: 17, color: "#3B82F6", fontWeight: "600" },
	title: { fontSize: 18, fontWeight: "700", color: "#111827" },
	content: { padding: 20, paddingBottom: 40 },
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
		backgroundColor: "#FFFFFF",
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
	vehicleIcon: { fontSize: 36, marginBottom: 8 },
	vehicleLabel: { fontSize: 14, fontWeight: "600", color: "#6B7280" },
	vehicleLabelSelected: { color: "#3B82F6" },
	input: {
		backgroundColor: "#FFFFFF",
		borderWidth: 1,
		borderColor: "#E5E7EB",
		borderRadius: 12,
		paddingHorizontal: 16,
		paddingVertical: 14,
		fontSize: 16,
		color: "#111827",
		marginBottom: 24,
	},
	statusCard: {
		backgroundColor: "#FFFFFF",
		borderRadius: 14,
		padding: 18,
		borderWidth: 1,
		borderColor: "#F3F4F6",
	},
	statusLabel: {
		fontSize: 14,
		fontWeight: "600",
		color: "#6B7280",
		marginBottom: 8,
	},
	statusBadge: {
		alignSelf: "flex-start",
		paddingHorizontal: 14,
		paddingVertical: 6,
		borderRadius: 8,
	},
	statusText: { fontSize: 14, fontWeight: "600" },
	bottomBar: {
		padding: 20,
		paddingBottom: 24,
		backgroundColor: "#FFFFFF",
		borderTopWidth: 1,
		borderTopColor: "#F3F4F6",
	},
	saveButton: {
		backgroundColor: "#3B82F6",
		borderRadius: 12,
		paddingVertical: 16,
		alignItems: "center",
	},
	buttonDisabled: { opacity: 0.6 },
	saveButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
});
