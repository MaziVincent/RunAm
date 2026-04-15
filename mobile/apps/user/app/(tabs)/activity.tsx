import { useState, useCallback, useMemo } from "react";
import {
	View,
	Text,
	StyleSheet,
	FlatList,
	TouchableOpacity,
	RefreshControl,
	ActivityIndicator,
	TextInput,
	ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@runam/shared/stores/auth-store";
import { getErrands } from "@runam/shared/api/errands";
import type { Errand } from "@runam/shared/types";
import AuthRequiredState from "../components/AuthRequiredState";

const statusColors: Record<string, string> = {
	Draft: "#9CA3AF",
	Pending: "#F59E0B",
	PendingPayment: "#F59E0B",
	Matched: "#2F8F4E",
	AcceptedByRider: "#2F8F4E",
	EnRouteToPickup: "#F7931A",
	ArrivedAtPickup: "#F7931A",
	Collected: "#F7931A",
	InTransit: "#F7931A",
	ArrivedAtDropoff: "#F7931A",
	Delivered: "#10B981",
	Completed: "#10B981",
	Cancelled: "#EF4444",
	Disputed: "#EF4444",
};

const statusLabels: Record<string, string> = {
	PendingPayment: "Pending Payment",
	AcceptedByRider: "Accepted",
	EnRouteToPickup: "En Route",
	ArrivedAtPickup: "At Pickup",
	ArrivedAtDropoff: "At Dropoff",
	InTransit: "In Transit",
};

type FilterTab = "All" | "Active" | "Completed" | "Cancelled";

const FILTER_TABS: { key: FilterTab; label: string; icon: string }[] = [
	{ key: "All", label: "All", icon: "📋" },
	{ key: "Active", label: "Active", icon: "🚀" },
	{ key: "Completed", label: "Done", icon: "✅" },
	{ key: "Cancelled", label: "Cancelled", icon: "❌" },
];

const ACTIVE_STATUSES = [
	"Pending",
	"PendingPayment",
	"Matched",
	"AcceptedByRider",
	"EnRouteToPickup",
	"ArrivedAtPickup",
	"Collected",
	"InTransit",
	"ArrivedAtDropoff",
];

export default function ActivityScreen() {
	const router = useRouter();
	const { isAuthenticated } = useAuthStore();
	const [refreshing, setRefreshing] = useState(false);
	const [activeFilter, setActiveFilter] = useState<FilterTab>("All");
	const [searchQuery, setSearchQuery] = useState("");

	const {
		data: errandsData,
		refetch,
		isLoading,
	} = useQuery({
		queryKey: ["errands", "all"],
		queryFn: () => getErrands({ pageSize: 50 }),
		enabled: isAuthenticated,
	});

	const data = errandsData?.items;

	const onRefresh = useCallback(async () => {
		setRefreshing(true);
		await refetch();
		setRefreshing(false);
	}, [refetch]);

	const filteredData = useMemo(() => {
		let result = data || [];

		// Filter by tab
		if (activeFilter === "Active") {
			result = result.filter((e) => ACTIVE_STATUSES.includes(e.status));
		} else if (activeFilter === "Completed") {
			result = result.filter(
				(e) => e.status === "Delivered" || e.status === "Completed",
			);
		} else if (activeFilter === "Cancelled") {
			result = result.filter(
				(e) => e.status === "Cancelled" || e.status === "Disputed",
			);
		}

		// Search
		if (searchQuery.trim()) {
			const q = searchQuery.toLowerCase();
			result = result.filter(
				(e) =>
					e.trackingNumber?.toLowerCase().includes(q) ||
					e.description?.toLowerCase().includes(q) ||
					e.stops?.some((s) => s.address?.toLowerCase().includes(q)),
			);
		}

		return result;
	}, [data, activeFilter, searchQuery]);

	const renderErrand = ({ item }: { item: Errand }) => {
		const displayStatus = statusLabels[item.status] || item.status;
		const color = statusColors[item.status] || "#6B7280";
		const pickupStop = item.stops?.find((s) => s.stopType === "Pickup");
		const dropoffStop = item.stops?.find((s) => s.stopType === "Dropoff");

		return (
			<TouchableOpacity
				style={styles.card}
				activeOpacity={0.7}
				onPress={() =>
					router.push({
						pathname: "/errand/tracking" as any,
						params: { id: item.id },
					})
				}>
				<View style={styles.cardTop}>
					<View>
						<Text style={styles.trackingNumber}>#{item.trackingNumber}</Text>
						<Text style={styles.category}>{item.category}</Text>
					</View>
					<View style={[styles.badge, { backgroundColor: color + "18" }]}>
						<View style={[styles.badgeDot, { backgroundColor: color }]} />
						<Text style={[styles.badgeText, { color }]}>{displayStatus}</Text>
					</View>
				</View>

				<View style={styles.routeContainer}>
					{pickupStop && (
						<View style={styles.routeRow}>
							<View style={[styles.routeDot, { backgroundColor: "#2F8F4E" }]} />
							<Text style={styles.routeText} numberOfLines={1}>
								{pickupStop.address}
							</Text>
						</View>
					)}
					{dropoffStop && (
						<View style={styles.routeRow}>
							<View style={[styles.routeDot, { backgroundColor: "#10B981" }]} />
							<Text style={styles.routeText} numberOfLines={1}>
								{dropoffStop.address}
							</Text>
						</View>
					)}
				</View>

				<View style={styles.cardBottom}>
					<Text style={styles.price}>
						{item.currency}{" "}
						{(item.finalPrice ?? item.estimatedPrice).toLocaleString()}
					</Text>
					<Text style={styles.date}>
						{new Date(item.createdAt).toLocaleDateString()}
					</Text>
				</View>
			</TouchableOpacity>
		);
	};

	if (!isAuthenticated) {
		return (
			<AuthRequiredState
				title="Sign in to view your activity"
				description="Your errand history, live deliveries, and past orders will show up here after you log in."
				redirectTo="/(tabs)/activity"
			/>
		);
	}

	if (isLoading) {
		return (
			<View style={styles.centered}>
				<ActivityIndicator size="large" color="#2F8F4E" />
			</View>
		);
	}

	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			{/* Search bar */}
			<View style={styles.searchContainer}>
				<TextInput
					style={styles.searchInput}
					placeholder="🔍  Search errands..."
					placeholderTextColor="#9CA3AF"
					value={searchQuery}
					onChangeText={setSearchQuery}
				/>
			</View>

			{/* Filter tabs */}
			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				contentContainerStyle={styles.filterRow}
				style={styles.filterContainer}>
				{FILTER_TABS.map((tab) => (
					<TouchableOpacity
						key={tab.key}
						style={[
							styles.filterTab,
							activeFilter === tab.key && styles.filterTabActive,
						]}
						onPress={() => setActiveFilter(tab.key)}>
						<Text style={styles.filterIcon}>{tab.icon}</Text>
						<Text
							style={[
								styles.filterLabel,
								activeFilter === tab.key && styles.filterLabelActive,
							]}>
							{tab.label}
						</Text>
						{activeFilter === tab.key && data && (
							<View style={styles.filterCount}>
								<Text style={styles.filterCountText}>
									{filteredData.length}
								</Text>
							</View>
						)}
					</TouchableOpacity>
				))}
			</ScrollView>

			<FlatList
				data={filteredData}
				keyExtractor={(item) => item.id}
				renderItem={renderErrand}
				contentContainerStyle={styles.list}
				showsVerticalScrollIndicator={false}
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={onRefresh}
						tintColor="#2F8F4E"
					/>
				}
				ListEmptyComponent={
					<View style={styles.emptyState}>
						<Text style={styles.emptyIcon}>📋</Text>
						<Text style={styles.emptyTitle}>
							{searchQuery ? "No results found" : "No errands yet"}
						</Text>
						<Text style={styles.emptySubtitle}>
							{searchQuery
								? "Try a different search term"
								: "Your errand history will appear here"}
						</Text>
					</View>
				}
			/>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: "#F9FAFB" },
	centered: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "#F9FAFB",
	},
	searchContainer: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
	searchInput: {
		backgroundColor: "#FFFFFF",
		borderWidth: 1,
		borderColor: "#E5E7EB",
		borderRadius: 12,
		paddingHorizontal: 16,
		paddingVertical: 12,
		fontSize: 15,
		color: "#111827",
	},
	filterContainer: { maxHeight: 52 },
	filterRow: { paddingHorizontal: 20, gap: 8, paddingBottom: 12 },
	filterTab: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		backgroundColor: "#FFFFFF",
		borderRadius: 20,
		paddingHorizontal: 14,
		paddingVertical: 8,
		borderWidth: 1,
		borderColor: "#E5E7EB",
	},
	filterTabActive: {
		backgroundColor: "#2F8F4E",
		borderColor: "#2F8F4E",
	},
	filterIcon: { fontSize: 14 },
	filterLabel: { fontSize: 13, fontWeight: "600", color: "#374151" },
	filterLabelActive: { color: "#FFFFFF" },
	filterCount: {
		backgroundColor: "rgba(255,255,255,0.3)",
		borderRadius: 10,
		paddingHorizontal: 7,
		paddingVertical: 1,
	},
	filterCountText: { fontSize: 11, fontWeight: "700", color: "#FFFFFF" },
	list: { padding: 20, paddingBottom: 40, paddingTop: 4 },
	card: {
		backgroundColor: "#FFFFFF",
		borderRadius: 14,
		padding: 16,
		marginBottom: 12,
		borderWidth: 1,
		borderColor: "#F3F4F6",
	},
	cardTop: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "flex-start",
		marginBottom: 12,
	},
	trackingNumber: { fontSize: 15, fontWeight: "700", color: "#111827" },
	category: { fontSize: 13, color: "#6B7280", marginTop: 2 },
	badge: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 10,
		paddingVertical: 5,
		borderRadius: 20,
		gap: 6,
	},
	badgeDot: { width: 6, height: 6, borderRadius: 3 },
	badgeText: { fontSize: 12, fontWeight: "600" },
	routeContainer: { gap: 8, marginBottom: 12 },
	routeRow: { flexDirection: "row", alignItems: "center", gap: 10 },
	routeDot: { width: 8, height: 8, borderRadius: 4 },
	routeText: { fontSize: 13, color: "#374151", flex: 1 },
	cardBottom: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		borderTopWidth: 1,
		borderTopColor: "#F3F4F6",
		paddingTop: 12,
	},
	price: { fontSize: 15, fontWeight: "700", color: "#111827" },
	date: { fontSize: 13, color: "#9CA3AF" },
	emptyState: { alignItems: "center", paddingTop: 80 },
	emptyIcon: { fontSize: 56, marginBottom: 16 },
	emptyTitle: { fontSize: 18, fontWeight: "600", color: "#374151" },
	emptySubtitle: { fontSize: 14, color: "#9CA3AF", marginTop: 4 },
});
