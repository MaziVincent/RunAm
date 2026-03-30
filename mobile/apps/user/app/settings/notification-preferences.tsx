import { useState, useEffect } from "react";
import {
	View,
	Text,
	StyleSheet,
	Switch,
	ScrollView,
	TouchableOpacity,
	Alert,
	ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
	getNotificationPreferences,
	updateNotificationPreferences,
} from "@runam/shared/api/notifications";
import type { NotificationPreferences } from "@runam/shared/types";

export default function NotificationPreferencesScreen() {
	const router = useRouter();
	const queryClient = useQueryClient();

	const { data: prefs, isLoading } = useQuery<NotificationPreferences>({
		queryKey: ["notificationPreferences"],
		queryFn: getNotificationPreferences,
	});

	const [local, setLocal] = useState<NotificationPreferences>({
		pushEnabled: true,
		emailEnabled: true,
		smsEnabled: false,
		errandUpdates: true,
		chatMessages: true,
		paymentAlerts: true,
		promotions: true,
		systemAlerts: true,
		fcmToken: null,
	});

	useEffect(() => {
		if (prefs) setLocal(prefs);
	}, [prefs]);

	const updateMutation = useMutation({
		mutationFn: (payload: Partial<NotificationPreferences>) =>
			updateNotificationPreferences(payload),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["notificationPreferences"],
			});
		},
		onError: (err: Error) => Alert.alert("Error", err.message),
	});

	const toggle = (key: keyof NotificationPreferences) => {
		const next = { ...local, [key]: !local[key] };
		setLocal(next);
		updateMutation.mutate({ [key]: next[key] });
	};

	if (isLoading) {
		return (
			<SafeAreaView style={styles.container} edges={["top"]}>
				<View style={styles.center}>
					<ActivityIndicator size="large" color="#2F8F4E" />
				</View>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<ScrollView contentContainerStyle={styles.content}>
				{/* Header */}
				<View style={styles.header}>
					<TouchableOpacity onPress={() => router.back()}>
						<Text style={styles.backBtn}>← Back</Text>
					</TouchableOpacity>
					<Text style={styles.title}>Notification Settings</Text>
				</View>

				{/* Channels */}
				<Text style={styles.sectionTitle}>Channels</Text>
				<View style={styles.card}>
					<ToggleRow
						label="Push Notifications"
						description="Receive push alerts on your device"
						value={local.pushEnabled}
						onToggle={() => toggle("pushEnabled")}
					/>
					<View style={styles.divider} />
					<ToggleRow
						label="Email"
						description="Receive email notifications"
						value={local.emailEnabled}
						onToggle={() => toggle("emailEnabled")}
					/>
					<View style={styles.divider} />
					<ToggleRow
						label="SMS"
						description="Critical alerts via text message"
						value={local.smsEnabled}
						onToggle={() => toggle("smsEnabled")}
					/>
				</View>

				{/* Categories */}
				<Text style={styles.sectionTitle}>Categories</Text>
				<View style={styles.card}>
					<ToggleRow
						label="Errand Updates"
						description="Pickup, delivery, and status changes"
						value={local.errandUpdates}
						onToggle={() => toggle("errandUpdates")}
					/>
					<View style={styles.divider} />
					<ToggleRow
						label="Chat Messages"
						description="New messages from riders or support"
						value={local.chatMessages}
						onToggle={() => toggle("chatMessages")}
					/>
					<View style={styles.divider} />
					<ToggleRow
						label="Payment Alerts"
						description="Payment confirmations and wallet updates"
						value={local.paymentAlerts}
						onToggle={() => toggle("paymentAlerts")}
					/>
					<View style={styles.divider} />
					<ToggleRow
						label="Promotions"
						description="Deals, discounts, and promo codes"
						value={local.promotions}
						onToggle={() => toggle("promotions")}
					/>
					<View style={styles.divider} />
					<ToggleRow
						label="System Alerts"
						description="Account updates and important notices"
						value={local.systemAlerts}
						onToggle={() => toggle("systemAlerts")}
					/>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}

function ToggleRow({
	label,
	description,
	value,
	onToggle,
}: {
	label: string;
	description: string;
	value: boolean;
	onToggle: () => void;
}) {
	return (
		<View style={styles.row}>
			<View style={styles.rowText}>
				<Text style={styles.rowLabel}>{label}</Text>
				<Text style={styles.rowDesc}>{description}</Text>
			</View>
			<Switch
				value={value}
				onValueChange={onToggle}
				trackColor={{ false: "#CBD5E1", true: "#93C5FD" }}
				thumbColor={value ? "#2F8F4E" : "#F1F5F9"}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: "#F8FAFC" },
	center: { flex: 1, justifyContent: "center", alignItems: "center" },
	content: { padding: 20, paddingBottom: 40 },
	header: { marginBottom: 24 },
	backBtn: { fontSize: 15, color: "#2F8F4E", fontWeight: "600" },
	title: {
		fontSize: 24,
		fontWeight: "800",
		color: "#1E293B",
		marginTop: 12,
	},
	sectionTitle: {
		fontSize: 13,
		fontWeight: "700",
		color: "#64748B",
		textTransform: "uppercase",
		letterSpacing: 0.5,
		marginBottom: 8,
		marginTop: 8,
	},
	card: {
		backgroundColor: "#FFFFFF",
		borderRadius: 16,
		padding: 4,
		marginBottom: 20,
		borderWidth: 1,
		borderColor: "#E2E8F0",
	},
	row: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingVertical: 14,
		paddingHorizontal: 14,
	},
	rowText: { flex: 1, marginRight: 12 },
	rowLabel: { fontSize: 15, fontWeight: "600", color: "#1E293B" },
	rowDesc: { fontSize: 12, color: "#94A3B8", marginTop: 2 },
	divider: { height: 1, backgroundColor: "#F1F5F9", marginHorizontal: 14 },
});
