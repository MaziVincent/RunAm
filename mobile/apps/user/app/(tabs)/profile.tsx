import {
	Alert,
	Image,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@runam/shared/stores/auth-store";
import { useQuery } from "@tanstack/react-query";
import { getAddresses } from "@runam/shared/api/addresses";
import { getUnreadCount } from "@runam/shared/api/notifications";
import { getWallet } from "@runam/shared/api/wallet";
import type { Address } from "@runam/shared/types";
import AuthRequiredState from "../components/AuthRequiredState";

interface SettingsItem {
	icon: keyof typeof Ionicons.glyphMap;
	label: string;
	onPress: () => void;
	destructive?: boolean;
}

export default function ProfileScreen() {
	const { user, logout, isAuthenticated } = useAuthStore();
	const router = useRouter();

	const { data: addresses } = useQuery<Address[]>({
		queryKey: ["addresses"],
		queryFn: getAddresses,
		enabled: isAuthenticated,
	});

	const { data: unreadCount } = useQuery({
		queryKey: ["notifications", "unread-count"],
		queryFn: getUnreadCount,
		enabled: isAuthenticated,
	});

	const { data: wallet } = useQuery({
		queryKey: ["wallet"],
		queryFn: getWallet,
		enabled: isAuthenticated,
	});

	if (!isAuthenticated) {
		return (
			<AuthRequiredState
				title="Create your RunAm account"
				description="Save addresses, manage wallet payments, review notifications, and track deliveries from one place once you sign in."
				redirectTo="/(tabs)/profile"
			/>
		);
	}

	const handleLogout = () => {
		Alert.alert("Log Out", "Are you sure you want to log out?", [
			{ text: "Cancel", style: "cancel" },
			{
				text: "Log Out",
				style: "destructive",
				onPress: async () => {
					await logout();
				},
			},
		]);
	};

	const primaryItems: SettingsItem[] = [
		{
			icon: "receipt-outline",
			label: "Orders",
			onPress: () => router.push("/(tabs)/activity" as any),
		},
		{
			icon: "location-outline",
			label: "Saved Addresses",
			onPress: () => router.push("/settings/addresses" as any),
		},
		{
			icon: "wallet-outline",
			label: "Wallet",
			onPress: () => router.push("/(tabs)/wallet" as any),
		},
		{
			icon: "notifications-outline",
			label: "Notifications",
			onPress: () => router.push("/notifications" as any),
		},
		{
			icon: "help-buoy-outline",
			label: "Support",
			onPress: () => router.push("/support" as any),
		},
	];

	const settingsItems: SettingsItem[] = [
		{
			icon: "ticket-outline",
			label: "Promo Codes",
			onPress: () => router.push("/settings/promo" as any),
		},
		{
			icon: "star-outline",
			label: "My Reviews",
			onPress: () => router.push("/settings/my-reviews" as any),
		},
		{
			icon: "lock-closed-outline",
			label: "Change Password",
			onPress: () => router.push("/settings/change-password" as any),
		},
		{
			icon: "notifications-outline",
			label: "Notification Preferences",
			onPress: () => router.push("/settings/notification-preferences" as any),
		},
		{
			icon: "log-out-outline",
			label: "Log Out",
			onPress: handleLogout,
			destructive: true,
		},
	];

	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<ScrollView
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}>
				<View style={styles.heroCard}>
					<Text style={styles.heroKicker}>Account</Text>
					<Text style={styles.heroTitle}>
						Everything personal now lives here.
					</Text>
					<Text style={styles.heroSubtitle}>
						Use Account as the hub for orders, saved addresses, wallet balance,
						notifications, and support.
					</Text>
				</View>

				<View style={styles.profileCard}>
					<View style={styles.avatar}>
						{user?.profilePictureUrl ? (
							<Image
								source={{ uri: user.profilePictureUrl }}
								style={styles.avatarImage}
							/>
						) : (
							<Text style={styles.avatarText}>
								{user?.firstName?.[0]?.toUpperCase() ?? "?"}
								{user?.lastName?.[0]?.toUpperCase() ?? ""}
							</Text>
						)}
					</View>
					<Text style={styles.name}>
						{user?.firstName} {user?.lastName}
					</Text>
					<Text style={styles.email}>{user?.email}</Text>
					<Text style={styles.phone}>{user?.phoneNumber}</Text>
					<View style={styles.profileMetaRow}>
						<View style={styles.profileMetaChip}>
							<Ionicons name="wallet-outline" size={14} color="#19543B" />
							<Text style={styles.profileMetaChipText}>
								{wallet?.isActive
									? `NGN ${(wallet.balance ?? 0).toLocaleString()}`
									: "Set up wallet"}
							</Text>
						</View>
						<View style={styles.profileMetaChip}>
							<Ionicons
								name="notifications-outline"
								size={14}
								color="#19543B"
							/>
							<Text style={styles.profileMetaChipText}>
								{unreadCount?.unreadCount ?? 0} unread
							</Text>
						</View>
					</View>
				</View>

				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Primary actions</Text>
					<View style={styles.settingsGroup}>
						{primaryItems.map((item, idx) => {
							const meta =
								item.label === "Saved Addresses"
									? `${addresses?.length ?? 0} saved`
									: item.label === "Wallet"
										? wallet?.isActive
											? `NGN ${(wallet.balance ?? 0).toLocaleString()}`
											: "Set up"
										: item.label === "Notifications"
											? `${unreadCount?.unreadCount ?? 0} unread`
											: item.label === "Orders"
												? "Track and history"
												: "Help and support";

							return (
								<TouchableOpacity
									key={item.label}
									style={[
										styles.settingsRow,
										idx < primaryItems.length - 1 && styles.settingsRowBorder,
									]}
									onPress={item.onPress}
									activeOpacity={0.6}>
									<View style={styles.settingsIconWrap}>
										<Ionicons name={item.icon} size={18} color="#19543B" />
									</View>
									<View style={styles.settingsContent}>
										<Text style={styles.settingsLabel}>{item.label}</Text>
										<Text style={styles.settingsMeta}>{meta}</Text>
									</View>
									<Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
								</TouchableOpacity>
							);
						})}
					</View>
				</View>

				{addresses && addresses.length > 0 ? (
					<View style={styles.section}>
						<Text style={styles.sectionTitle}>Saved addresses</Text>
						{addresses.slice(0, 2).map((addr) => (
							<TouchableOpacity
								key={addr.id}
								style={styles.addressCard}
								onPress={() => router.push("/settings/addresses" as any)}
								activeOpacity={0.75}>
								<View style={styles.addressIcon}>
									<Ionicons name="location-outline" size={18} color="#19543B" />
								</View>
								<View style={styles.addressContent}>
									<Text style={styles.addressLabel}>
										{addr.label}
										{addr.isDefault ? (
											<Text style={styles.defaultBadge}> • Default</Text>
										) : null}
									</Text>
									<Text style={styles.addressText} numberOfLines={2}>
										{addr.address}
									</Text>
								</View>
							</TouchableOpacity>
						))}
					</View>
				) : null}

				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Settings</Text>
					<View style={styles.settingsGroup}>
						{settingsItems.map((item, idx) => (
							<TouchableOpacity
								key={idx}
								style={[
									styles.settingsRow,
									idx < settingsItems.length - 1 && styles.settingsRowBorder,
								]}
								onPress={item.onPress}
								activeOpacity={0.6}>
								<View style={styles.settingsIconWrap}>
									<Ionicons
										name={item.icon}
										size={18}
										color={item.destructive ? "#EF4444" : "#19543B"}
									/>
								</View>
								<Text
									style={[
										styles.settingsLabel,
										item.destructive && styles.destructiveLabel,
									]}>
									{item.label}
								</Text>
								<Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
							</TouchableOpacity>
						))}
					</View>
				</View>
			</ScrollView>
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
	},
	heroCard: {
		backgroundColor: "#103E2B",
		borderRadius: 30,
		padding: 22,
		marginBottom: 16,
	},
	heroKicker: {
		fontSize: 12,
		fontWeight: "700",
		letterSpacing: 1.6,
		textTransform: "uppercase",
		color: "#A6E4C3",
		marginBottom: 8,
	},
	heroTitle: {
		fontSize: 29,
		fontWeight: "800",
		lineHeight: 34,
		letterSpacing: -0.9,
		color: "#FFFFFF",
	},
	heroSubtitle: {
		fontSize: 14,
		lineHeight: 21,
		color: "#D6EFE1",
		marginTop: 10,
	},
	profileCard: {
		backgroundColor: "#FFFFFF",
		borderRadius: 24,
		padding: 28,
		alignItems: "center",
		marginBottom: 24,
		borderWidth: 1,
		borderColor: "#E4E8DE",
	},
	avatar: {
		width: 80,
		height: 80,
		borderRadius: 40,
		backgroundColor: "#19543B",
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 16,
	},
	avatarImage: {
		width: 80,
		height: 80,
		borderRadius: 40,
	},
	avatarText: {
		fontSize: 28,
		fontWeight: "700",
		color: "#FFFFFF",
	},
	name: {
		fontSize: 22,
		fontWeight: "700",
		color: "#111827",
		marginBottom: 4,
	},
	email: {
		fontSize: 14,
		color: "#6B7280",
		marginBottom: 2,
	},
	phone: {
		fontSize: 14,
		color: "#6B7280",
	},
	profileMetaRow: {
		flexDirection: "row",
		gap: 10,
		marginTop: 16,
		flexWrap: "wrap",
		justifyContent: "center",
	},
	profileMetaChip: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		backgroundColor: "#EDF2EA",
		borderRadius: 999,
		paddingHorizontal: 12,
		paddingVertical: 8,
	},
	profileMetaChipText: {
		fontSize: 12,
		fontWeight: "700",
		color: "#19543B",
	},
	section: {
		marginBottom: 24,
	},
	sectionTitle: {
		fontSize: 20,
		fontWeight: "800",
		color: "#142013",
		marginBottom: 12,
	},
	addressCard: {
		flexDirection: "row",
		backgroundColor: "#FFFFFF",
		borderRadius: 18,
		padding: 14,
		marginBottom: 8,
		borderWidth: 1,
		borderColor: "#E4E8DE",
		alignItems: "center",
	},
	addressIcon: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: "#EDF2EA",
		alignItems: "center",
		justifyContent: "center",
		marginRight: 12,
	},
	addressContent: {
		flex: 1,
	},
	addressLabel: {
		fontSize: 14,
		fontWeight: "700",
		color: "#374151",
	},
	defaultBadge: {
		color: "#19543B",
		fontWeight: "700",
	},
	addressText: {
		fontSize: 13,
		color: "#7A8579",
		marginTop: 2,
	},
	settingsGroup: {
		backgroundColor: "#FFFFFF",
		borderRadius: 20,
		borderWidth: 1,
		borderColor: "#E4E8DE",
		overflow: "hidden",
	},
	settingsRow: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 16,
		paddingVertical: 14,
		gap: 12,
	},
	settingsRowBorder: {
		borderBottomWidth: 1,
		borderBottomColor: "#EEF1EA",
	},
	settingsIconWrap: {
		width: 40,
		height: 40,
		borderRadius: 14,
		backgroundColor: "#EDF2EA",
		alignItems: "center",
		justifyContent: "center",
	},
	settingsContent: {
		flex: 1,
	},
	settingsLabel: {
		flex: 1,
		fontSize: 15,
		fontWeight: "700",
		color: "#374151",
	},
	settingsMeta: {
		fontSize: 12,
		color: "#7A8579",
		marginTop: 3,
	},
	destructiveLabel: {
		color: "#EF4444",
	},
});
