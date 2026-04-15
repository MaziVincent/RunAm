import { useEffect, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	FlatList,
	Modal,
	StyleSheet,
	Switch,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	createAddress,
	deleteAddress,
	getAddresses,
	setDefaultAddress,
	updateAddress,
} from "@runam/shared/api/addresses";
import { useAuthStore } from "@runam/shared/stores/auth-store";
import { useLocationStore } from "@runam/shared/stores/location-store";
import type { Address } from "@runam/shared/types";
import AuthRequiredState from "../components/AuthRequiredState";

export default function SavedAddressesScreen() {
	const router = useRouter();
	const params = useLocalSearchParams<{ returnTo?: string }>();
	const queryClient = useQueryClient();
	const { isAuthenticated } = useAuthStore();
	const {
		lat,
		lng,
		loading: loadingLocation,
		error: locationError,
		request: requestLocation,
	} = useLocationStore();
	const returnTo =
		typeof params.returnTo === "string" ? params.returnTo : undefined;
	const authRedirect = returnTo
		? `/settings/addresses?returnTo=${encodeURIComponent(returnTo)}`
		: "/settings/addresses";

	const [showEditor, setShowEditor] = useState(false);
	const [editingAddress, setEditingAddress] = useState<Address | null>(null);
	const [label, setLabel] = useState("Home");
	const [address, setAddress] = useState("");
	const [isDefault, setIsDefault] = useState(false);
	const [formLatitude, setFormLatitude] = useState<number | null>(null);
	const [formLongitude, setFormLongitude] = useState<number | null>(null);

	const { data: addresses = [], isLoading } = useQuery<Address[]>({
		queryKey: ["addresses"],
		queryFn: getAddresses,
		enabled: isAuthenticated,
	});

	useEffect(() => {
		if (!showEditor) {
			return;
		}

		if (formLatitude == null && lat != null) {
			setFormLatitude(lat);
		}

		if (formLongitude == null && lng != null) {
			setFormLongitude(lng);
		}

		if ((lat == null || lng == null) && editingAddress == null) {
			void requestLocation();
		}
	}, [showEditor, editingAddress, formLatitude, formLongitude, lat, lng, requestLocation]);

	const resetForm = () => {
		setEditingAddress(null);
		setLabel("Home");
		setAddress("");
		setIsDefault(addresses.length === 0);
		setFormLatitude(lat ?? null);
		setFormLongitude(lng ?? null);
	};

	const closeEditor = () => {
		setShowEditor(false);
		resetForm();
	};

	const openCreateModal = () => {
		setEditingAddress(null);
		setLabel("Home");
		setAddress("");
		setIsDefault(addresses.length === 0);
		setFormLatitude(lat ?? null);
		setFormLongitude(lng ?? null);
		setShowEditor(true);
	};

	const openEditModal = (item: Address) => {
		setEditingAddress(item);
		setLabel(item.label);
		setAddress(item.address);
		setIsDefault(item.isDefault);
		setFormLatitude(item.latitude);
		setFormLongitude(item.longitude);
		setShowEditor(true);
	};

	const refreshAddresses = async () => {
		await queryClient.invalidateQueries({ queryKey: ["addresses"] });
	};

	const notifySaveSuccess = (wasEditing: boolean) => {
		if (returnTo) {
			Alert.alert("Address saved", "Your address is ready. Returning you to checkout.", [
				{
					text: "Continue",
					onPress: () => router.replace(returnTo as any),
				},
			]);
			return;
		}

		Alert.alert(
			wasEditing ? "Address updated" : "Address saved",
			wasEditing
				? "Your changes are ready to use."
				: "Your new address is ready to use.",
		);
	};

	const saveMutation = useMutation({
		mutationFn: async () => {
			if (!label.trim() || !address.trim()) {
				throw new Error("Enter a label and full address before saving.");
			}

			if (formLatitude == null || formLongitude == null) {
				throw new Error(
					"Location coordinates are required to save this address. Use your current location and try again.",
				);
			}

			const payload = {
				label: label.trim(),
				address: address.trim(),
				latitude: formLatitude,
				longitude: formLongitude,
				isDefault,
			};

			if (editingAddress) {
				return updateAddress(editingAddress.id, payload);
			}

			return createAddress(payload);
		},
		onSuccess: async () => {
			const wasEditing = Boolean(editingAddress);
			await refreshAddresses();
			setShowEditor(false);
			resetForm();
			notifySaveSuccess(wasEditing);
		},
		onError: (error: any) => {
			Alert.alert(
				editingAddress ? "Could not update address" : "Could not save address",
				error?.message || "Please check the form and try again.",
			);
		},
	});

	const setDefaultMutation = useMutation({
		mutationFn: (addressId: string) => setDefaultAddress(addressId),
		onSuccess: async () => {
			await refreshAddresses();
			Alert.alert("Default updated", "This address will now be used first at checkout.");
		},
		onError: (error: any) => {
			Alert.alert(
				"Could not update default",
				error?.message || "Please try again.",
			);
		},
	});

	const deleteMutation = useMutation({
		mutationFn: (addressId: string) => deleteAddress(addressId),
		onSuccess: async () => {
			await refreshAddresses();
			Alert.alert("Address deleted", "The saved address has been removed.");
		},
		onError: (error: any) => {
			Alert.alert(
				"Could not delete address",
				error?.message || "Please try again.",
			);
		},
	});

	const handleUseCurrentLocation = async () => {
		await requestLocation(true);
		const nextLocation = useLocationStore.getState();
		if (nextLocation.lat != null && nextLocation.lng != null) {
			setFormLatitude(nextLocation.lat);
			setFormLongitude(nextLocation.lng);
			return;
		}

		Alert.alert(
			"Location unavailable",
			nextLocation.error || "Enable location permissions and try again.",
		);
	};

	const confirmDelete = (item: Address) => {
		Alert.alert(
			"Delete address",
			`Remove ${item.label} from your saved addresses?`,
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Delete",
					style: "destructive",
					onPress: () => deleteMutation.mutate(item.id),
				},
			],
		);
	};

	if (!isAuthenticated) {
		return (
			<AuthRequiredState
				title="Sign in to manage addresses"
				description="Save delivery addresses for faster checkout and easier repeat orders."
				redirectTo={authRedirect}
				showBack
			/>
		);
	}

	return (
		<SafeAreaView style={styles.container} edges={["top", "bottom"]}>
			<FlatList
				data={addresses}
				keyExtractor={(item) => item.id}
				contentContainerStyle={styles.content}
				ListHeaderComponent={
					<View style={styles.header}>
						<TouchableOpacity
							onPress={() =>
								returnTo ? router.replace(returnTo as any) : router.back()
							}>
							<Text style={styles.backBtn}>
								{returnTo ? "← Back to Checkout" : "← Back"}
							</Text>
						</TouchableOpacity>
						<Text style={styles.title}>Saved Addresses</Text>
						<Text style={styles.subtitle}>
							Store your most-used delivery locations here so checkout stays quick.
						</Text>
						{returnTo ? (
							<View style={styles.checkoutBanner}>
								<Text style={styles.checkoutBannerText}>
									Save or update an address and you will be sent straight back to checkout.
								</Text>
							</View>
						) : null}
					</View>
				}
				renderItem={({ item }) => (
					<View style={styles.addressCard}>
						<View style={styles.addressIcon}>
							<Text style={styles.addressIconText}>📍</Text>
						</View>
						<View style={styles.addressContent}>
							<View style={styles.addressHeaderRow}>
								<Text style={styles.addressLabel}>{item.label}</Text>
								{item.isDefault ? (
									<View style={styles.defaultBadge}>
										<Text style={styles.defaultBadgeText}>Default</Text>
									</View>
								) : null}
							</View>
							<Text style={styles.addressText}>{item.address}</Text>
							<View style={styles.actionsRow}>
								{item.isDefault ? (
									<View style={styles.defaultActionPill}>
										<Text style={styles.defaultActionText}>Used by default</Text>
									</View>
								) : (
									<TouchableOpacity
										style={styles.actionButton}
										onPress={() => setDefaultMutation.mutate(item.id)}
										disabled={setDefaultMutation.isPending || deleteMutation.isPending}>
										<Text style={styles.actionButtonText}>Set Default</Text>
									</TouchableOpacity>
								)}
								<TouchableOpacity
									style={styles.actionButton}
									onPress={() => openEditModal(item)}
									disabled={saveMutation.isPending || deleteMutation.isPending}>
									<Text style={styles.actionButtonText}>Edit</Text>
								</TouchableOpacity>
								<TouchableOpacity
									style={[styles.actionButton, styles.deleteActionButton]}
									onPress={() => confirmDelete(item)}
									disabled={deleteMutation.isPending || saveMutation.isPending}>
									<Text style={[styles.actionButtonText, styles.deleteActionText]}>
										Delete
									</Text>
								</TouchableOpacity>
							</View>
						</View>
					</View>
				)}
				ListEmptyComponent={
					isLoading ? (
						<View style={styles.centered}>
							<ActivityIndicator size="large" color="#2F8F4E" />
						</View>
					) : (
						<View style={styles.emptyState}>
							<Text style={styles.emptyIcon}>📍</Text>
							<Text style={styles.emptyTitle}>No saved addresses yet</Text>
							<Text style={styles.emptySubtitle}>
								Add your home, office, or another frequent destination before your next order.
							</Text>
						</View>
					)
				}
				ListFooterComponent={
					<TouchableOpacity style={styles.addButton} onPress={openCreateModal}>
						<Text style={styles.addButtonText}>+ Add Address</Text>
					</TouchableOpacity>
				}
			/>

			<Modal
				visible={showEditor}
				animationType="slide"
				transparent
				onRequestClose={closeEditor}>
				<View style={styles.modalOverlay}>
					<View style={styles.modalContent}>
						<View style={styles.modalHandle} />
						<Text style={styles.modalTitle}>
							{editingAddress ? "Edit Address" : "Add Address"}
						</Text>

						<Text style={styles.label}>Label</Text>
						<TextInput
							style={styles.input}
							placeholder="Home, Office, Mum's Place"
							placeholderTextColor="#9CA3AF"
							value={label}
							onChangeText={setLabel}
						/>

						<Text style={styles.label}>Full Address</Text>
						<TextInput
							style={[styles.input, styles.textArea]}
							placeholder="Enter the full delivery address"
							placeholderTextColor="#9CA3AF"
							value={address}
							onChangeText={setAddress}
							multiline
						/>

						<View style={styles.coordinatesRow}>
							<View style={styles.coordinatePill}>
								<Text style={styles.coordinateText}>
									Lat: {formLatitude != null ? formLatitude.toFixed(5) : "Not set"}
								</Text>
							</View>
							<View style={styles.coordinatePill}>
								<Text style={styles.coordinateText}>
									Lng: {formLongitude != null ? formLongitude.toFixed(5) : "Not set"}
								</Text>
							</View>
						</View>

						<TouchableOpacity
							style={styles.locationButton}
							onPress={() => void handleUseCurrentLocation()}>
							<Text style={styles.locationButtonText}>
								{loadingLocation
									? "Getting your location..."
									: formLatitude != null && formLongitude != null
										? "Location ready for this address"
										: "Use current location"}
							</Text>
						</TouchableOpacity>
						{locationError ? (
							<Text style={styles.locationErrorText}>{locationError}</Text>
						) : null}

						<View style={styles.switchRow}>
							<View style={styles.switchTextWrap}>
								<Text style={styles.switchLabel}>Set as default</Text>
								<Text style={styles.switchHint}>
									Use this address automatically during checkout.
								</Text>
							</View>
							<Switch
								value={isDefault}
								onValueChange={setIsDefault}
								trackColor={{ false: "#CBD5E1", true: "#BBF7D0" }}
								thumbColor={isDefault ? "#2F8F4E" : "#F8FAFC"}
							/>
						</View>

						<View style={styles.modalActions}>
							<TouchableOpacity
								style={styles.secondaryButton}
								onPress={closeEditor}>
								<Text style={styles.secondaryButtonText}>Cancel</Text>
							</TouchableOpacity>
							<TouchableOpacity
								style={styles.primaryButton}
								onPress={() => saveMutation.mutate()}
								disabled={saveMutation.isPending}>
								<Text style={styles.primaryButtonText}>
									{saveMutation.isPending
										? "Saving..."
										: editingAddress
											? "Save Changes"
											: "Save Address"}
								</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#F8FAFC",
	},
	content: {
		padding: 20,
		paddingBottom: 40,
		flexGrow: 1,
	},
	header: {
		marginBottom: 18,
	},
	checkoutBanner: {
		marginTop: 14,
		backgroundColor: "#ECFDF3",
		borderRadius: 14,
		paddingHorizontal: 14,
		paddingVertical: 12,
		borderWidth: 1,
		borderColor: "#CFEAD7",
	},
	checkoutBannerText: {
		fontSize: 13,
		lineHeight: 19,
		color: "#166534",
		fontWeight: "600",
	},
	backBtn: {
		fontSize: 15,
		fontWeight: "600",
		color: "#2F8F4E",
	},
	title: {
		fontSize: 24,
		fontWeight: "800",
		color: "#111827",
		marginTop: 12,
	},
	subtitle: {
		fontSize: 14,
		lineHeight: 21,
		color: "#64748B",
		marginTop: 8,
	},
	addressCard: {
		flexDirection: "row",
		backgroundColor: "#FFFFFF",
		borderRadius: 18,
		padding: 16,
		borderWidth: 1,
		borderColor: "#E5E7EB",
		marginBottom: 12,
	},
	addressIcon: {
		width: 42,
		height: 42,
		borderRadius: 14,
		backgroundColor: "#ECFDF3",
		alignItems: "center",
		justifyContent: "center",
		marginRight: 12,
	},
	addressIconText: {
		fontSize: 18,
	},
	addressContent: {
		flex: 1,
	},
	addressHeaderRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: 12,
	},
	addressLabel: {
		fontSize: 16,
		fontWeight: "700",
		color: "#111827",
		flex: 1,
	},
	addressText: {
		fontSize: 13,
		lineHeight: 20,
		color: "#6B7280",
		marginTop: 6,
	},
	actionsRow: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 8,
		marginTop: 14,
	},
	defaultActionPill: {
		paddingHorizontal: 12,
		paddingVertical: 9,
		borderRadius: 999,
		backgroundColor: "#F0FDF4",
		borderWidth: 1,
		borderColor: "#CFEAD7",
	},
	defaultActionText: {
		fontSize: 12,
		fontWeight: "700",
		color: "#166534",
	},
	actionButton: {
		paddingHorizontal: 12,
		paddingVertical: 9,
		borderRadius: 999,
		backgroundColor: "#F8FAFC",
		borderWidth: 1,
		borderColor: "#D7DEE7",
	},
	actionButtonText: {
		fontSize: 12,
		fontWeight: "700",
		color: "#334155",
	},
	deleteActionButton: {
		backgroundColor: "#FEF2F2",
		borderColor: "#FECACA",
	},
	deleteActionText: {
		color: "#B91C1C",
	},
	defaultBadge: {
		paddingHorizontal: 10,
		paddingVertical: 5,
		borderRadius: 999,
		backgroundColor: "#DCFCE7",
	},
	defaultBadgeText: {
		fontSize: 11,
		fontWeight: "700",
		color: "#166534",
	},
	centered: {
		paddingVertical: 48,
		alignItems: "center",
	},
	emptyState: {
		backgroundColor: "#FFFFFF",
		borderRadius: 18,
		paddingHorizontal: 24,
		paddingVertical: 28,
		alignItems: "center",
		borderWidth: 1,
		borderColor: "#E5E7EB",
		marginTop: 6,
	},
	emptyIcon: {
		fontSize: 34,
		marginBottom: 10,
	},
	emptyTitle: {
		fontSize: 18,
		fontWeight: "800",
		color: "#111827",
	},
	emptySubtitle: {
		fontSize: 14,
		lineHeight: 21,
		color: "#6B7280",
		textAlign: "center",
		marginTop: 8,
	},
	addButton: {
		marginTop: 16,
		backgroundColor: "#2F8F4E",
		paddingVertical: 15,
		borderRadius: 14,
		alignItems: "center",
	},
	addButtonText: {
		fontSize: 16,
		fontWeight: "700",
		color: "#FFFFFF",
	},
	modalOverlay: {
		flex: 1,
		backgroundColor: "rgba(15, 23, 42, 0.4)",
		justifyContent: "flex-end",
	},
	modalContent: {
		backgroundColor: "#FFFFFF",
		borderTopLeftRadius: 28,
		borderTopRightRadius: 28,
		paddingHorizontal: 20,
		paddingTop: 12,
		paddingBottom: 28,
	},
	modalHandle: {
		alignSelf: "center",
		width: 48,
		height: 5,
		borderRadius: 999,
		backgroundColor: "#CBD5E1",
		marginBottom: 14,
	},
	modalTitle: {
		fontSize: 22,
		fontWeight: "800",
		color: "#111827",
		marginBottom: 18,
	},
	label: {
		fontSize: 14,
		fontWeight: "600",
		color: "#374151",
		marginBottom: 8,
		marginTop: 10,
	},
	input: {
		backgroundColor: "#F8FAFC",
		borderWidth: 1,
		borderColor: "#E5E7EB",
		borderRadius: 14,
		paddingHorizontal: 14,
		paddingVertical: 14,
		fontSize: 15,
		color: "#111827",
	},
	textArea: {
		minHeight: 96,
		textAlignVertical: "top",
	},
	coordinatesRow: {
		flexDirection: "row",
		gap: 10,
		marginTop: 14,
	},
	coordinatePill: {
		flex: 1,
		backgroundColor: "#F8FAFC",
		borderWidth: 1,
		borderColor: "#E5E7EB",
		borderRadius: 12,
		paddingHorizontal: 12,
		paddingVertical: 10,
	},
	coordinateText: {
		fontSize: 12,
		fontWeight: "600",
		color: "#475569",
	},
	locationButton: {
		marginTop: 14,
		paddingVertical: 13,
		borderRadius: 14,
		alignItems: "center",
		backgroundColor: "#ECFDF3",
		borderWidth: 1,
		borderColor: "#CFEAD7",
	},
	locationButtonText: {
		fontSize: 14,
		fontWeight: "700",
		color: "#166534",
	},
	locationErrorText: {
		fontSize: 12,
		lineHeight: 18,
		color: "#B45309",
		marginTop: 8,
	},
	switchRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingVertical: 14,
		marginTop: 8,
	},
	switchTextWrap: {
		flex: 1,
		marginRight: 12,
	},
	switchLabel: {
		fontSize: 15,
		fontWeight: "700",
		color: "#111827",
	},
	switchHint: {
		fontSize: 12,
		lineHeight: 18,
		color: "#6B7280",
		marginTop: 4,
	},
	modalActions: {
		flexDirection: "row",
		gap: 12,
		marginTop: 8,
	},
	secondaryButton: {
		flex: 1,
		paddingVertical: 15,
		borderRadius: 14,
		alignItems: "center",
		backgroundColor: "#F3F4F6",
	},
	secondaryButtonText: {
		fontSize: 15,
		fontWeight: "700",
		color: "#475569",
	},
	primaryButton: {
		flex: 1,
		paddingVertical: 15,
		borderRadius: 14,
		alignItems: "center",
		backgroundColor: "#2F8F4E",
	},
	primaryButtonText: {
		fontSize: 15,
		fontWeight: "700",
		color: "#FFFFFF",
	},
});