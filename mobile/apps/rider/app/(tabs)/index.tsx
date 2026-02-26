import { useState, useCallback, useEffect, useRef } from "react";
import {
	View,
	Text,
	StyleSheet,
	Switch,
	FlatList,
	TouchableOpacity,
	RefreshControl,
	Animated,
	Platform,
	AppState,
	Vibration,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import apiClient from "@runam/shared/api/client";
import { useAuthStore } from "@runam/shared/stores/auth-store";
import signalRService from "@runam/shared/services/signalr";
import type { Errand } from "@runam/shared/types";

// ── Push notification config ──
Notifications.setNotificationHandler({
	handleNotification: async () => ({
		shouldShowAlert: true,
		shouldPlaySound: true,
		shouldSetBadge: true,
	}),
});

interface AvailableTask extends Errand {
	expiresAt?: string;
	distanceKm?: number;
}

function CountdownTimer({ expiresAt }: { expiresAt?: string }) {
	const [seconds, setSeconds] = useState(30);

	useEffect(() => {
		if (expiresAt) {
			const target = new Date(expiresAt).getTime();
			const now = Date.now();
			setSeconds(Math.max(0, Math.floor((target - now) / 1000)));
		}

		const interval = setInterval(() => {
			setSeconds((prev) => Math.max(0, prev - 1));
		}, 1000);

		return () => clearInterval(interval);
	}, [expiresAt]);

	const progress = seconds / 30;

	return (
		<View style={timerStyles.container}>
			<Text style={[timerStyles.text, seconds <= 10 && timerStyles.textUrgent]}>
				{seconds}s
			</Text>
			<View style={timerStyles.barBg}>
				<View
					style={[
						timerStyles.barFill,
						{ width: `${progress * 100}%` },
						seconds <= 10 && timerStyles.barFillUrgent,
					]}
				/>
			</View>
		</View>
	);
}

const timerStyles = StyleSheet.create({
	container: { alignItems: "center", minWidth: 50 },
	text: { fontSize: 16, fontWeight: "800", color: "#3B82F6", marginBottom: 4 },
	textUrgent: { color: "#EF4444" },
	barBg: { width: 50, height: 4, backgroundColor: "#E5E7EB", borderRadius: 2 },
	barFill: { height: 4, backgroundColor: "#3B82F6", borderRadius: 2 },
	barFillUrgent: { backgroundColor: "#EF4444" },
});

// ── Push notification registration ──
async function registerForPushNotifications(): Promise<string | null> {
	const { status: existing } = await Notifications.getPermissionsAsync();
	let finalStatus = existing;
	if (existing !== "granted") {
		const { status } = await Notifications.requestPermissionsAsync();
		finalStatus = status;
	}
	if (finalStatus !== "granted") return null;

	if (Platform.OS === "android") {
		await Notifications.setNotificationChannelAsync("orders", {
			name: "New Orders",
			importance: Notifications.AndroidImportance.MAX,
			vibrationPattern: [0, 250, 250, 250],
			sound: "default",
		});
	}

	const tokenData = await Notifications.getExpoPushTokenAsync();
	return tokenData.data;
}

export default function RiderHomeScreen() {
	const { user } = useAuthStore();
	const queryClient = useQueryClient();
	const router = useRouter();
	const [isOnline, setIsOnline] = useState(false);
	const [refreshing, setRefreshing] = useState(false);
	const [signalRConnected, setSignalRConnected] = useState(false);
	const locationSubRef = useRef<Location.LocationSubscription | null>(null);
	const prevTaskCountRef = useRef(0);
	const pulseAnim = useRef(new Animated.Value(1)).current;

	// ── GPS location broadcasting when online ──
	useEffect(() => {
		if (!isOnline) {
			// Stop location tracking when offline
			if (locationSubRef.current) {
				locationSubRef.current.remove();
				locationSubRef.current = null;
			}
			signalRService.disconnect();
			setSignalRConnected(false);
			return;
		}

		let cancelled = false;

		const startTracking = async () => {
			// Request permissions
			const { status } = await Location.requestForegroundPermissionsAsync();
			if (status !== "granted" || cancelled) return;

			// Connect to SignalR tracking hub
			await signalRService.connect("/hubs/tracking");
			if (!cancelled) setSignalRConnected(true);

			// Listen for new task assignments via SignalR
			signalRService.on("NewTaskAvailable", () => {
				Vibration.vibrate([0, 300, 100, 300]);
				queryClient.invalidateQueries({
					queryKey: ["rider", "available-tasks"],
				});
			});

			// Start watching location
			const sub = await Location.watchPositionAsync(
				{
					accuracy: Location.Accuracy.High,
					timeInterval: 5000,
					distanceInterval: 10,
				},
				(location) => {
					signalRService.sendRiderLocation(
						location.coords.latitude,
						location.coords.longitude,
						location.coords.heading,
						location.coords.speed,
					);
				},
			);
			if (!cancelled) {
				locationSubRef.current = sub;
			} else {
				sub.remove();
			}
		};

		startTracking();

		return () => {
			cancelled = true;
			if (locationSubRef.current) {
				locationSubRef.current.remove();
				locationSubRef.current = null;
			}
			signalRService.off("NewTaskAvailable");
			signalRService.disconnect();
			setSignalRConnected(false);
		};
	}, [isOnline]);

	// ── Register push notifications on mount ──
	useEffect(() => {
		registerForPushNotifications().then((token) => {
			if (token) {
				apiClient
					.post("/notifications/register", { token, platform: Platform.OS })
					.catch(() => {});
			}
		});

		// Handle notification taps
		const sub = Notifications.addNotificationResponseReceivedListener(
			(response) => {
				const data = response.notification.request.content.data;
				if (data?.errandId) {
					router.push(`/errand/active?id=${data.errandId}` as never);
				}
			},
		);

		return () => sub.remove();
	}, []);

	// ── Vibrate + pulse when new tasks arrive ──
	useEffect(() => {
		const tasks = availableTasks || [];
		if (
			tasks.length > prevTaskCountRef.current &&
			prevTaskCountRef.current > 0
		) {
			Vibration.vibrate([0, 200, 100, 200]);
			Animated.sequence([
				Animated.timing(pulseAnim, {
					toValue: 1.05,
					duration: 150,
					useNativeDriver: true,
				}),
				Animated.timing(pulseAnim, {
					toValue: 1,
					duration: 150,
					useNativeDriver: true,
				}),
			]).start();
		}
		prevTaskCountRef.current = tasks.length;
	}, [availableTasks]);

	// ── SignalR status tracking ──
	useEffect(() => {
		const unsub = signalRService.onStatusChange((status) => {
			setSignalRConnected(status === "connected");
		});
		return unsub;
	}, []);

	const toggleOnline = useMutation({
		mutationFn: (online: boolean) =>
			apiClient.patch("/riders/me/status", { isOnline: online }),
		onSuccess: (_, online) => setIsOnline(online),
	});

	const { data: availableTasks, refetch } = useQuery<AvailableTask[]>({
		queryKey: ["rider", "available-tasks"],
		queryFn: () => apiClient.get("/riders/me/available-tasks"),
		enabled: isOnline,
		refetchInterval: isOnline ? (signalRConnected ? 30000 : 10000) : false,
	});

	const acceptTask = useMutation({
		mutationFn: (errandId: string) =>
			apiClient.post(`/riders/me/tasks/${errandId}/accept`),
		onSuccess: (_, errandId) => {
			queryClient.invalidateQueries({ queryKey: ["rider"] });
			router.push(`/errand/active?id=${errandId}` as never);
		},
	});

	const rejectTask = useMutation({
		mutationFn: (errandId: string) =>
			apiClient.post(`/riders/me/tasks/${errandId}/reject`),
		onSuccess: () => refetch(),
	});

	const onRefresh = useCallback(async () => {
		setRefreshing(true);
		await refetch();
		setRefreshing(false);
	}, [refetch]);

	const handleToggle = (value: boolean) => {
		toggleOnline.mutate(value);
	};

	const renderTask = ({ item }: { item: AvailableTask }) => {
		const pickup = item.stops?.find((s) => s.stopType === "Pickup");
		const dropoff = item.stops?.find((s) => s.stopType === "Dropoff");

		return (
			<Animated.View
				style={[styles.taskCard, { transform: [{ scale: pulseAnim }] }]}>
				<View style={styles.taskHeader}>
					<View>
						<Text style={styles.taskCategory}>{item.category}</Text>
						<Text style={styles.taskPrice}>
							{item.currency} {item.estimatedPrice.toLocaleString()}
						</Text>
					</View>
					<CountdownTimer expiresAt={item.expiresAt} />
				</View>

				{item.distanceKm != null && (
					<View style={styles.distanceBadge}>
						<Text style={styles.distanceText}>
							📍 {item.distanceKm.toFixed(1)} km away
						</Text>
					</View>
				)}

				<View style={styles.routeContainer}>
					{pickup && (
						<View style={styles.routeRow}>
							<View style={[styles.routeDot, { backgroundColor: "#3B82F6" }]} />
							<Text style={styles.routeText} numberOfLines={1}>
								{pickup.address}
							</Text>
						</View>
					)}
					{dropoff && (
						<View style={styles.routeRow}>
							<View style={[styles.routeDot, { backgroundColor: "#10B981" }]} />
							<Text style={styles.routeText} numberOfLines={1}>
								{dropoff.address}
							</Text>
						</View>
					)}
				</View>

				<Text style={styles.taskDescription} numberOfLines={2}>
					{item.description}
				</Text>

				<View style={styles.taskActions}>
					<TouchableOpacity
						style={styles.rejectButton}
						onPress={() => rejectTask.mutate(item.id)}
						activeOpacity={0.7}>
						<Text style={styles.rejectButtonText}>Decline</Text>
					</TouchableOpacity>
					<TouchableOpacity
						style={styles.acceptButton}
						onPress={() => acceptTask.mutate(item.id)}
						disabled={acceptTask.isPending}
						activeOpacity={0.8}>
						<Text style={styles.acceptButtonText}>
							{acceptTask.isPending ? "..." : "Accept"}
						</Text>
					</TouchableOpacity>
				</View>
			</Animated.View>
		);
	};

	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			{/* Online Toggle */}
			<View style={styles.statusBar}>
				<View>
					<Text style={styles.greeting}>Hey, {user?.firstName || "Rider"}</Text>
					<View style={styles.statusRow}>
						<Text
							style={[
								styles.statusText,
								{ color: isOnline ? "#10B981" : "#9CA3AF" },
							]}>
							{isOnline ? "🟢 Online — Receiving tasks" : "⚫ Offline"}
						</Text>
						{isOnline && (
							<View
								style={[
									styles.connectionBadge,
									{ backgroundColor: signalRConnected ? "#D1FAE5" : "#FEF3C7" },
								]}>
								<View
									style={[
										styles.connectionDot,
										{
											backgroundColor: signalRConnected ? "#10B981" : "#F59E0B",
										},
									]}
								/>
								<Text
									style={[
										styles.connectionText,
										{ color: signalRConnected ? "#10B981" : "#F59E0B" },
									]}>
									{signalRConnected ? "Live" : "Polling"}
								</Text>
							</View>
						)}
					</View>
				</View>
				<Switch
					value={isOnline}
					onValueChange={handleToggle}
					trackColor={{ false: "#E5E7EB", true: "#86EFAC" }}
					thumbColor={isOnline ? "#10B981" : "#F9FAFB"}
					style={styles.toggle}
					disabled={toggleOnline.isPending}
				/>
			</View>

			{/* Tasks List */}
			{isOnline ? (
				<FlatList
					data={availableTasks || []}
					keyExtractor={(item) => item.id}
					renderItem={renderTask}
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
							<Text style={styles.emptyIcon}>🔍</Text>
							<Text style={styles.emptyTitle}>Looking for tasks...</Text>
							<Text style={styles.emptySubtitle}>
								New tasks will appear here automatically
							</Text>
						</View>
					}
				/>
			) : (
				<View style={styles.offlineState}>
					<Text style={styles.offlineIcon}>🏍️</Text>
					<Text style={styles.offlineTitle}>You're offline</Text>
					<Text style={styles.offlineSubtitle}>
						Go online to start receiving delivery tasks
					</Text>
				</View>
			)}
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#F9FAFB",
	},
	statusBar: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingHorizontal: 20,
		paddingVertical: 16,
		backgroundColor: "#FFFFFF",
		borderBottomWidth: 1,
		borderBottomColor: "#F3F4F6",
	},
	greeting: {
		fontSize: 20,
		fontWeight: "700",
		color: "#111827",
	},
	statusRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		marginTop: 4,
	},
	statusText: {
		fontSize: 14,
		fontWeight: "500",
	},
	connectionBadge: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 8,
		paddingVertical: 3,
		borderRadius: 10,
		gap: 4,
	},
	connectionDot: {
		width: 6,
		height: 6,
		borderRadius: 3,
	},
	connectionText: {
		fontSize: 11,
		fontWeight: "600",
	},
	distanceBadge: {
		backgroundColor: "#EFF6FF",
		alignSelf: "flex-start",
		paddingHorizontal: 10,
		paddingVertical: 4,
		borderRadius: 8,
		marginBottom: 10,
	},
	distanceText: {
		fontSize: 12,
		fontWeight: "600",
		color: "#3B82F6",
	},
	toggle: {
		transform: [{ scaleX: 1.2 }, { scaleY: 1.2 }],
	},
	listContent: {
		padding: 20,
		paddingBottom: 40,
	},
	taskCard: {
		backgroundColor: "#FFFFFF",
		borderRadius: 16,
		padding: 18,
		marginBottom: 14,
		borderWidth: 1,
		borderColor: "#F3F4F6",
	},
	taskHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "flex-start",
		marginBottom: 14,
	},
	taskCategory: {
		fontSize: 13,
		color: "#6B7280",
		fontWeight: "500",
	},
	taskPrice: {
		fontSize: 22,
		fontWeight: "800",
		color: "#111827",
		marginTop: 2,
	},
	routeContainer: {
		gap: 8,
		marginBottom: 12,
	},
	routeRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
	},
	routeDot: {
		width: 8,
		height: 8,
		borderRadius: 4,
	},
	routeText: {
		fontSize: 13,
		color: "#374151",
		flex: 1,
	},
	taskDescription: {
		fontSize: 14,
		color: "#6B7280",
		marginBottom: 16,
	},
	taskActions: {
		flexDirection: "row",
		gap: 12,
	},
	rejectButton: {
		flex: 1,
		paddingVertical: 12,
		borderRadius: 10,
		alignItems: "center",
		backgroundColor: "#FEE2E2",
	},
	rejectButtonText: {
		fontSize: 15,
		fontWeight: "600",
		color: "#EF4444",
	},
	acceptButton: {
		flex: 1,
		paddingVertical: 12,
		borderRadius: 10,
		alignItems: "center",
		backgroundColor: "#3B82F6",
	},
	acceptButtonText: {
		fontSize: 15,
		fontWeight: "700",
		color: "#FFFFFF",
	},
	emptyState: {
		alignItems: "center",
		paddingTop: 80,
	},
	emptyIcon: {
		fontSize: 56,
		marginBottom: 16,
	},
	emptyTitle: {
		fontSize: 18,
		fontWeight: "600",
		color: "#374151",
	},
	emptySubtitle: {
		fontSize: 14,
		color: "#9CA3AF",
		marginTop: 4,
	},
	offlineState: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		paddingBottom: 80,
	},
	offlineIcon: {
		fontSize: 64,
		marginBottom: 20,
	},
	offlineTitle: {
		fontSize: 22,
		fontWeight: "700",
		color: "#374151",
	},
	offlineSubtitle: {
		fontSize: 15,
		color: "#9CA3AF",
		marginTop: 6,
	},
});
