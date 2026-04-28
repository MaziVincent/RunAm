import { useEffect, useState } from "react";
import {
	ActivityIndicator,
	FlatList,
	Modal,
	ScrollView,
	StyleSheet,
	Switch,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
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
import { geocodeAddress, reverseGeocodeLocation } from "../lib/geocoding";

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
	const [formError, setFormError] = useState<string | null>(null);
	const [pageMessage, setPageMessage] = useState<string | null>(null);
	const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

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
	}, [
		showEditor,
		editingAddress,
		formLatitude,
		formLongitude,
		lat,
		lng,
		requestLocation,
	]);

	const resetForm = () => {
		setEditingAddress(null);
		setLabel("Home");
		setAddress("");
		setIsDefault(addresses.length === 0);
		setFormLatitude(lat ?? null);
		setFormLongitude(lng ?? null);
		setFormError(null);
	};

	const closeEditor = () => {
		setShowEditor(false);
		resetForm();
	};

	const openCreateModal = () => {
		setPendingDeleteId(null);
		setEditingAddress(null);
		setLabel("Home");
		setAddress("");
		setIsDefault(addresses.length === 0);
		setFormLatitude(lat ?? null);
		setFormLongitude(lng ?? null);
		setShowEditor(true);
	};

	const openEditModal = (item: Address) => {
		setPendingDeleteId(null);
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
			router.replace(returnTo as any);
			return;
		}

		setPageMessage(
			wasEditing
				? "Address updated and ready to use."
				: "Address saved and ready to use.",
		);
	};

	const saveMutation = useMutation({
		mutationFn: async () => {
			if (!label.trim() || !address.trim()) {
				throw new Error("Enter a label and full address before saving.");
			}

			const addressChanged =
				!editingAddress || editingAddress.address.trim() !== address.trim();

			const resolvedCoordinates =
				addressChanged || formLatitude == null || formLongitude == null
					? await geocodeAddress(address.trim())
					: {
							latitude: formLatitude,
							longitude: formLongitude,
						};

			setFormLatitude(resolvedCoordinates.latitude);
			setFormLongitude(resolvedCoordinates.longitude);

			const payload = {
				label: label.trim(),
				address: address.trim(),
				latitude: resolvedCoordinates.latitude,
				longitude: resolvedCoordinates.longitude,
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
			setFormError(error?.message || "Please check the form and try again.");
		},
	});

	const setDefaultMutation = useMutation({
		mutationFn: (addressId: string) => setDefaultAddress(addressId),
		onSuccess: async () => {
			await refreshAddresses();
			setPageMessage("This address will now be used first at checkout.");
		},
		onError: (error: any) => {
			setPageMessage(error?.message || "Could not update the default address.");
		},
	});

	const deleteMutation = useMutation({
		mutationFn: (addressId: string) => deleteAddress(addressId),
		onSuccess: async () => {
			await refreshAddresses();
			setPendingDeleteId(null);
			setPageMessage("The saved address has been removed.");
		},
		onError: (error: any) => {
			setPageMessage(error?.message || "Could not delete the address.");
		},
	});

	const handleUseCurrentLocation = async () => {
		setFormError(null);
		await requestLocation(true);
		const nextLocation = useLocationStore.getState();
		if (nextLocation.lat != null && nextLocation.lng != null) {
			setFormLatitude(nextLocation.lat);
			setFormLongitude(nextLocation.lng);
			try {
				const resolvedAddress = await reverseGeocodeLocation(
					nextLocation.lat,
					nextLocation.lng,
				);
				if (resolvedAddress) {
					setAddress(resolvedAddress);
				}
			} catch {
				// Keep coordinates even if reverse geocoding fails.
			}
			return;
		}

		setFormError(
			nextLocation.error || "Enable location permissions and try again.",
		);
	};

	const confirmDelete = (item: Address) => {
		if (pendingDeleteId === item.id) {
			deleteMutation.mutate(item.id);
			return;
		}

		setPendingDeleteId(item.id);
		setPageMessage(`Tap delete again to remove ${item.label}.`);
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
				showsVerticalScrollIndicator={false}
				ListHeaderComponent={
					<>
						<View style={styles.heroCard}>
							<TouchableOpacity
								style={styles.backButton}
								onPress={() =>
									returnTo ? router.replace(returnTo as any) : router.back()
								}
								activeOpacity={0.82}>
								<Ionicons name="chevron-back" size={18} color="#DDF3E7" />
								<Text style={styles.backBtn}>
									{returnTo ? "Back to checkout" : "Back"}
								</Text>
							</TouchableOpacity>
							<Text style={styles.kicker}>Addresses</Text>
							<Text style={styles.title}>
								Keep delivery spots ready before you need them.
							</Text>
							<Text style={styles.subtitle}>
								Save home, office, and other repeat destinations so logistics
								and marketplace checkout stay fast.
							</Text>
						</View>
						<View style={styles.summaryRow}>
							<View style={styles.summaryCard}>
								<Text style={styles.summaryValue}>{addresses.length}</Text>
								<Text style={styles.summaryLabel}>Saved places</Text>
							</View>
							<View style={styles.summaryCard}>
								<Text style={styles.summaryValue}>
									{addresses.some((item) => item.isDefault) ? 1 : 0}
								</Text>
								<Text style={styles.summaryLabel}>Default address</Text>
							</View>
						</View>
						{returnTo ? (
							<View style={styles.checkoutBanner}>
								<Ionicons name="cart-outline" size={18} color="#19543B" />
								<Text style={styles.checkoutBannerText}>
									Save or update an address and you will be sent straight back
									to checkout.
								</Text>
							</View>
						) : null}
						{pageMessage ? (
							<View style={styles.feedbackBanner}>
								<Ionicons
									name="information-circle-outline"
									size={18}
									color="#19543B"
								/>
								<Text style={styles.feedbackBannerText}>{pageMessage}</Text>
							</View>
						) : null}
						<Text style={styles.sectionTitle}>Saved addresses</Text>
					</>
				}
				renderItem={({ item }) => (
					<View style={styles.addressCard}>
						<View style={styles.addressIcon}>
							<Ionicons
								name={
									item.label.toLowerCase().includes("work")
										? "business-outline"
										: "location-outline"
								}
								size={18}
								color="#19543B"
							/>
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
										<Text style={styles.defaultActionText}>
											Used by default
										</Text>
									</View>
								) : (
									<TouchableOpacity
										style={styles.actionButton}
										onPress={() => {
											setPendingDeleteId(null);
											setPageMessage(null);
											setDefaultMutation.mutate(item.id);
										}}
										disabled={
											setDefaultMutation.isPending || deleteMutation.isPending
										}>
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
									<Text
										style={[styles.actionButtonText, styles.deleteActionText]}>
										{pendingDeleteId === item.id ? "Tap again" : "Delete"}
									</Text>
								</TouchableOpacity>
							</View>
						</View>
					</View>
				)}
				ListEmptyComponent={
					isLoading ? (
						<View style={styles.centered}>
							<ActivityIndicator size="large" color="#19543B" />
						</View>
					) : (
						<View style={styles.emptyState}>
							<View style={styles.emptyIconWrap}>
								<Ionicons name="map-outline" size={28} color="#19543B" />
							</View>
							<Text style={styles.emptyTitle}>No saved addresses yet</Text>
							<Text style={styles.emptySubtitle}>
								Add your home, office, or another frequent destination before
								your next order.
							</Text>
						</View>
					)
				}
				ListFooterComponent={
					<TouchableOpacity
						style={styles.addButton}
						onPress={openCreateModal}
						activeOpacity={0.85}>
						<Ionicons name="add" size={18} color="#FFFFFF" />
						<Text style={styles.addButtonText}>Add address</Text>
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
						<ScrollView showsVerticalScrollIndicator={false}>
							<Text style={styles.modalTitle}>
								{editingAddress ? "Edit address" : "Add address"}
							</Text>
							<Text style={styles.modalSubtitle}>
								{editingAddress
									? "Update the label, address text, or default state for this saved place."
									: "Save a new destination now and reuse it across checkout later."}
							</Text>

							{formError ? (
								<View style={styles.formFeedback}>
									<Ionicons name="warning-outline" size={16} color="#B42318" />
									<Text style={styles.formFeedbackText}>{formError}</Text>
								</View>
							) : null}

							<Text style={styles.label}>Label</Text>
							<TextInput
								style={styles.input}
								placeholder="Home, Office, Mum's Place"
								placeholderTextColor="#9CA3AF"
								value={label}
								onChangeText={setLabel}
							/>

							<Text style={styles.label}>Full address</Text>
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
									<Text style={styles.coordinateLabel}>Latitude</Text>
									<Text style={styles.coordinateText}>
										{formLatitude != null ? formLatitude.toFixed(5) : "Not set"}
									</Text>
								</View>
								<View style={styles.coordinatePill}>
									<Text style={styles.coordinateLabel}>Longitude</Text>
									<Text style={styles.coordinateText}>
										{formLongitude != null
											? formLongitude.toFixed(5)
											: "Not set"}
									</Text>
								</View>
							</View>

							<TouchableOpacity
								style={styles.locationButton}
								onPress={() => void handleUseCurrentLocation()}
								activeOpacity={0.85}>
								<Ionicons name="locate-outline" size={18} color="#19543B" />
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
									thumbColor={isDefault ? "#19543B" : "#F8FAFC"}
								/>
							</View>

							<View style={styles.modalActions}>
								<TouchableOpacity
									style={styles.secondaryButton}
									onPress={closeEditor}
									activeOpacity={0.85}>
									<Text style={styles.secondaryButtonText}>Cancel</Text>
								</TouchableOpacity>
								<TouchableOpacity
									style={styles.primaryButton}
									onPress={() => saveMutation.mutate()}
									disabled={saveMutation.isPending}
									activeOpacity={0.85}>
									<Text style={styles.primaryButtonText}>
										{saveMutation.isPending
											? "Saving..."
											: editingAddress
												? "Save changes"
												: "Save address"}
									</Text>
								</TouchableOpacity>
							</View>
						</ScrollView>
					</View>
				</View>
			</Modal>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#F3F5EF",
	},
	content: {
		padding: 20,
		paddingBottom: 40,
		flexGrow: 1,
	},
	heroCard: {
		backgroundColor: "#103E2B",
		borderRadius: 30,
		padding: 22,
		marginBottom: 16,
	},
	backButton: {
		alignSelf: "flex-start",
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
		marginBottom: 18,
	},
	kicker: {
		fontSize: 12,
		fontWeight: "700",
		letterSpacing: 1.5,
		textTransform: "uppercase",
		color: "#A6E4C3",
	},
	summaryRow: {
		flexDirection: "row",
		gap: 12,
		marginBottom: 16,
	},
	summaryCard: {
		flex: 1,
		backgroundColor: "#FFFFFF",
		borderRadius: 22,
		padding: 18,
		borderWidth: 1,
		borderColor: "#E4E8DE",
	},
	summaryValue: {
		fontSize: 28,
		fontWeight: "800",
		color: "#142013",
	},
	summaryLabel: {
		fontSize: 13,
		color: "#667268",
		marginTop: 4,
	},
	sectionTitle: {
		fontSize: 16,
		fontWeight: "800",
		color: "#142013",
		marginBottom: 12,
	},
	checkoutBanner: {
		marginBottom: 16,
		backgroundColor: "#ECF5EF",
		borderRadius: 18,
		paddingHorizontal: 14,
		paddingVertical: 12,
		borderWidth: 1,
		borderColor: "#D8E9DC",
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
	},
	checkoutBannerText: {
		fontSize: 13,
		lineHeight: 19,
		color: "#19543B",
		fontWeight: "600",
		flex: 1,
	},
	feedbackBanner: {
		marginBottom: 16,
		backgroundColor: "#ECF5EF",
		borderRadius: 18,
		paddingHorizontal: 14,
		paddingVertical: 12,
		borderWidth: 1,
		borderColor: "#D8E9DC",
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
	},
	feedbackBannerText: {
		fontSize: 13,
		lineHeight: 19,
		color: "#19543B",
		fontWeight: "600",
		flex: 1,
	},
	backBtn: {
		fontSize: 14,
		fontWeight: "800",
		color: "#DDF3E7",
	},
	title: {
		fontSize: 28,
		fontWeight: "800",
		lineHeight: 33,
		letterSpacing: -0.8,
		color: "#FFFFFF",
		marginTop: 8,
	},
	subtitle: {
		fontSize: 14,
		lineHeight: 21,
		color: "#D6EFE1",
		marginTop: 8,
	},
	addressCard: {
		flexDirection: "row",
		backgroundColor: "#FFFFFF",
		borderRadius: 22,
		padding: 18,
		borderWidth: 1,
		borderColor: "#E4E8DE",
		marginBottom: 12,
	},
	addressIcon: {
		width: 42,
		height: 42,
		borderRadius: 14,
		backgroundColor: "#ECF5EF",
		alignItems: "center",
		justifyContent: "center",
		marginRight: 12,
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
		fontWeight: "800",
		color: "#142013",
		flex: 1,
	},
	addressText: {
		fontSize: 14,
		lineHeight: 20,
		color: "#667268",
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
		backgroundColor: "#ECF5EF",
		borderWidth: 1,
		borderColor: "#D8E9DC",
	},
	defaultActionText: {
		fontSize: 12,
		fontWeight: "800",
		color: "#19543B",
	},
	actionButton: {
		paddingHorizontal: 12,
		paddingVertical: 9,
		borderRadius: 999,
		backgroundColor: "#F7F8F4",
		borderWidth: 1,
		borderColor: "#E4E8DE",
	},
	actionButtonText: {
		fontSize: 12,
		fontWeight: "800",
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
		backgroundColor: "#DDF3E7",
	},
	defaultBadgeText: {
		fontSize: 11,
		fontWeight: "800",
		color: "#19543B",
	},
	centered: {
		paddingVertical: 48,
		alignItems: "center",
	},
	emptyState: {
		backgroundColor: "#FFFFFF",
		borderRadius: 22,
		paddingHorizontal: 24,
		paddingVertical: 28,
		alignItems: "center",
		borderWidth: 1,
		borderColor: "#E4E8DE",
		marginTop: 6,
	},
	emptyIconWrap: {
		width: 60,
		height: 60,
		borderRadius: 20,
		backgroundColor: "#ECF5EF",
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 12,
	},
	emptyTitle: {
		fontSize: 18,
		fontWeight: "800",
		color: "#142013",
	},
	emptySubtitle: {
		fontSize: 14,
		lineHeight: 21,
		color: "#667268",
		textAlign: "center",
		marginTop: 8,
	},
	addButton: {
		marginTop: 16,
		backgroundColor: "#19543B",
		paddingVertical: 15,
		borderRadius: 18,
		alignItems: "center",
		justifyContent: "center",
		flexDirection: "row",
		gap: 8,
	},
	addButtonText: {
		fontSize: 16,
		fontWeight: "800",
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
		maxHeight: "88%",
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
		color: "#142013",
		marginBottom: 8,
	},
	modalSubtitle: {
		fontSize: 14,
		lineHeight: 20,
		color: "#667268",
		marginBottom: 10,
	},
	formFeedback: {
		backgroundColor: "#FEF3F2",
		borderRadius: 14,
		padding: 12,
		borderWidth: 1,
		borderColor: "#F3C7C4",
		flexDirection: "row",
		alignItems: "flex-start",
		gap: 8,
		marginBottom: 6,
	},
	formFeedbackText: {
		flex: 1,
		fontSize: 12,
		lineHeight: 17,
		color: "#B42318",
	},
	label: {
		fontSize: 14,
		fontWeight: "700",
		color: "#374151",
		marginBottom: 8,
		marginTop: 10,
	},
	input: {
		backgroundColor: "#F7F8F4",
		borderWidth: 1,
		borderColor: "#E4E8DE",
		borderRadius: 14,
		paddingHorizontal: 14,
		paddingVertical: 14,
		fontSize: 15,
		color: "#142013",
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
		backgroundColor: "#F7F8F4",
		borderWidth: 1,
		borderColor: "#E4E8DE",
		borderRadius: 12,
		paddingHorizontal: 12,
		paddingVertical: 10,
	},
	coordinateLabel: {
		fontSize: 11,
		fontWeight: "700",
		textTransform: "uppercase",
		letterSpacing: 0.8,
		color: "#7A8579",
	},
	coordinateText: {
		fontSize: 13,
		fontWeight: "800",
		color: "#475569",
		marginTop: 6,
	},
	locationButton: {
		marginTop: 14,
		paddingVertical: 13,
		borderRadius: 14,
		alignItems: "center",
		backgroundColor: "#ECF5EF",
		borderWidth: 1,
		borderColor: "#D8E9DC",
		flexDirection: "row",
		justifyContent: "center",
		gap: 8,
	},
	locationButtonText: {
		fontSize: 14,
		fontWeight: "800",
		color: "#19543B",
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
		backgroundColor: "#EEF1EA",
	},
	secondaryButtonText: {
		fontSize: 15,
		fontWeight: "800",
		color: "#475569",
	},
	primaryButton: {
		flex: 1,
		paddingVertical: 15,
		borderRadius: 14,
		alignItems: "center",
		backgroundColor: "#19543B",
	},
	primaryButtonText: {
		fontSize: 15,
		fontWeight: "800",
		color: "#FFFFFF",
	},
});
