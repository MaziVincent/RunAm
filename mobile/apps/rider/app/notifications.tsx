import { useState, useCallback } from "react";
import {
	View,
	Text,
	StyleSheet,
	FlatList,
	TouchableOpacity,
	RefreshControl,
	ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
	getNotifications,
	markAsRead,
	markAllAsRead,
} from "@runam/shared/api/notifications";
import type { AppNotification } from "@runam/shared/types";

const typeIcons: Record<number, string> = {
	0: "📦", // ErrandCreated
	1: "✅", // ErrandAccepted
	2: "🚴", // ErrandStatusUpdate
	3: "🎉", // ErrandDelivered
	4: "❌", // ErrandCancelled
	5: "🛡️", // RiderApproved
	6: "🚫", // RiderRejected
	7: "💰", // PaymentReceived
	8: "⚠️", // PaymentFailed
	9: "💳", // WalletTopUp
	10: "🏧", // WalletWithdrawal
	11: "🎁", // PromotionAvailable
	12: "💬", // ChatMessage
	13: "📢", // SystemAlert
	14: "⭐", // RatingReceived
	15: "💸", // PayoutCompleted
};

// Errand-related notification type values (0-4)
const isErrandType = (type: number) => type >= 0 && type <= 4;

export default function RiderNotificationsScreen() {
	const router = useRouter();
	const queryClient = useQueryClient();
	const [refreshing, setRefreshing] = useState(false);

	const { data: notificationsData, isLoading } = useQuery({
		queryKey: ["riderNotifications"],
		queryFn: () => getNotifications({ pageSize: 50 }),
	});

	const notifications = notificationsData?.items ?? [];

	const markReadMutation = useMutation({
		mutationFn: (id: string) => markAsRead(id),
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: ["riderNotifications"] }),
	});

	const markAllReadMutation = useMutation({
		mutationFn: () => markAllAsRead(),
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: ["riderNotifications"] }),
	});

	const onRefresh = useCallback(async () => {
		setRefreshing(true);
		await queryClient.invalidateQueries({
			queryKey: ["riderNotifications"],
		});
		setRefreshing(false);
	}, [queryClient]);

	const unreadCount = notifications.filter((n) => !n.isRead).length;

	const formatAgo = (dateStr: string) => {
		const d = new Date(dateStr);
		const diff = Date.now() - d.getTime();
		const mins = Math.floor(diff / 60000);
		if (mins < 1) return "Just now";
		if (mins < 60) return `${mins}m ago`;
		const hrs = Math.floor(mins / 60);
		if (hrs < 24) return `${hrs}h ago`;
		const days = Math.floor(hrs / 24);
		return `${days}d ago`;
	};

	const renderItem = ({ item }: { item: AppNotification }) => {
		const notifData =
			typeof item.data === "string"
				? (() => {
						try {
							return JSON.parse(item.data);
						} catch {
							return null;
						}
					})()
				: item.data;

		return (
			<TouchableOpacity
				style={[styles.notifRow, !item.isRead && styles.notifUnread]}
				onPress={() => {
					if (!item.isRead) markReadMutation.mutate(item.id);
					if (isErrandType(item.type) && notifData?.errandId) {
						router.push(`/errand/active?id=${notifData.errandId}` as never);
					}
				}}>
				<Text style={styles.notifIcon}>{typeIcons[item.type] ?? "🔔"}</Text>
				<View style={styles.notifContent}>
					<Text
						style={[styles.notifTitle, !item.isRead && styles.bold]}
						numberOfLines={1}>
						{item.title}
					</Text>
					<Text style={styles.notifMsg} numberOfLines={2}>
						{item.body}
					</Text>
					<Text style={styles.notifTime}>{formatAgo(item.createdAt)}</Text>
				</View>
				{!item.isRead && <View style={styles.unreadDot} />}
			</TouchableOpacity>
		);
	};

	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<View style={styles.header}>
				<View>
					<Text style={styles.title}>Notifications</Text>
					{unreadCount > 0 && (
						<Text style={styles.unreadLabel}>{unreadCount} unread</Text>
					)}
				</View>
				{unreadCount > 0 && (
					<TouchableOpacity
						onPress={() => markAllReadMutation.mutate()}
						disabled={markAllReadMutation.isPending}>
						<Text style={styles.markAllBtn}>Mark all read</Text>
					</TouchableOpacity>
				)}
			</View>

			{isLoading ? (
				<View style={styles.center}>
					<ActivityIndicator size="large" color="#10B981" />
				</View>
			) : notifications.length === 0 ? (
				<View style={styles.center}>
					<Text style={styles.emptyIcon}>🔔</Text>
					<Text style={styles.emptyText}>No notifications yet</Text>
				</View>
			) : (
				<FlatList
					data={notifications}
					keyExtractor={(item) => item.id}
					renderItem={renderItem}
					contentContainerStyle={styles.list}
					refreshControl={
						<RefreshControl
							refreshing={refreshing}
							onRefresh={onRefresh}
							tintColor="#10B981"
						/>
					}
				/>
			)}
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: "#F8FAFC" },
	center: { flex: 1, justifyContent: "center", alignItems: "center" },
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "flex-end",
		paddingHorizontal: 20,
		paddingVertical: 16,
	},
	title: { fontSize: 24, fontWeight: "800", color: "#1E293B" },
	unreadLabel: {
		fontSize: 12,
		color: "#10B981",
		fontWeight: "600",
		marginTop: 2,
	},
	markAllBtn: { fontSize: 13, color: "#10B981", fontWeight: "600" },
	list: { paddingHorizontal: 16, paddingBottom: 24 },
	notifRow: {
		flexDirection: "row",
		alignItems: "flex-start",
		backgroundColor: "#FFFFFF",
		borderRadius: 14,
		padding: 14,
		marginBottom: 8,
		borderWidth: 1,
		borderColor: "#E2E8F0",
	},
	notifUnread: { backgroundColor: "#F0FDF4", borderColor: "#BBF7D0" },
	notifIcon: { fontSize: 28, marginRight: 12 },
	notifContent: { flex: 1, marginRight: 8 },
	notifTitle: { fontSize: 14, color: "#1E293B" },
	bold: { fontWeight: "700" },
	notifMsg: { fontSize: 13, color: "#64748B", marginTop: 2 },
	notifTime: { fontSize: 11, color: "#94A3B8", marginTop: 4 },
	unreadDot: {
		width: 8,
		height: 8,
		borderRadius: 4,
		backgroundColor: "#10B981",
		marginTop: 6,
	},
	emptyIcon: { fontSize: 48 },
	emptyText: { fontSize: 15, color: "#64748B", marginTop: 8 },
});
