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
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@runam/shared/stores/auth-store";
import apiClient from "@runam/shared/api/client";
import type { RiderProfile } from "@runam/shared/types";

interface SettingsItem {
	icon: string;
	label: string;
	onPress: () => void;
	destructive?: boolean;
}

export default function RiderProfileScreen() {
	const { user, logout } = useAuthStore();
	const router = useRouter();

	const { data: riderProfile } = useQuery<RiderProfile>({
		queryKey: ["rider", "profile"],
		queryFn: () => apiClient.get("/riders/me"),
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

	const vehicleIcons: Record<string, string> = {
		Bicycle: "🚲",
		Motorcycle: "🏍️",
		Car: "🚗",
		Van: "🚐",
	};

	const settingsItems: SettingsItem[] = [
		{ icon: "🏍️", label: "Vehicle Information", onPress: () => {} },
		{ icon: "📄", label: "Documents", onPress: () => {} },
		{
			icon: "�",
			label: "Performance",
			onPress: () => router.push("/performance" as never),
		},
		{
			icon: "🏆",
			label: "Leaderboard",
			onPress: () => router.push("/leaderboard" as never),
		},
		{
			icon: "🏦",
			label: "Bank Accounts",
			onPress: () => router.push("/bank-accounts" as never),
		},
		{
			icon: "�🔔",
			label: "Notifications",
			onPress: () => router.push("/notifications" as never),
		},
		{
			icon: "⭐",
			label: "My Ratings",
			onPress: () => router.push("/ratings" as never),
		},
		{ icon: "🔒", label: "Change Password", onPress: () => {} },
		{ icon: "📞", label: "Support", onPress: () => {} },
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

					{/* Rating */}
					{riderProfile && (
						<View style={styles.ratingRow}>
							<Text style={styles.ratingStars}>⭐</Text>
							<Text style={styles.ratingValue}>
								{riderProfile.rating.toFixed(1)}
							</Text>
							<Text style={styles.ratingLabel}>rating</Text>
						</View>
					)}
				</View>

				{/* Stats Grid */}
				<View style={styles.statsGrid}>
					<View style={styles.statCard}>
						<Text style={styles.statValue}>
							{riderProfile?.totalCompletedTasks ?? 0}
						</Text>
						<Text style={styles.statLabel}>Completed</Text>
					</View>
					<View style={styles.statCard}>
						<Text style={styles.statValue}>
							{riderProfile?.rating.toFixed(1) ?? "0.0"}
						</Text>
						<Text style={styles.statLabel}>Rating</Text>
					</View>
					<View style={styles.statCard}>
						<Text style={styles.statValue}>
							{vehicleIcons[riderProfile?.vehicleType ?? ""] ?? "🚗"}
						</Text>
						<Text style={styles.statLabel}>
							{riderProfile?.vehicleType ?? "N/A"}
						</Text>
					</View>
				</View>

				{/* Vehicle Info */}
				{riderProfile && (
					<View style={styles.vehicleCard}>
						<Text style={styles.sectionTitle}>Vehicle</Text>
						<View style={styles.vehicleRow}>
							<Text style={styles.vehicleIcon}>
								{vehicleIcons[riderProfile.vehicleType] || "🚗"}
							</Text>
							<View>
								<Text style={styles.vehicleType}>
									{riderProfile.vehicleType}
								</Text>
								{riderProfile.licensePlate && (
									<Text style={styles.vehiclePlate}>
										{riderProfile.licensePlate}
									</Text>
								)}
							</View>
							<View
								style={[
									styles.verifiedBadge,
									{
										backgroundColor: riderProfile.isVerified
											? "#D1FAE5"
											: "#FEF3C7",
									},
								]}>
								<Text
									style={[
										styles.verifiedText,
										{ color: riderProfile.isVerified ? "#10B981" : "#F59E0B" },
									]}>
									{riderProfile.isVerified ? "Verified" : "Pending"}
								</Text>
							</View>
						</View>
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
		marginBottom: 16,
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
		marginBottom: 12,
	},
	ratingRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
	},
	ratingStars: {
		fontSize: 18,
	},
	ratingValue: {
		fontSize: 18,
		fontWeight: "700",
		color: "#111827",
	},
	ratingLabel: {
		fontSize: 14,
		color: "#9CA3AF",
	},
	statsGrid: {
		flexDirection: "row",
		gap: 12,
		marginBottom: 20,
	},
	statCard: {
		flex: 1,
		backgroundColor: "#FFFFFF",
		borderRadius: 14,
		padding: 18,
		alignItems: "center",
		borderWidth: 1,
		borderColor: "#F3F4F6",
	},
	statValue: {
		fontSize: 22,
		fontWeight: "800",
		color: "#111827",
		marginBottom: 4,
	},
	statLabel: {
		fontSize: 12,
		color: "#6B7280",
		fontWeight: "500",
	},
	vehicleCard: {
		backgroundColor: "#FFFFFF",
		borderRadius: 14,
		padding: 18,
		marginBottom: 20,
		borderWidth: 1,
		borderColor: "#F3F4F6",
	},
	vehicleRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 14,
		marginTop: 12,
	},
	vehicleIcon: {
		fontSize: 32,
	},
	vehicleType: {
		fontSize: 16,
		fontWeight: "600",
		color: "#111827",
	},
	vehiclePlate: {
		fontSize: 14,
		color: "#6B7280",
		marginTop: 2,
	},
	verifiedBadge: {
		marginLeft: "auto",
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 20,
	},
	verifiedText: {
		fontSize: 13,
		fontWeight: "600",
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
