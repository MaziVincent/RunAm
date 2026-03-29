import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	TouchableOpacity,
	Alert,
	Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuthStore } from "@runam/shared/stores/auth-store";
import { useQuery } from "@tanstack/react-query";
import { getAddresses } from "@runam/shared/api/addresses";
import type { Address } from "@runam/shared/types";

interface SettingsItem {
	icon: string;
	label: string;
	onPress: () => void;
	destructive?: boolean;
}

export default function ProfileScreen() {
	const { user, logout } = useAuthStore();
	const router = useRouter();

	const { data: addresses } = useQuery<Address[]>({
		queryKey: ["addresses"],
		queryFn: getAddresses,
	});

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

	const settingsItems: SettingsItem[] = [
		{ icon: "📍", label: "Saved Addresses", onPress: () => {} },
		{
			icon: "🔔",
			label: "Notifications",
			onPress: () => router.push("/settings/notification-preferences" as any),
		},
		{
			icon: "💳",
			label: "Payment Methods",
			onPress: () => router.push("/settings/payment-methods" as any),
		},
		{
			icon: "🎟️",
			label: "Promo Codes",
			onPress: () => router.push("/settings/promo" as any),
		},
		{
			icon: "⭐",
			label: "My Reviews",
			onPress: () => router.push("/settings/my-reviews" as any),
		},
		{
			icon: "🔒",
			label: "Change Password",
			onPress: () => router.push("/settings/change-password" as any),
		},
		{
			icon: "📞",
			label: "Support",
			onPress: () => router.push("/support" as any),
		},
		{ icon: "📄", label: "Terms & Conditions", onPress: () => {} },
		{ icon: "🚪", label: "Log Out", onPress: handleLogout, destructive: true },
	];

	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<ScrollView
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}>
				{/* Profile Card */}
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
				</View>

				{/* Saved Addresses */}
				{addresses && addresses.length > 0 && (
					<View style={styles.section}>
						<Text style={styles.sectionTitle}>Saved Addresses</Text>
						{addresses.map((addr) => (
							<View key={addr.id} style={styles.addressCard}>
								<View style={styles.addressIcon}>
									<Text style={styles.addressIconText}>📍</Text>
								</View>
								<View style={styles.addressContent}>
									<Text style={styles.addressLabel}>
										{addr.label}
										{addr.isDefault && (
											<Text style={styles.defaultBadge}> • Default</Text>
										)}
									</Text>
									<Text style={styles.addressText} numberOfLines={2}>
										{addr.address}
									</Text>
								</View>
							</View>
						))}
					</View>
				)}

				{/* Settings */}
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
								<Text style={styles.settingsIcon}>{item.icon}</Text>
								<Text
									style={[
										styles.settingsLabel,
										item.destructive && styles.destructiveLabel,
									]}>
									{item.label}
								</Text>
								<Text style={styles.chevron}>›</Text>
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
		backgroundColor: "#F9FAFB",
	},
	content: {
		padding: 20,
		paddingBottom: 40,
	},
	profileCard: {
		backgroundColor: "#FFFFFF",
		borderRadius: 20,
		padding: 28,
		alignItems: "center",
		marginBottom: 24,
		borderWidth: 1,
		borderColor: "#F3F4F6",
	},
	avatar: {
		width: 80,
		height: 80,
		borderRadius: 40,
		backgroundColor: "#3B82F6",
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
	section: {
		marginBottom: 24,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: "700",
		color: "#111827",
		marginBottom: 12,
	},
	addressCard: {
		flexDirection: "row",
		backgroundColor: "#FFFFFF",
		borderRadius: 12,
		padding: 14,
		marginBottom: 8,
		borderWidth: 1,
		borderColor: "#F3F4F6",
		alignItems: "center",
	},
	addressIcon: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: "#EFF6FF",
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
	addressLabel: {
		fontSize: 14,
		fontWeight: "600",
		color: "#374151",
	},
	defaultBadge: {
		color: "#3B82F6",
		fontWeight: "600",
	},
	addressText: {
		fontSize: 13,
		color: "#9CA3AF",
		marginTop: 2,
	},
	settingsGroup: {
		backgroundColor: "#FFFFFF",
		borderRadius: 14,
		borderWidth: 1,
		borderColor: "#F3F4F6",
		overflow: "hidden",
	},
	settingsRow: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 16,
		paddingVertical: 14,
	},
	settingsRowBorder: {
		borderBottomWidth: 1,
		borderBottomColor: "#F3F4F6",
	},
	settingsIcon: {
		fontSize: 20,
		marginRight: 14,
	},
	settingsLabel: {
		flex: 1,
		fontSize: 15,
		fontWeight: "500",
		color: "#374151",
	},
	destructiveLabel: {
		color: "#EF4444",
	},
	chevron: {
		fontSize: 22,
		color: "#D1D5DB",
		fontWeight: "300",
	},
});
