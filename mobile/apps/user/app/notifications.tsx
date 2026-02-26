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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@runam/shared/api/client";
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

export default function NotificationsScreen() {
	const [refreshing, setRefreshing] = useState(false);
	const queryClient = useQueryClient();

	const {
		data: notifications = [],
		refetch,
		isLoading,
	} = useQuery<AppNotification[]>({
		queryKey: ["notifications"],
		queryFn: () => apiClient.get("/notifications"),
	});

	const { data: unreadRes } = useQuery<{ unreadCount: number }>({
		queryKey: ["notifications", "unread-count"],
		queryFn: () => apiClient.get("/notifications/unread-count"),
	});

	const markReadMutation = useMutation({
		mutationFn: (id: string) =>
			apiClient.patch(`/notifications/${id}/read`, {}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["notifications"] });
			queryClient.invalidateQueries({
				queryKey: ["notifications", "unread-count"],
			});
		},
	});

	const markAllReadMutation = useMutation({
		mutationFn: () => apiClient.patch("/notifications/read-all", {}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["notifications"] });
			queryClient.invalidateQueries({
				queryKey: ["notifications", "unread-count"],
			});
		},
	});

	const onRefresh = useCallback(async () => {
		setRefreshing(true);
		await refetch();
		setRefreshing(false);
	}, [refetch]);

	const unreadCount = unreadRes?.unreadCount ?? 0;

	const renderNotification = ({ item }: { item: AppNotification }) => (
		<TouchableOpacity
			style={[styles.notifCard, !item.isRead && styles.notifCardUnread]}
			onPress={() => {
				if (!item.isRead) markReadMutation.mutate(item.id);
			}}
			activeOpacity={0.7}>
			<View style={styles.notifIcon}>
				<Text style={styles.notifIconText}>{typeIcons[item.type] ?? "🔔"}</Text>
			</View>
			<View style={styles.notifContent}>
				<View style={styles.notifHeader}>
					<Text
						style={[styles.notifTitle, !item.isRead && styles.notifTitleUnread]}
						numberOfLines={1}>
						{item.title}
					</Text>
					{!item.isRead && <View style={styles.unreadDot} />}
				</View>
				<Text style={styles.notifBody} numberOfLines={2}>
					{item.body}
				</Text>
				<Text style={styles.notifTime}>{formatTimeAgo(item.createdAt)}</Text>
			</View>
		</TouchableOpacity>
	);

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
				<Text style={styles.headerTitle}>Notifications</Text>
				{unreadCount > 0 && (
					<TouchableOpacity
						onPress={() => markAllReadMutation.mutate()}
						disabled={markAllReadMutation.isPending}>
						<Text style={styles.markAllRead}>Mark all read</Text>
					</TouchableOpacity>
				)}
			</View>

			<FlatList
				data={notifications}
				keyExtractor={(item) => item.id}
				renderItem={renderNotification}
				contentContainerStyle={styles.listContent}
				showsVerticalScrollIndicator={false}
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={onRefresh}
						tintColor="#3B82F6"
					/>
				}
				ListEmptyComponent={
					<View style={styles.emptyState}>
						<Text style={styles.emptyIcon}>🔔</Text>
						<Text style={styles.emptyText}>No notifications yet</Text>
						<Text style={styles.emptySubtext}>
							You&#39;ll be notified about your errands here
						</Text>
					</View>
				}
			/>
		</SafeAreaView>
	);
}

function formatTimeAgo(dateStr: string): string {
	const now = Date.now();
	const then = new Date(dateStr).getTime();
	const diff = now - then;
	const mins = Math.floor(diff / 60000);
	if (mins < 1) return "Just now";
	if (mins < 60) return `${mins}m ago`;
	const hours = Math.floor(mins / 60);
	if (hours < 24) return `${hours}h ago`;
	const days = Math.floor(hours / 24);
	if (days < 7) return `${days}d ago`;
	return new Date(dateStr).toLocaleDateString();
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: "#F8FAFC" },
	centered: { flex: 1, justifyContent: "center", alignItems: "center" },
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingHorizontal: 20,
		paddingVertical: 12,
	},
	headerTitle: { fontSize: 24, fontWeight: "800", color: "#1E293B" },
	markAllRead: { fontSize: 14, fontWeight: "600", color: "#3B82F6" },
	listContent: { padding: 16, paddingBottom: 40 },
	notifCard: {
		flexDirection: "row",
		backgroundColor: "#FFFFFF",
		borderRadius: 14,
		padding: 14,
		marginBottom: 10,
		borderWidth: 1,
		borderColor: "#F1F5F9",
	},
	notifCardUnread: {
		backgroundColor: "#EFF6FF",
		borderColor: "#BFDBFE",
	},
	notifIcon: {
		width: 42,
		height: 42,
		borderRadius: 12,
		backgroundColor: "#F1F5F9",
		alignItems: "center",
		justifyContent: "center",
		marginRight: 12,
	},
	notifIconText: { fontSize: 20 },
	notifContent: { flex: 1 },
	notifHeader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	notifTitle: { fontSize: 14, fontWeight: "600", color: "#334155", flex: 1 },
	notifTitleUnread: { color: "#1E293B", fontWeight: "700" },
	unreadDot: {
		width: 8,
		height: 8,
		borderRadius: 4,
		backgroundColor: "#3B82F6",
		marginLeft: 8,
	},
	notifBody: { fontSize: 13, color: "#64748B", marginTop: 2, lineHeight: 18 },
	notifTime: { fontSize: 11, color: "#94A3B8", marginTop: 4 },
	emptyState: { alignItems: "center", paddingTop: 60 },
	emptyIcon: { fontSize: 48, marginBottom: 12 },
	emptyText: { fontSize: 16, fontWeight: "600", color: "#374151" },
	emptySubtext: { fontSize: 14, color: "#9CA3AF", marginTop: 4 },
});
