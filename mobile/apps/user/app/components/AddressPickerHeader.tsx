import { useEffect, useMemo, useState } from "react";
import {
	ActivityIndicator,
	FlatList,
	Modal,
	Pressable,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { getAddresses } from "@runam/shared/api/addresses";
import { useAuthStore } from "@runam/shared/stores/auth-store";
import { useDeliveryAddressStore } from "@runam/shared/stores/delivery-address-store";
import { useLocationStore } from "@runam/shared/stores/location-store";
import type { Address } from "@runam/shared/types";
import { colors, radii } from "../lib/design";

type AddressPickerHeaderProps = {
	notificationsCount?: number;
	cartCount?: number;
	onNotificationsPress?: () => void;
	onCartPress?: () => void;
};

export default function AddressPickerHeader({
	notificationsCount = 0,
	cartCount = 0,
	onNotificationsPress,
	onCartPress,
}: AddressPickerHeaderProps) {
	const router = useRouter();
	const { isAuthenticated } = useAuthStore();
	const {
		activeAddress,
		activeAddressId,
		setActive,
		hydrate: hydrateAddress,
		hydrated,
	} = useDeliveryAddressStore();
	const { error: locationError, request: requestLocation } = useLocationStore();
	const [pickerOpen, setPickerOpen] = useState(false);

	useEffect(() => {
		if (!hydrated) {
			void hydrateAddress();
		}
	}, [hydrated, hydrateAddress]);

	const { data: addresses, isLoading } = useQuery<Address[]>({
		queryKey: ["addresses"],
		queryFn: getAddresses,
		enabled: isAuthenticated,
	});

	useEffect(() => {
		if (!addresses || addresses.length === 0) return;
		if (activeAddress) return;
		const persisted = activeAddressId
			? addresses.find((entry) => entry.id === activeAddressId)
			: null;
		const next =
			persisted ?? addresses.find((entry) => entry.isDefault) ?? addresses[0];
		if (next) {
			setActive(next);
		}
	}, [addresses, activeAddress, activeAddressId, setActive]);

	const headerLabel = useMemo(() => {
		if (activeAddress) return activeAddress.label;
		if (!isAuthenticated) return "Set address";
		if (isLoading) return "Loading…";
		if (locationError) return "Add address";
		return "Choose address";
	}, [activeAddress, isAuthenticated, isLoading, locationError]);

	const headerSubtext = useMemo(() => {
		if (activeAddress) return activeAddress.address;
		return "Tap to set where to deliver";
	}, [activeAddress]);

	const handleSelect = (address: Address) => {
		setActive(address);
		setPickerOpen(false);
	};

	const handleAdd = () => {
		setPickerOpen(false);
		router.push("/settings/addresses" as any);
	};

	const handleUseLocation = () => {
		void requestLocation(true);
		setPickerOpen(false);
	};

	const openPicker = () => {
		if (!isAuthenticated) {
			router.push({
				pathname: "/(auth)/login",
				params: { redirect: "/(tabs)" },
			} as any);
			return;
		}
		setPickerOpen(true);
	};

	return (
		<>
			<View style={styles.container}>
				<TouchableOpacity
					style={styles.addressBlock}
					onPress={openPicker}
					activeOpacity={0.8}>
					<Text style={styles.eyebrow}>Deliver to</Text>
					<View style={styles.addressRow}>
						<Ionicons
							name="location"
							size={16}
							color={colors.brandAccent}
							style={styles.addressIcon}
						/>
						<Text style={styles.addressLabel} numberOfLines={1}>
							{headerLabel}
						</Text>
						<Ionicons
							name="chevron-down"
							size={16}
							color={colors.textPrimary}
						/>
					</View>
					<Text style={styles.addressSub} numberOfLines={1}>
						{headerSubtext}
					</Text>
				</TouchableOpacity>

				<View style={styles.actions}>
					{isAuthenticated && onNotificationsPress ? (
						<TouchableOpacity
							style={styles.iconButton}
							onPress={onNotificationsPress}
							activeOpacity={0.82}>
							<Ionicons
								name="notifications-outline"
								size={20}
								color={colors.textPrimary}
							/>
							{notificationsCount > 0 ? (
								<View style={styles.countBadge}>
									<Text style={styles.countBadgeText}>
										{Math.min(notificationsCount, 99)}
									</Text>
								</View>
							) : null}
						</TouchableOpacity>
					) : null}
					{onCartPress ? (
						<TouchableOpacity
							style={styles.iconButton}
							onPress={onCartPress}
							activeOpacity={0.82}>
							<Ionicons
								name="bag-handle-outline"
								size={20}
								color={colors.textPrimary}
							/>
							{cartCount > 0 ? (
								<View style={styles.countBadge}>
									<Text style={styles.countBadgeText}>
										{Math.min(cartCount, 99)}
									</Text>
								</View>
							) : null}
						</TouchableOpacity>
					) : null}
				</View>
			</View>

			<Modal
				visible={pickerOpen}
				transparent
				animationType="slide"
				onRequestClose={() => setPickerOpen(false)}>
				<Pressable
					style={styles.modalBackdrop}
					onPress={() => setPickerOpen(false)}>
					<Pressable
						style={styles.modalSheet}
						onPress={(event) => event.stopPropagation()}>
						<View style={styles.modalHandle} />
						<Text style={styles.modalTitle}>Deliver to</Text>
						<Text style={styles.modalSubtitle}>
							Pick a saved address or use your current location.
						</Text>

						{isLoading ? (
							<View style={styles.loadingWrap}>
								<ActivityIndicator color={colors.brandAccent} />
							</View>
						) : (
							<FlatList
								data={addresses ?? []}
								keyExtractor={(item) => item.id}
								ItemSeparatorComponent={() => (
									<View style={styles.modalSeparator} />
								)}
								renderItem={({ item }) => (
									<TouchableOpacity
										style={styles.addressItem}
										onPress={() => handleSelect(item)}
										activeOpacity={0.85}>
										<View style={styles.addressItemIcon}>
											<Ionicons
												name={
													item.label.toLowerCase().includes("home")
														? "home-outline"
														: item.label.toLowerCase().includes("work")
															? "briefcase-outline"
															: "location-outline"
												}
												size={18}
												color={colors.brandAccent}
											/>
										</View>
										<View style={styles.addressItemCopy}>
											<Text style={styles.addressItemLabel}>{item.label}</Text>
											<Text style={styles.addressItemAddress} numberOfLines={2}>
												{item.address}
											</Text>
										</View>
										{activeAddressId === item.id ? (
											<Ionicons
												name="checkmark-circle"
												size={20}
												color={colors.brandAccent}
											/>
										) : null}
									</TouchableOpacity>
								)}
								ListEmptyComponent={
									<View style={styles.emptyAddresses}>
										<Text style={styles.emptyAddressesTitle}>
											No saved addresses
										</Text>
										<Text style={styles.emptyAddressesCopy}>
											Add one and we'll use it for delivery estimates.
										</Text>
									</View>
								}
								scrollEnabled={false}
							/>
						)}

						<TouchableOpacity
							style={styles.actionRow}
							onPress={handleUseLocation}
							activeOpacity={0.85}>
							<Ionicons name="locate" size={18} color={colors.brandAccent} />
							<Text style={styles.actionRowText}>Use current location</Text>
						</TouchableOpacity>
						<TouchableOpacity
							style={styles.primaryAction}
							onPress={handleAdd}
							activeOpacity={0.85}>
							<Ionicons name="add" size={18} color="#FFFFFF" />
							<Text style={styles.primaryActionText}>Add new address</Text>
						</TouchableOpacity>
					</Pressable>
				</Pressable>
			</Modal>
		</>
	);
}

const styles = StyleSheet.create({
	container: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingTop: 12,
		marginBottom: 16,
		gap: 12,
	},
	addressBlock: {
		flex: 1,
	},
	eyebrow: {
		fontSize: 11,
		fontWeight: "700",
		letterSpacing: 1.4,
		textTransform: "uppercase",
		color: colors.textMuted,
		marginBottom: 2,
	},
	addressRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
	},
	addressIcon: {
		marginRight: 2,
	},
	addressLabel: {
		fontSize: 18,
		fontWeight: "800",
		color: colors.textPrimary,
		letterSpacing: -0.4,
		maxWidth: "80%",
	},
	addressSub: {
		fontSize: 12,
		color: colors.textSecondary,
		marginTop: 2,
	},
	actions: {
		flexDirection: "row",
		gap: 10,
	},
	iconButton: {
		width: 42,
		height: 42,
		borderRadius: 21,
		backgroundColor: colors.surface,
		borderWidth: 1,
		borderColor: colors.border,
		alignItems: "center",
		justifyContent: "center",
	},
	countBadge: {
		position: "absolute",
		top: 2,
		right: 2,
		minWidth: 18,
		height: 18,
		borderRadius: 9,
		backgroundColor: colors.error,
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: 4,
	},
	countBadgeText: {
		fontSize: 10,
		fontWeight: "800",
		color: colors.white,
	},
	modalBackdrop: {
		flex: 1,
		backgroundColor: "rgba(20, 32, 19, 0.45)",
		justifyContent: "flex-end",
	},
	modalSheet: {
		backgroundColor: colors.background,
		borderTopLeftRadius: 28,
		borderTopRightRadius: 28,
		paddingTop: 12,
		paddingHorizontal: 20,
		paddingBottom: 28,
	},
	modalHandle: {
		alignSelf: "center",
		width: 38,
		height: 4,
		borderRadius: 2,
		backgroundColor: colors.border,
		marginBottom: 12,
	},
	modalTitle: {
		fontSize: 20,
		fontWeight: "800",
		color: colors.textPrimary,
		letterSpacing: -0.4,
	},
	modalSubtitle: {
		fontSize: 13,
		lineHeight: 18,
		color: colors.textSecondary,
		marginTop: 4,
		marginBottom: 16,
	},
	loadingWrap: {
		paddingVertical: 24,
		alignItems: "center",
	},
	addressItem: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		paddingVertical: 12,
	},
	addressItemIcon: {
		width: 38,
		height: 38,
		borderRadius: 12,
		backgroundColor: colors.brandSoft,
		alignItems: "center",
		justifyContent: "center",
	},
	addressItemCopy: {
		flex: 1,
	},
	addressItemLabel: {
		fontSize: 15,
		fontWeight: "800",
		color: colors.textPrimary,
	},
	addressItemAddress: {
		fontSize: 12,
		lineHeight: 17,
		color: colors.textSecondary,
		marginTop: 2,
	},
	modalSeparator: {
		height: 1,
		backgroundColor: colors.border,
	},
	emptyAddresses: {
		paddingVertical: 18,
	},
	emptyAddressesTitle: {
		fontSize: 14,
		fontWeight: "800",
		color: colors.textPrimary,
	},
	emptyAddressesCopy: {
		fontSize: 12,
		color: colors.textSecondary,
		marginTop: 4,
	},
	actionRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
		paddingVertical: 14,
		borderRadius: radii.lg,
		backgroundColor: colors.surface,
		borderWidth: 1,
		borderColor: colors.border,
		justifyContent: "center",
		marginTop: 14,
	},
	actionRowText: {
		fontSize: 14,
		fontWeight: "800",
		color: colors.brandAccent,
	},
	primaryAction: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		paddingVertical: 14,
		borderRadius: radii.lg,
		backgroundColor: colors.brandAccent,
		justifyContent: "center",
		marginTop: 10,
	},
	primaryActionText: {
		fontSize: 14,
		fontWeight: "800",
		color: colors.white,
	},
});
