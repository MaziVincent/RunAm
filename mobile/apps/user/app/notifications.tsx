import { useCallback, useMemo } from "react";
import {
	ActivityIndicator,
	RefreshControl,
	SectionList,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
	getNotifications,
	getUnreadCount,
	markAsRead,
	markAllAsRead,
} from "@runam/shared/api/notifications";
import { useAuthStore } from "@runam/shared/stores/auth-store";
import type { AppNotification } from "@runam/shared/types";
import AuthRequiredState from "./components/AuthRequiredState";
import EmptyState from "./components/EmptyState";
import HeroCard from "./components/HeroCard";

const typeIcons: Record<number, keyof typeof Ionicons.glyphMap> = {
	0: "cube-outline",
	1: "checkmark-circle-outline",
	2: "navigate-outline",
	3: "gift-outline",
	4: "close-circle-outline",
	5: "shield-checkmark-outline",
	6: "ban-outline",
	7: "card-outline",
	8: "alert-circle-outline",
	9: "wallet-outline",
	10: "cash-outline",
	11: "ticket-outline",
	12: "chatbubble-ellipses-outline",
	13: "notifications-outline",
	14: "star-outline",
	15: "cash-outline",
};

const typeColors: Record<number, string> = {
	0: "#19543B",
	1: "#19543B",
	2: "#19543B",
	3: "#10B981",
	4: "#C93C37",
	5: "#19543B",
	6: "#C93C37",
	7: "#19543B",
	8: "#C93C37",
	9: "#19543B",
	10: "#C96A16",
	11: "#19543B",
	12: "#2F6BA6",
	13: "#6B7280",
	14: "#C96A16",
	15: "#19543B",
};

function tryParseData(raw: string | null): Record<string, unknown> | null {
	if (!raw) {
		return null;
	}

	try {
		const parsed = JSON.parse(raw);
		if (parsed && typeof parsed === "object") {
			return parsed as Record<string, unknown>;
		}
	} catch {
		return { raw };
	}

	return null;
}

function extractUuid(value?: string | null): string | null {
	if (!value) {
		return null;
	}

	const match = value.match(
		/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i,
	);
	return match?.[0] ?? null;
}

function resolveNotificationDestination(notification: AppNotification) {
	const parsed = tryParseData(notification.data);
	const raw = typeof parsed?.raw === "string" ? parsed.raw : notification.data;
	const errandId =
		typeof parsed?.errandId === "string"
			? parsed.errandId
			: typeof parsed?.orderId === "string"
				? parsed.orderId
				: extractUuid(raw) || extractUuid(notification.body);
	const riderId =
		typeof parsed?.riderId === "string" ? parsed.riderId : undefined;

	if (notification.type === 12 && errandId) {
		return {
			label: "Open chat",
			pathname: "/errand/chat",
			params: { id: errandId },
		};
	}

	if ([0, 1, 2, 4, 5, 6, 7, 8, 13].includes(notification.type)) {
		if (errandId) {
			return {
				label: "Track order",
				pathname: "/errand/tracking",
				params: { id: errandId, riderId },
			};
		}

		return {
			label: "Open orders",
			pathname: "/(tabs)/activity",
			params: undefined,
		};
	}

	if ([9, 10, 15].includes(notification.type)) {
		return {
			label: "Open wallet",
			pathname: "/(tabs)/wallet",
			params: undefined,
		};
	}

	if (notification.type === 11) {
		return {
			label: "Open promos",
			pathname: "/settings/promo",
			params: undefined,
		};
	}

	if (notification.type === 14) {
		return {
			label: "Open reviews",
			pathname: "/settings/my-reviews",
			params: undefined,
		};
	}

	return null;
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

function getSectionLabel(dateStr: string): string {
	const createdAt = new Date(dateStr);
	const now = new Date();
	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	const yesterday = new Date(today);
	yesterday.setDate(today.getDate() - 1);
	const createdDay = new Date(
		createdAt.getFullYear(),
		createdAt.getMonth(),
		createdAt.getDate(),
	);

	if (createdDay.getTime() === today.getTime()) {
		return "Today";
	}

	if (createdDay.getTime() === yesterday.getTime()) {
		return "Yesterday";
	}

	if (today.getTime() - createdDay.getTime() < 6 * 24 * 60 * 60 * 1000) {
		return "Earlier this week";
	}

	return "Older updates";
}

export default function NotificationsScreen() {
	const router = useRouter();
	const { isAuthenticated } = useAuthStore();
	const queryClient = useQueryClient();

	const {
		data: notifications = [],
		refetch,
		isLoading,
		isRefetching,
	} = useQuery<AppNotification[]>({
		queryKey: ["notifications"],
		queryFn: async () => {
			const result = await getNotifications({ pageSize: 50 });
			return result.items;
		},
		enabled: isAuthenticated,
	});

	const { data: unreadRes } = useQuery<{ unreadCount: number }>({
		queryKey: ["notifications", "unread-count"],
		queryFn: getUnreadCount,
		enabled: isAuthenticated,
	});

	const markReadMutation = useMutation({
		mutationFn: (id: string) => markAsRead(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["notifications"] });
			queryClient.invalidateQueries({
				queryKey: ["notifications", "unread-count"],
			});
		},
	});

	const markAllReadMutation = useMutation({
		mutationFn: () => markAllAsRead(),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["notifications"] });
			queryClient.invalidateQueries({
				queryKey: ["notifications", "unread-count"],
			});
		},
	});

	const onRefresh = useCallback(async () => {
		await refetch();
	}, [refetch]);

	const handleNotificationPress = async (item: AppNotification) => {
		if (!item.isRead) {
			await markReadMutation.mutateAsync(item.id);
		}

		const destination = resolveNotificationDestination(item);
		if (!destination) {
			return;
		}

		router.push(
			destination.params
				? ({
						pathname: destination.pathname as any,
						params: destination.params,
					} as any)
				: (destination.pathname as any),
		);
	};

	const sections = useMemo(() => {
		const groups = new Map<string, AppNotification[]>();

		for (const notification of notifications) {
			const key = getSectionLabel(notification.createdAt);
			const existing = groups.get(key) ?? [];
			existing.push(notification);
			groups.set(key, existing);
		}

		const order = ["Today", "Yesterday", "Earlier this week", "Older updates"];

		return order
			.filter((key) => groups.has(key))
			.map((key) => ({ title: key, data: groups.get(key) ?? [] }));
	}, [notifications]);

	if (!isAuthenticated) {
		return (
			<AuthRequiredState
				title="Log in to view notifications"
				description="Order updates, chat alerts, payment notifications, and promos will appear here once you sign in."
				redirectTo="/notifications"
				showBack
			/>
		);
	}

	if (isLoading) {
		return (
			<View style={styles.centered}>
				<ActivityIndicator size="large" color="#19543B" />
			</View>
		);
	}

	const unreadCount = unreadRes?.unreadCount ?? 0;

	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<SectionList
				sections={sections}
				keyExtractor={(item) => item.id}
				renderSectionHeader={({ section }) => (
					<Text style={styles.sectionHeader}>{section.title}</Text>
				)}
				renderItem={({ item }) => {
					const destination = resolveNotificationDestination(item);
					const color = typeColors[item.type] || "#6B7280";
					const icon = typeIcons[item.type] || "notifications-outline";

					return (
						<TouchableOpacity
							style={[styles.notifCard, !item.isRead && styles.notifCardUnread]}
							onPress={() => void handleNotificationPress(item)}
							activeOpacity={0.8}>
							<View
								style={[styles.notifIcon, { backgroundColor: color + "15" }]}>
								<Ionicons name={icon} size={20} color={color} />
							</View>
							<View style={styles.notifContent}>
								<View style={styles.notifHeader}>
									<Text
										style={[
											styles.notifTitle,
											!item.isRead && styles.notifTitleUnread,
										]}
										numberOfLines={1}>
										{item.title}
									</Text>
									{!item.isRead ? <View style={styles.unreadDot} /> : null}
								</View>
								<Text style={styles.notifBody} numberOfLines={3}>
									{item.body}
								</Text>
								<View style={styles.notifFooter}>
									<Text style={styles.notifTime}>
										{formatTimeAgo(item.createdAt)}
									</Text>
									{destination ? (
										<View style={styles.actionChip}>
											<Text style={styles.actionChipText}>
												{destination.label}
											</Text>
										</View>
									) : null}
								</View>
							</View>
						</TouchableOpacity>
					);
				}}
				contentContainerStyle={styles.listContent}
				showsVerticalScrollIndicator={false}
				stickySectionHeadersEnabled={false}
				ListHeaderComponent={
					<HeroCard
						kicker="Notifications"
						title="Grouped updates, faster scanning."
						subtitle="Notifications are now organized by day so unread order alerts, wallet events, and chat prompts are easier to scan before you open them."
						style={styles.heroCard}>
						<View style={styles.heroMetaRow}>
							<View style={styles.heroMetaChip}>
								<Ionicons
									name="mail-unread-outline"
									size={14}
									color="#19543B"
								/>
								<Text style={styles.heroMetaText}>{unreadCount} unread</Text>
							</View>
							<View style={styles.heroMetaChip}>
								<Ionicons
									name="notifications-outline"
									size={14}
									color="#19543B"
								/>
								<Text style={styles.heroMetaText}>
									{notifications.length} total
								</Text>
							</View>
							{unreadCount > 0 ? (
								<TouchableOpacity
									style={styles.markAllButton}
									onPress={() => markAllReadMutation.mutate()}
									disabled={markAllReadMutation.isPending}
									activeOpacity={0.82}>
									<Text style={styles.markAllButtonText}>Mark all read</Text>
								</TouchableOpacity>
							) : null}
						</View>
					</HeroCard>
				}
				ListEmptyComponent={
					<EmptyState
						icon="notifications-outline"
						title="No notifications yet"
						description="Order updates, chats, wallet alerts, and promotions will appear here."
						style={styles.emptyState}
					/>
				}
				refreshControl={
					<RefreshControl
						refreshing={isRefetching}
						onRefresh={onRefresh}
						tintColor="#19543B"
					/>
				}
			/>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: "#F3F5EF" },
	centered: { flex: 1, justifyContent: "center", alignItems: "center" },
	heroCard: {
		marginHorizontal: 20,
		marginTop: 12,
		marginBottom: 12,
	},
	heroMetaRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		marginTop: 18,
		flexWrap: "wrap",
	},
	heroMetaChip: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		backgroundColor: "#EDF2EA",
		borderRadius: 999,
		paddingHorizontal: 12,
		paddingVertical: 8,
	},
	heroMetaText: {
		fontSize: 12,
		fontWeight: "700",
		color: "#19543B",
	},
	markAllButton: {
		backgroundColor: "#19543B",
		paddingHorizontal: 14,
		paddingVertical: 10,
		borderRadius: 999,
	},
	markAllButtonText: {
		fontSize: 12,
		fontWeight: "800",
		color: "#FFFFFF",
	},
	listContent: { paddingHorizontal: 20, paddingBottom: 40 },
	sectionHeader: {
		fontSize: 12,
		fontWeight: "800",
		letterSpacing: 1,
		textTransform: "uppercase",
		color: "#7A8579",
		marginTop: 8,
		marginBottom: 8,
	},
	notifCard: {
		flexDirection: "row",
		backgroundColor: "#FFFFFF",
		borderRadius: 20,
		padding: 14,
		marginBottom: 10,
		borderWidth: 1,
		borderColor: "#E4E8DE",
	},
	notifCardUnread: {
		backgroundColor: "#F7FCF8",
		borderColor: "#CFE6D8",
	},
	notifIcon: {
		width: 44,
		height: 44,
		borderRadius: 14,
		alignItems: "center",
		justifyContent: "center",
		marginRight: 12,
	},
	notifContent: { flex: 1 },
	notifHeader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: 10,
	},
	notifTitle: { fontSize: 14, fontWeight: "700", color: "#334155", flex: 1 },
	notifTitleUnread: { color: "#1E293B", fontWeight: "800" },
	unreadDot: {
		width: 8,
		height: 8,
		borderRadius: 4,
		backgroundColor: "#19543B",
		marginTop: 4,
	},
	notifBody: { fontSize: 13, color: "#64748B", marginTop: 4, lineHeight: 18 },
	notifFooter: {
		marginTop: 10,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: 10,
	},
	notifTime: { fontSize: 11, color: "#94A3B8" },
	actionChip: {
		backgroundColor: "#EDF2EA",
		borderRadius: 999,
		paddingHorizontal: 10,
		paddingVertical: 6,
	},
	actionChipText: {
		fontSize: 11,
		fontWeight: "800",
		color: "#19543B",
		textTransform: "uppercase",
		letterSpacing: 0.5,
	},
	emptyState: { alignItems: "center", paddingTop: 60 },
});
