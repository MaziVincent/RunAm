import { useState, useEffect, useRef, useCallback } from "react";
import {
	View,
	Text,
	StyleSheet,
	ActivityIndicator,
	TouchableOpacity,
	Dimensions,
	Animated,
	Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { cancelErrand, getErrandById } from "@runam/shared/api/errands";
import { signalRService } from "@runam/shared/services/signalr";
import type { Errand, TrackingUpdate } from "@runam/shared/types";

const { width } = Dimensions.get("window");

const statusSteps = [
	"Pending",
	"Matched",
	"AcceptedByRider",
	"EnRouteToPickup",
	"ArrivedAtPickup",
	"Collected",
	"InTransit",
	"ArrivedAtDropoff",
	"Delivered",
	"Completed",
];

const statusMap: Record<
	string,
	{ label: string; color: string; icon: string }
> = {
	Pending: { label: "Looking for rider...", color: "#F59E0B", icon: "🔍" },
	Matched: { label: "Rider assigned", color: "#3B82F6", icon: "🙋" },
	AcceptedByRider: { label: "Rider accepted", color: "#3B82F6", icon: "✅" },
	EnRouteToPickup: {
		label: "Rider heading to pickup",
		color: "#6366F1",
		icon: "🏍️",
	},
	ArrivedAtPickup: { label: "Rider at pickup", color: "#8B5CF6", icon: "📍" },
	Collected: { label: "Package collected", color: "#8B5CF6", icon: "📦" },
	InTransit: { label: "Package in transit", color: "#6366F1", icon: "🚀" },
	ArrivedAtDropoff: {
		label: "Arriving at dropoff",
		color: "#10B981",
		icon: "🎯",
	},
	Delivered: { label: "Delivered!", color: "#10B981", icon: "🎉" },
	Completed: { label: "Completed", color: "#10B981", icon: "✨" },
};

export default function TrackingScreen() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const router = useRouter();
	const queryClient = useQueryClient();
	const [riderLocation, setRiderLocation] = useState<TrackingUpdate | null>(
		null,
	);
	const [eta, setEta] = useState<number | null>(null);
	const [isConnected, setIsConnected] = useState(false);
	const pulseAnim = useRef(new Animated.Value(1)).current;

	const { data: errandData, isLoading } = useQuery<Errand>({
		queryKey: ["errand", id],
		queryFn: () => getErrandById(id!),
		refetchInterval: isConnected ? 30000 : 10000, // slower polling when SignalR is active
	});

	const statusInfo = statusMap[errandData?.status ?? ""] ?? {
		label: errandData?.status ?? "Unknown",
		color: "#6B7280",
		icon: "❓",
	};

	const currentStepIndex = statusSteps.indexOf(errandData?.status ?? "");
	const progressPct =
		currentStepIndex >= 0
			? ((currentStepIndex + 1) / statusSteps.length) * 100
			: 0;

	// Pulse animation
	useEffect(() => {
		const pulse = Animated.loop(
			Animated.sequence([
				Animated.timing(pulseAnim, {
					toValue: 1.3,
					duration: 800,
					useNativeDriver: true,
				}),
				Animated.timing(pulseAnim, {
					toValue: 1,
					duration: 800,
					useNativeDriver: true,
				}),
			]),
		);
		pulse.start();
		return () => pulse.stop();
	}, []);

	// SignalR connection
	useEffect(() => {
		if (!id) return;

		const connect = async () => {
			try {
				await signalRService.connect("/hubs/tracking");
				await signalRService.joinErrandGroup(id);
				setIsConnected(true);

				signalRService.on<TrackingUpdate>("LocationUpdated", (update) => {
					setRiderLocation(update);
					if (update.etaSeconds) {
						setEta(update.etaSeconds);
					}
				});

				signalRService.on<{ errandId: string; status: string }>(
					"StatusUpdated",
					(update) => {
						queryClient.invalidateQueries({ queryKey: ["errand", id] });
					},
				);

				signalRService.on<{ errandId: string; etaSeconds: number }>(
					"EtaUpdated",
					(update) => {
						setEta(update.etaSeconds);
					},
				);
			} catch (err) {
				console.warn("SignalR connection failed, relying on polling", err);
			}
		};

		connect();

		return () => {
			signalRService.leaveErrandGroup(id).catch(() => {});
			signalRService.off("LocationUpdated");
			signalRService.off("StatusUpdated");
			signalRService.off("EtaUpdated");
			signalRService.disconnect();
		};
	}, [id]);

	const formatEta = (seconds: number) => {
		if (seconds < 60) return "Less than a minute";
		const mins = Math.ceil(seconds / 60);
		return `${mins} min${mins > 1 ? "s" : ""}`;
	};

	if (isLoading) {
		return (
			<View style={styles.centered}>
				<ActivityIndicator size="large" color="#3B82F6" />
			</View>
		);
	}

	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			{/* Map area */}
			<View style={styles.mapContainer}>
				<View style={styles.mapPlaceholder}>
					{riderLocation ? (
						<>
							<Animated.View
								style={[
									styles.riderMarker,
									{ transform: [{ scale: pulseAnim }] },
								]}>
								<Text style={styles.riderMarkerIcon}>🏍️</Text>
							</Animated.View>
							<Text style={styles.mapCoords}>
								📍 {riderLocation.latitude.toFixed(4)},{" "}
								{riderLocation.longitude.toFixed(4)}
							</Text>
							{riderLocation.speed != null && riderLocation.speed > 0 && (
								<Text style={styles.speedText}>
									{(riderLocation.speed * 3.6).toFixed(0)} km/h
								</Text>
							)}
						</>
					) : (
						<>
							<Text style={styles.mapIcon}>🗺️</Text>
							<Text style={styles.mapText}>
								{errandData?.status === "Pending"
									? "Searching for riders..."
									: "Waiting for rider location..."}
							</Text>
						</>
					)}
					{/* Connection indicator */}
					<View
						style={[
							styles.connBadge,
							isConnected ? styles.connBadgeOn : styles.connBadgeOff,
						]}>
						<View
							style={[
								styles.connDot,
								isConnected ? styles.connDotOn : styles.connDotOff,
							]}
						/>
						<Text style={styles.connText}>
							{isConnected ? "Live" : "Polling"}
						</Text>
					</View>
				</View>
			</View>

			{/* Status Panel */}
			<View style={styles.statusPanel}>
				{/* Progress Bar */}
				<View style={styles.progressBar}>
					<View
						style={[
							styles.progressFill,
							{ width: `${progressPct}%`, backgroundColor: statusInfo.color },
						]}
					/>
				</View>

				{/* Status indicator */}
				<View style={styles.statusRow}>
					<Text style={styles.statusIcon}>{statusInfo.icon}</Text>
					<View style={{ flex: 1 }}>
						<Text style={styles.statusText}>{statusInfo.label}</Text>
						{errandData?.riderId && (
							<Text style={styles.riderName}>Rider assigned</Text>
						)}
					</View>
					<View
						style={[styles.statusDot, { backgroundColor: statusInfo.color }]}
					/>
				</View>

				{/* ETA */}
				{eta != null && eta > 0 && (
					<View style={styles.etaRow}>
						<Text style={styles.etaLabel}>⏱ Estimated arrival</Text>
						<Text style={styles.etaValue}>{formatEta(eta)}</Text>
					</View>
				)}

				{/* Errand details */}
				{errandData && (
					<View style={styles.detailsContainer}>
						<View style={styles.addressRow}>
							<Text style={styles.addrIcon}>📦</Text>
							<View style={styles.addrContent}>
								<Text style={styles.addrLabel}>Pickup</Text>
								<Text style={styles.addrText} numberOfLines={1}>
									{errandData.stops?.[0]?.address ?? "N/A"}
								</Text>
							</View>
						</View>
						<View style={styles.addressDivider} />
						<View style={styles.addressRow}>
							<Text style={styles.addrIcon}>📍</Text>
							<View style={styles.addrContent}>
								<Text style={styles.addrLabel}>Dropoff</Text>
								<Text style={styles.addrText} numberOfLines={1}>
									{errandData.stops?.[errandData.stops.length - 1]?.address ??
										"N/A"}
								</Text>
							</View>
						</View>
					</View>
				)}

				{/* Actions */}
				<View style={styles.actions}>
					{errandData?.riderId && (
						<TouchableOpacity
							style={styles.chatButton}
							onPress={() => router.push(`/errand/chat?id=${id}` as never)}>
							<Text style={styles.chatButtonText}>💬 Chat with Rider</Text>
						</TouchableOpacity>
					)}
					{errandData?.status === "Pending" && (
						<TouchableOpacity
							style={styles.cancelButton}
							onPress={async () => {
								try {
									await cancelErrand(id!, "Cancelled by user");
									queryClient.invalidateQueries({ queryKey: ["errand", id] });
									router.back();
								} catch (err: any) {
									Alert.alert(
										"Error",
										err?.message || "Failed to cancel errand.",
									);
								}
							}}>
							<Text style={styles.cancelButtonText}>Cancel Errand</Text>
						</TouchableOpacity>
					)}
					{(errandData?.status === "Delivered" ||
						errandData?.status === "Completed") &&
						errandData?.riderId && (
							<TouchableOpacity
								style={styles.rateButton}
								onPress={() =>
									router.push(
										`/errand/rate?id=${id}&riderId=${errandData.riderId}` as never,
									)
								}>
								<Text style={styles.rateButtonText}>⭐ Rate Rider</Text>
							</TouchableOpacity>
						)}
				</View>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: "#F8FAFC" },
	centered: { flex: 1, justifyContent: "center", alignItems: "center" },
	mapContainer: { flex: 1 },
	mapPlaceholder: {
		flex: 1,
		backgroundColor: "#E2E8F0",
		justifyContent: "center",
		alignItems: "center",
	},
	mapIcon: { fontSize: 48 },
	mapText: { fontSize: 16, color: "#64748B", marginTop: 8 },
	mapCoords: { fontSize: 12, color: "#3B82F6", marginTop: 8 },
	riderMarker: {
		width: 64,
		height: 64,
		borderRadius: 32,
		backgroundColor: "rgba(59,130,246,0.15)",
		justifyContent: "center",
		alignItems: "center",
	},
	riderMarkerIcon: { fontSize: 32 },
	speedText: {
		fontSize: 11,
		color: "#6366F1",
		fontWeight: "600",
		marginTop: 4,
	},
	connBadge: {
		position: "absolute",
		top: 16,
		right: 16,
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 10,
		paddingVertical: 5,
		borderRadius: 20,
		gap: 5,
	},
	connBadgeOn: { backgroundColor: "rgba(16,185,129,0.15)" },
	connBadgeOff: { backgroundColor: "rgba(245,158,11,0.15)" },
	connDot: { width: 8, height: 8, borderRadius: 4 },
	connDotOn: { backgroundColor: "#10B981" },
	connDotOff: { backgroundColor: "#F59E0B" },
	connText: { fontSize: 11, fontWeight: "700", color: "#374151" },
	statusPanel: {
		backgroundColor: "#FFFFFF",
		borderTopLeftRadius: 24,
		borderTopRightRadius: 24,
		padding: 24,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: -4 },
		shadowOpacity: 0.1,
		shadowRadius: 12,
		elevation: 8,
	},
	progressBar: {
		height: 4,
		backgroundColor: "#E2E8F0",
		borderRadius: 2,
		marginBottom: 16,
		overflow: "hidden",
	},
	progressFill: {
		height: "100%",
		borderRadius: 2,
	},
	statusRow: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 16,
		gap: 10,
	},
	statusIcon: { fontSize: 28 },
	statusDot: {
		width: 12,
		height: 12,
		borderRadius: 6,
	},
	statusText: { fontSize: 18, fontWeight: "700", color: "#1E293B" },
	riderName: { fontSize: 13, color: "#64748B", marginTop: 2 },
	etaRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		backgroundColor: "#F1F5F9",
		borderRadius: 12,
		padding: 14,
		marginBottom: 16,
	},
	etaLabel: { fontSize: 14, color: "#64748B" },
	etaValue: { fontSize: 16, fontWeight: "700", color: "#3B82F6" },
	detailsContainer: {
		backgroundColor: "#F8FAFC",
		borderRadius: 12,
		padding: 16,
		marginBottom: 16,
	},
	addressRow: { flexDirection: "row", alignItems: "center" },
	addrIcon: { fontSize: 20, marginRight: 12 },
	addrContent: { flex: 1 },
	addrLabel: { fontSize: 12, color: "#94A3B8", fontWeight: "600" },
	addrText: { fontSize: 14, color: "#1E293B", marginTop: 2 },
	addressDivider: {
		height: 1,
		backgroundColor: "#E2E8F0",
		marginVertical: 12,
		marginLeft: 32,
	},
	actions: { gap: 12 },
	chatButton: {
		backgroundColor: "#3B82F6",
		borderRadius: 14,
		paddingVertical: 14,
		alignItems: "center",
	},
	chatButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
	cancelButton: {
		backgroundColor: "#FEF2F2",
		borderRadius: 14,
		paddingVertical: 14,
		alignItems: "center",
		borderWidth: 1,
		borderColor: "#FECACA",
	},
	cancelButtonText: { color: "#EF4444", fontSize: 16, fontWeight: "600" },
	rateButton: {
		backgroundColor: "#FEF3C7",
		borderRadius: 14,
		paddingVertical: 14,
		alignItems: "center",
		borderWidth: 1,
		borderColor: "#FDE68A",
	},
	rateButtonText: { color: "#D97706", fontSize: 16, fontWeight: "600" },
});
