import { useEffect, useMemo, useRef, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	Animated,
	Dimensions,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import MapView, { Marker, Polyline, type Region } from "react-native-maps";
import { cancelErrand, getErrandById } from "@runam/shared/api/errands";
import { signalRService } from "@runam/shared/services/signalr";
import type { Errand, TrackingUpdate } from "@runam/shared/types";
import RiderCard from "../components/RiderCard";

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
	{ label: string; color: string; icon: keyof typeof Ionicons.glyphMap }
> = {
	Pending: {
		label: "Looking for rider",
		color: "#F59E0B",
		icon: "search-outline",
	},
	Matched: {
		label: "Rider assigned",
		color: "#19543B",
		icon: "person-add-outline",
	},
	AcceptedByRider: {
		label: "Rider accepted",
		color: "#19543B",
		icon: "checkmark-circle-outline",
	},
	EnRouteToPickup: {
		label: "Heading to pickup",
		color: "#2F6BA6",
		icon: "navigate-outline",
	},
	ArrivedAtPickup: {
		label: "At pickup",
		color: "#C96A16",
		icon: "location-outline",
	},
	Collected: { label: "Collected", color: "#C96A16", icon: "cube-outline" },
	InTransit: { label: "In transit", color: "#2F6BA6", icon: "bicycle-outline" },
	ArrivedAtDropoff: {
		label: "At dropoff",
		color: "#10B981",
		icon: "flag-outline",
	},
	Delivered: {
		label: "Delivered",
		color: "#10B981",
		icon: "checkmark-done-outline",
	},
	Completed: { label: "Completed", color: "#10B981", icon: "sparkles-outline" },
};

const statusNarratives: Record<string, string> = {
	Pending:
		"RunAm is still assigning this order. Keep the app open and you will see the route as soon as a rider is locked in.",
	Matched:
		"A rider has been found. The next update should confirm that they accepted the trip and started moving.",
	AcceptedByRider:
		"Your rider accepted the trip. Expect movement toward pickup next.",
	EnRouteToPickup:
		"The rider is heading to pickup. Pickup confirmation will appear before delivery starts.",
	ArrivedAtPickup:
		"The rider has reached the pickup point. Collection is the next milestone.",
	Collected:
		"Pickup is complete. Delivery is now moving toward the dropoff address.",
	InTransit:
		"The order is on the way to you now. ETA updates will keep adjusting as the rider moves.",
	ArrivedAtDropoff:
		"The rider has reached the dropoff area. Delivery confirmation should land shortly.",
	Delivered:
		"The order was delivered. You can review the final route details and rate the rider next.",
	Completed:
		"This trip is fully completed. Keep this page for confirmation, route history, and follow-up actions.",
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
		refetchInterval: isConnected ? 30000 : 10000,
	});

	const statusInfo = statusMap[errandData?.status ?? ""] ?? {
		label: errandData?.status ?? "Unknown status",
		color: "#6B7280",
		icon: "help-circle-outline" as const,
	};

	const pickupStop = errandData?.stops?.find(
		(entry) => entry.stopType === "Pickup",
	);
	const dropoffStop = errandData?.stops?.find(
		(entry) => entry.stopType === "Dropoff",
	);

	const pickupCoordinate = useMemo(() => {
		if (!pickupStop) {
			return null;
		}
		if (pickupStop.latitude === 0 && pickupStop.longitude === 0) {
			return null;
		}
		return { latitude: pickupStop.latitude, longitude: pickupStop.longitude };
	}, [pickupStop]);

	const dropoffCoordinate = useMemo(() => {
		if (!dropoffStop) {
			return null;
		}
		if (dropoffStop.latitude === 0 && dropoffStop.longitude === 0) {
			return null;
		}
		return { latitude: dropoffStop.latitude, longitude: dropoffStop.longitude };
	}, [dropoffStop]);

	const riderCoordinate =
		riderLocation &&
		!(riderLocation.latitude === 0 && riderLocation.longitude === 0)
			? { latitude: riderLocation.latitude, longitude: riderLocation.longitude }
			: null;

	const mapRegion = useMemo<Region | null>(() => {
		const points = [
			pickupCoordinate,
			dropoffCoordinate,
			riderCoordinate,
		].filter((value): value is { latitude: number; longitude: number } =>
			Boolean(value),
		);

		if (points.length === 0) {
			return null;
		}

		const latitudes = points.map((point) => point.latitude);
		const longitudes = points.map((point) => point.longitude);
		const minLatitude = Math.min(...latitudes);
		const maxLatitude = Math.max(...latitudes);
		const minLongitude = Math.min(...longitudes);
		const maxLongitude = Math.max(...longitudes);

		return {
			latitude: (minLatitude + maxLatitude) / 2,
			longitude: (minLongitude + maxLongitude) / 2,
			latitudeDelta: Math.max((maxLatitude - minLatitude) * 1.8, 0.02),
			longitudeDelta: Math.max((maxLongitude - minLongitude) * 1.8, 0.02),
		};
	}, [dropoffCoordinate, pickupCoordinate, riderCoordinate]);

	const currentStepIndex = statusSteps.indexOf(errandData?.status ?? "");
	const progressPct =
		currentStepIndex >= 0
			? ((currentStepIndex + 1) / statusSteps.length) * 100
			: 0;
	const nextStatus =
		currentStepIndex >= 0 && currentStepIndex < statusSteps.length - 1
			? statusMap[statusSteps[currentStepIndex + 1]]?.label
			: null;

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
	}, [pulseAnim]);

	useEffect(() => {
		if (!id) {
			return;
		}

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

				signalRService.on("StatusUpdated", () => {
					queryClient.invalidateQueries({ queryKey: ["errand", id] });
				});

				signalRService.on<{ etaSeconds: number }>("EtaUpdated", (update) => {
					setEta(update.etaSeconds);
				});
			} catch (error) {
				console.warn("SignalR connection failed, relying on polling", error);
			}
		};

		void connect();

		return () => {
			setIsConnected(false);
			signalRService.leaveErrandGroup(id).catch(() => {});
			signalRService.off("LocationUpdated");
			signalRService.off("StatusUpdated");
			signalRService.off("EtaUpdated");
			signalRService.disconnect();
		};
	}, [id, queryClient]);

	const formatEta = (seconds: number) => {
		if (seconds < 60) {
			return "Less than a minute";
		}
		const mins = Math.ceil(seconds / 60);
		return `${mins} min${mins > 1 ? "s" : ""}`;
	};

	const handleCancel = async () => {
		try {
			await cancelErrand(id!, "Cancelled by user");
			queryClient.invalidateQueries({ queryKey: ["errand", id] });
			router.back();
		} catch (error: any) {
			Alert.alert("Error", error?.message || "Failed to cancel errand.");
		}
	};

	if (isLoading) {
		return (
			<View style={styles.centered}>
				<ActivityIndicator size="large" color="#19543B" />
			</View>
		);
	}

	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<View style={styles.mapShell}>
				{mapRegion ? (
					<MapView style={styles.map} region={mapRegion}>
						{pickupCoordinate ? (
							<Marker
								coordinate={pickupCoordinate}
								title="Pickup"
								description={pickupStop?.address}>
								<View style={[styles.markerDot, styles.pickupMarker]}>
									<Ionicons name="cube-outline" size={12} color="#FFFFFF" />
								</View>
							</Marker>
						) : null}
						{dropoffCoordinate ? (
							<Marker
								coordinate={dropoffCoordinate}
								title="Dropoff"
								description={dropoffStop?.address}>
								<View style={[styles.markerDot, styles.dropoffMarker]}>
									<Ionicons name="flag-outline" size={12} color="#FFFFFF" />
								</View>
							</Marker>
						) : null}
						{pickupCoordinate && dropoffCoordinate ? (
							<Polyline
								coordinates={[pickupCoordinate, dropoffCoordinate]}
								strokeColor="#19543B"
								strokeWidth={3}
							/>
						) : null}
						{riderCoordinate ? (
							<Marker coordinate={riderCoordinate} title="Rider location">
								<Animated.View
									style={[
										styles.riderMarker,
										{ transform: [{ scale: pulseAnim }] },
									]}>
									<Ionicons name="bicycle-outline" size={22} color="#19543B" />
								</Animated.View>
							</Marker>
						) : null}
					</MapView>
				) : (
					<View style={styles.mapPlaceholder}>
						<Ionicons name="map-outline" size={38} color="#6B7280" />
						<Text style={styles.mapPlaceholderTitle}>
							Live map not ready yet
						</Text>
						<Text style={styles.mapPlaceholderCopy}>
							{errandData?.status === "Pending"
								? "RunAm is still matching this order with a rider."
								: "Coordinates will appear here once the trip route is available."}
						</Text>
					</View>
				)}

				<View style={styles.mapTopBar}>
					<TouchableOpacity
						style={styles.topButton}
						onPress={() => router.back()}>
						<Ionicons name="chevron-back" size={22} color="#142013" />
					</TouchableOpacity>
					<View
						style={[
							styles.connectionChip,
							isConnected
								? styles.connectionChipLive
								: styles.connectionChipPolling,
						]}>
						<View
							style={[
								styles.connectionDot,
								isConnected
									? styles.connectionDotLive
									: styles.connectionDotPolling,
							]}
						/>
						<Text style={styles.connectionText}>
							{isConnected ? "Live" : "Polling"}
						</Text>
					</View>
				</View>

				{riderLocation ? (
					<View style={styles.riderInfoCard}>
						<Text style={styles.riderInfoLabel}>Rider position</Text>
						<Text style={styles.riderInfoValue}>
							{riderLocation.latitude.toFixed(4)},{" "}
							{riderLocation.longitude.toFixed(4)}
						</Text>
						{riderLocation.speed != null && riderLocation.speed > 0 ? (
							<Text style={styles.riderInfoMeta}>
								{(riderLocation.speed * 3.6).toFixed(0)} km/h
							</Text>
						) : null}
					</View>
				) : null}
			</View>

			<View style={styles.panel}>
				<View style={styles.progressTrack}>
					<View
						style={[
							styles.progressFill,
							{ width: `${progressPct}%`, backgroundColor: statusInfo.color },
						]}
					/>
				</View>

				<View style={styles.statusHeader}>
					<View
						style={[
							styles.statusIconWrap,
							{ backgroundColor: `${statusInfo.color}20` },
						]}>
						<Ionicons
							name={statusInfo.icon}
							size={24}
							color={statusInfo.color}
						/>
					</View>
					<View style={styles.statusCopy}>
						<Text style={styles.statusTitle}>{statusInfo.label}</Text>
						<Text style={styles.statusSubtitle}>
							Tracking #{errandData?.trackingNumber}
						</Text>
					</View>
					<View
						style={[
							styles.statusIndicator,
							{ backgroundColor: statusInfo.color },
						]}
					/>
				</View>

				<View style={styles.storyCard}>
					<Text style={styles.storyTitle}>What happens next</Text>
					<Text style={styles.storyCopy}>
						{statusNarratives[errandData?.status ?? ""] ||
							"Tracking will keep updating here as the order moves through each stage."}
					</Text>
					{nextStatus ? (
						<View style={styles.nextStatusPill}>
							<Ionicons name="arrow-forward" size={14} color="#19543B" />
							<Text style={styles.nextStatusText}>Next: {nextStatus}</Text>
						</View>
					) : null}
				</View>

				{eta != null && eta > 0 ? (
					<View style={styles.etaCard}>
						<Ionicons name="time-outline" size={18} color="#19543B" />
						<View style={styles.etaCopy}>
							<Text style={styles.etaLabel}>Estimated arrival</Text>
							<Text style={styles.etaValue}>{formatEta(eta)}</Text>
						</View>
					</View>
				) : null}

				<View style={styles.routeCard}>
					<View style={styles.routeRow}>
						<View style={[styles.routeIconWrap, styles.routeIconPickup]}>
							<Ionicons name="cube-outline" size={16} color="#FFFFFF" />
						</View>
						<View style={styles.routeCopy}>
							<Text style={styles.routeLabel}>Pickup</Text>
							<Text style={styles.routeText}>
								{pickupStop?.address ?? "Not available"}
							</Text>
						</View>
					</View>
					<View style={styles.routeDivider} />
					<View style={styles.routeRow}>
						<View style={[styles.routeIconWrap, styles.routeIconDropoff]}>
							<Ionicons name="flag-outline" size={16} color="#FFFFFF" />
						</View>
						<View style={styles.routeCopy}>
							<Text style={styles.routeLabel}>Dropoff</Text>
							<Text style={styles.routeText}>
								{dropoffStop?.address ?? "Not available"}
							</Text>
						</View>
					</View>
				</View>

				<View style={styles.metaRow}>
					<View style={styles.metaCard}>
						<Text style={styles.metaLabel}>Category</Text>
						<Text style={styles.metaValue}>{errandData?.category}</Text>
					</View>
					<View style={styles.metaCard}>
						<Text style={styles.metaLabel}>Price</Text>
						<Text style={styles.metaValue}>
							{errandData?.currency}{" "}
							{(
								errandData?.finalPrice ??
								errandData?.estimatedPrice ??
								0
							).toLocaleString()}
						</Text>
					</View>
				</View>

				<View style={styles.actionList}>
					{errandData?.riderId ? (
						<RiderCard
							riderName={errandData.riderName}
							subtitle={statusInfo.label}
							onChatPress={() =>
								router.push({ pathname: "/errand/chat", params: { id } } as any)
							}
						/>
					) : null}

					{errandData?.riderId ? (
						<TouchableOpacity
							style={styles.primaryAction}
							onPress={() =>
								router.push({ pathname: "/errand/chat", params: { id } } as any)
							}
							activeOpacity={0.85}>
							<Ionicons
								name="chatbubble-ellipses-outline"
								size={18}
								color="#FFFFFF"
							/>
							<Text style={styles.primaryActionText}>Chat with rider</Text>
						</TouchableOpacity>
					) : null}

					{errandData?.status === "Pending" ? (
						<TouchableOpacity
							style={styles.secondaryAction}
							onPress={() => void handleCancel()}
							activeOpacity={0.85}>
							<Ionicons name="close-circle-outline" size={18} color="#C93C37" />
							<Text style={styles.secondaryActionText}>Cancel errand</Text>
						</TouchableOpacity>
					) : null}

					{(errandData?.status === "Delivered" ||
						errandData?.status === "Completed") &&
					errandData?.riderId ? (
						<TouchableOpacity
							style={styles.reviewAction}
							onPress={() =>
								router.push(
									`/errand/rate?id=${id}&riderId=${errandData.riderId}` as any,
								)
							}
							activeOpacity={0.85}>
							<Ionicons name="star-outline" size={18} color="#9A6700" />
							<Text style={styles.reviewActionText}>Rate rider</Text>
						</TouchableOpacity>
					) : null}
				</View>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#F3F5EF",
	},
	centered: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "#F3F5EF",
	},
	mapShell: {
		height: width * 0.88,
		position: "relative",
	},
	map: {
		flex: 1,
	},
	mapPlaceholder: {
		flex: 1,
		backgroundColor: "#DCE7DF",
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: 36,
	},
	mapPlaceholderTitle: {
		fontSize: 18,
		fontWeight: "800",
		color: "#142013",
		marginTop: 10,
	},
	mapPlaceholderCopy: {
		fontSize: 14,
		lineHeight: 20,
		color: "#5F6D61",
		marginTop: 6,
		textAlign: "center",
	},
	mapTopBar: {
		position: "absolute",
		top: 12,
		left: 16,
		right: 16,
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	topButton: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: "rgba(255,255,255,0.94)",
		alignItems: "center",
		justifyContent: "center",
	},
	connectionChip: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		borderRadius: 999,
		paddingHorizontal: 12,
		paddingVertical: 8,
		backgroundColor: "rgba(255,255,255,0.94)",
	},
	connectionChipLive: {
		borderColor: "#10B981",
	},
	connectionChipPolling: {
		borderColor: "#F59E0B",
	},
	connectionDot: {
		width: 8,
		height: 8,
		borderRadius: 4,
	},
	connectionDotLive: {
		backgroundColor: "#10B981",
	},
	connectionDotPolling: {
		backgroundColor: "#F59E0B",
	},
	connectionText: {
		fontSize: 12,
		fontWeight: "800",
		color: "#142013",
		textTransform: "uppercase",
		letterSpacing: 0.6,
	},
	riderInfoCard: {
		position: "absolute",
		left: 16,
		right: 16,
		bottom: 16,
		backgroundColor: "rgba(255,255,255,0.96)",
		borderRadius: 18,
		padding: 14,
	},
	riderInfoLabel: {
		fontSize: 11,
		fontWeight: "700",
		textTransform: "uppercase",
		letterSpacing: 1,
		color: "#7A8579",
	},
	riderInfoValue: {
		fontSize: 15,
		fontWeight: "800",
		color: "#142013",
		marginTop: 4,
	},
	riderInfoMeta: {
		fontSize: 12,
		color: "#2F6BA6",
		marginTop: 4,
		fontWeight: "700",
	},
	markerDot: {
		width: 28,
		height: 28,
		borderRadius: 14,
		alignItems: "center",
		justifyContent: "center",
		borderWidth: 2,
		borderColor: "#FFFFFF",
	},
	pickupMarker: {
		backgroundColor: "#19543B",
	},
	dropoffMarker: {
		backgroundColor: "#C93C37",
	},
	riderMarker: {
		width: 54,
		height: 54,
		borderRadius: 27,
		backgroundColor: "rgba(221,243,231,0.92)",
		borderWidth: 2,
		borderColor: "#19543B",
		alignItems: "center",
		justifyContent: "center",
	},
	panel: {
		flex: 1,
		backgroundColor: "#FFFFFF",
		borderTopLeftRadius: 28,
		borderTopRightRadius: 28,
		marginTop: -18,
		paddingHorizontal: 20,
		paddingTop: 22,
		paddingBottom: 24,
	},
	progressTrack: {
		height: 6,
		borderRadius: 999,
		backgroundColor: "#E5EAE2",
		overflow: "hidden",
		marginBottom: 18,
	},
	progressFill: {
		height: "100%",
		borderRadius: 999,
	},
	statusHeader: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		marginBottom: 16,
	},
	statusIconWrap: {
		width: 48,
		height: 48,
		borderRadius: 16,
		alignItems: "center",
		justifyContent: "center",
	},
	statusCopy: {
		flex: 1,
	},
	statusTitle: {
		fontSize: 20,
		fontWeight: "800",
		color: "#142013",
	},
	statusSubtitle: {
		fontSize: 13,
		color: "#7A8579",
		marginTop: 4,
	},
	statusIndicator: {
		width: 12,
		height: 12,
		borderRadius: 6,
	},
	storyCard: {
		backgroundColor: "#F7F8F4",
		borderRadius: 18,
		padding: 14,
		marginBottom: 16,
	},
	storyTitle: {
		fontSize: 14,
		fontWeight: "800",
		color: "#142013",
	},
	storyCopy: {
		fontSize: 13,
		lineHeight: 18,
		color: "#4B5563",
		marginTop: 6,
	},
	nextStatusPill: {
		marginTop: 10,
		alignSelf: "flex-start",
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 999,
		backgroundColor: "#EDF2EA",
	},
	nextStatusText: {
		fontSize: 12,
		fontWeight: "700",
		color: "#19543B",
	},
	etaCard: {
		backgroundColor: "#EDF2EA",
		borderRadius: 18,
		padding: 14,
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
		marginBottom: 16,
	},
	etaCopy: {
		flex: 1,
	},
	etaLabel: {
		fontSize: 12,
		fontWeight: "700",
		textTransform: "uppercase",
		letterSpacing: 0.6,
		color: "#7A8579",
	},
	etaValue: {
		fontSize: 16,
		fontWeight: "800",
		color: "#142013",
		marginTop: 4,
	},
	routeCard: {
		backgroundColor: "#F7F8F4",
		borderRadius: 22,
		padding: 16,
		marginBottom: 16,
	},
	routeRow: {
		flexDirection: "row",
		alignItems: "flex-start",
		gap: 12,
	},
	routeIconWrap: {
		width: 34,
		height: 34,
		borderRadius: 17,
		alignItems: "center",
		justifyContent: "center",
	},
	routeIconPickup: {
		backgroundColor: "#19543B",
	},
	routeIconDropoff: {
		backgroundColor: "#C93C37",
	},
	routeCopy: {
		flex: 1,
	},
	routeLabel: {
		fontSize: 11,
		fontWeight: "700",
		textTransform: "uppercase",
		letterSpacing: 1,
		color: "#7A8579",
	},
	routeText: {
		fontSize: 14,
		lineHeight: 19,
		color: "#142013",
		marginTop: 4,
	},
	routeDivider: {
		height: 1,
		backgroundColor: "#E4E8DE",
		marginVertical: 14,
		marginLeft: 46,
	},
	metaRow: {
		flexDirection: "row",
		gap: 10,
		marginBottom: 18,
	},
	metaCard: {
		flex: 1,
		backgroundColor: "#F7F8F4",
		borderRadius: 18,
		padding: 14,
	},
	metaLabel: {
		fontSize: 11,
		fontWeight: "700",
		textTransform: "uppercase",
		letterSpacing: 1,
		color: "#7A8579",
	},
	metaValue: {
		fontSize: 15,
		fontWeight: "800",
		color: "#142013",
		marginTop: 4,
	},
	actionList: {
		gap: 10,
	},
	primaryAction: {
		backgroundColor: "#19543B",
		borderRadius: 18,
		paddingVertical: 15,
		alignItems: "center",
		justifyContent: "center",
		flexDirection: "row",
		gap: 8,
	},
	primaryActionText: {
		fontSize: 15,
		fontWeight: "800",
		color: "#FFFFFF",
	},
	secondaryAction: {
		backgroundColor: "#FDE7E6",
		borderRadius: 18,
		paddingVertical: 15,
		alignItems: "center",
		justifyContent: "center",
		flexDirection: "row",
		gap: 8,
	},
	secondaryActionText: {
		fontSize: 15,
		fontWeight: "800",
		color: "#C93C37",
	},
	reviewAction: {
		backgroundColor: "#FFF0CC",
		borderRadius: 18,
		paddingVertical: 15,
		alignItems: "center",
		justifyContent: "center",
		flexDirection: "row",
		gap: 8,
	},
	reviewActionText: {
		fontSize: 15,
		fontWeight: "800",
		color: "#9A6700",
	},
});
