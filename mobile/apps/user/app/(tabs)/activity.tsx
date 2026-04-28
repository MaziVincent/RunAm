import { useCallback, useMemo, useState } from "react";
import {
	ActivityIndicator,
	FlatList,
	RefreshControl,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useAuthStore } from "@runam/shared/stores/auth-store";
import { getErrands } from "@runam/shared/api/errands";
import type { Errand } from "@runam/shared/types";
import AuthRequiredState from "../components/AuthRequiredState";
import EmptyState from "../components/EmptyState";
import HeroCard from "../components/HeroCard";

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
	PendingPayment: "Pending payment",
	AcceptedByRider: "Accepted",
	EnRouteToPickup: "Heading to pickup",
	ArrivedAtPickup: "At pickup",
	ArrivedAtDropoff: "At dropoff",
	InTransit: "In transit",
};

const statusIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
	Pending: "search-outline",
	PendingPayment: "card-outline",
	Matched: "person-add-outline",
	AcceptedByRider: "checkmark-circle-outline",
	EnRouteToPickup: "navigate-outline",
	ArrivedAtPickup: "location-outline",
	Collected: "cube-outline",
	InTransit: "bicycle-outline",
	ArrivedAtDropoff: "flag-outline",
	Delivered: "checkmark-done-outline",
	Completed: "checkmark-done-outline",
	Cancelled: "close-circle-outline",
	Disputed: "alert-circle-outline",
};

type FilterTab = "All" | "Active" | "Completed" | "Cancelled";

const FILTER_TABS: {
	key: FilterTab;
	label: string;
	icon: keyof typeof Ionicons.glyphMap;
}[] = [
	{ key: "All", label: "All", icon: "apps-outline" },
	{ key: "Active", label: "Live", icon: "flash-outline" },
	{ key: "Completed", label: "Done", icon: "checkmark-circle-outline" },
	{ key: "Cancelled", label: "Cancelled", icon: "close-circle-outline" },
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

function getNextStepCopy(errand: Errand): string {
	if (ACTIVE_STATUSES.includes(errand.status)) {
		return "Keep this screen handy. Tracking will keep updating until delivery is complete.";
	}

	if (errand.status === "Delivered" || errand.status === "Completed") {
		return "Delivered successfully. You can reopen tracking or rate the rider when available.";
	}

	if (errand.status === "Cancelled" || errand.status === "Disputed") {
		return "This order is no longer moving. Revisit the details if you need the full route or payment context.";
	}

	return "Open the order to see the latest route, timeline, and payment status.";
}

export default function ActivityScreen() {
	const router = useRouter();
	const { isAuthenticated } = useAuthStore();
	const [refreshing, setRefreshing] = useState(false);
	const [activeFilter, setActiveFilter] = useState<FilterTab>("All");
	const [searchQuery, setSearchQuery] = useState("");

	const {
		data: errandsPages,
		refetch,
		isLoading,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
	} = useInfiniteQuery({
		queryKey: ["errands", "all"],
		initialPageParam: 1,
		queryFn: ({ pageParam }) => getErrands({ page: pageParam, pageSize: 20 }),
		getNextPageParam: (lastPage) =>
			lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
		enabled: isAuthenticated,
	});

	const data = useMemo(
		() => errandsPages?.pages.flatMap((page) => page.items) ?? [],
		[errandsPages],
	);

	const activeOrders = useMemo(
		() => data.filter((entry) => ACTIVE_STATUSES.includes(entry.status)),
		[data],
	);

	const onRefresh = useCallback(async () => {
		setRefreshing(true);
		await refetch();
		setRefreshing(false);
	}, [refetch]);

	const handleLoadMore = useCallback(() => {
		if (!hasNextPage || isFetchingNextPage) {
			return;
		}

		void fetchNextPage();
	}, [fetchNextPage, hasNextPage, isFetchingNextPage]);

	const filteredData = useMemo(() => {
		let result = data;

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
				activeOpacity={0.78}
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
						<Ionicons
							name={statusIcons[item.status] || "receipt-outline"}
							size={14}
							color={color}
						/>
						<Text style={[styles.badgeText, { color }]}>{displayStatus}</Text>
					</View>
				</View>

				<View style={styles.routeContainer}>
					{pickupStop ? (
						<View style={styles.routeRow}>
							<Ionicons name="ellipse" size={10} color="#19543B" />
							<Text style={styles.routeText} numberOfLines={1}>
								{pickupStop.address}
							</Text>
						</View>
					) : null}
					{dropoffStop ? (
						<View style={styles.routeRow}>
							<Ionicons name="navigate" size={12} color="#C93C37" />
							<Text style={styles.routeText} numberOfLines={1}>
								{dropoffStop.address}
							</Text>
						</View>
					) : null}
				</View>

				<View style={styles.nextStepCard}>
					<Ionicons name="sparkles-outline" size={16} color="#19543B" />
					<Text style={styles.nextStepText}>{getNextStepCopy(item)}</Text>
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
				title="Sign in to view your orders"
				description="Your live deliveries, order history, and tracking updates will appear here once you log in."
				redirectTo="/(tabs)/activity"
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

	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<FlatList
				data={filteredData}
				keyExtractor={(item) => item.id}
				renderItem={renderErrand}
				contentContainerStyle={styles.list}
				showsVerticalScrollIndicator={false}
				onEndReached={handleLoadMore}
				onEndReachedThreshold={0.3}
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={onRefresh}
						tintColor="#19543B"
					/>
				}
				ListHeaderComponent={
					<View>
						<HeroCard
							kicker="Orders"
							title="Track what is live and revisit what is done."
							subtitle="Orders is now the always-visible place for live deliveries, status changes, and your full activity history."
							style={styles.heroCard}>
							<View style={styles.heroStatsRow}>
								<View style={styles.heroStatCard}>
									<Text style={styles.heroStatValue}>
										{activeOrders.length}
									</Text>
									<Text style={styles.heroStatLabel}>Live now</Text>
								</View>
								<View style={styles.heroStatCard}>
									<Text style={styles.heroStatValue}>{data.length}</Text>
									<Text style={styles.heroStatLabel}>Total orders</Text>
								</View>
							</View>
						</HeroCard>

						<View style={styles.reassuranceCard}>
							<Ionicons name="trail-sign-outline" size={18} color="#19543B" />
							<Text style={styles.reassuranceText}>
								Live orders stay pinned above history, and every order card now
								tells you what to do next instead of leaving the status on its
								own.
							</Text>
						</View>

						{activeOrders.length > 0 ? (
							<View style={styles.liveSection}>
								<Text style={styles.liveSectionTitle}>Live tracking hub</Text>
								{activeOrders.slice(0, 2).map((item) => {
									const displayStatus =
										statusLabels[item.status] || item.status;
									const color = statusColors[item.status] || "#6B7280";

									return (
										<TouchableOpacity
											key={`live-${item.id}`}
											style={styles.liveCard}
											onPress={() =>
												router.push({
													pathname: "/errand/tracking",
													params: { id: item.id },
												})
											}
											activeOpacity={0.82}>
											<View
												style={[
													styles.liveIconWrap,
													{ backgroundColor: color + "18" },
												]}>
												<Ionicons
													name={statusIcons[item.status] || "receipt-outline"}
													size={20}
													color={color}
												/>
											</View>
											<View style={styles.liveCopy}>
												<Text style={styles.liveTitle}>{displayStatus}</Text>
												<Text style={styles.liveMeta}>
													#{item.trackingNumber}
												</Text>
											</View>
											<Ionicons
												name="arrow-forward"
												size={18}
												color="#64748B"
											/>
										</TouchableOpacity>
									);
								})}
							</View>
						) : null}

						<View style={styles.searchContainer}>
							<Ionicons name="search-outline" size={18} color="#9CA3AF" />
							<TextInput
								style={styles.searchInput}
								placeholder="Search tracking numbers or addresses"
								placeholderTextColor="#9CA3AF"
								value={searchQuery}
								onChangeText={setSearchQuery}
							/>
						</View>

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
									<Ionicons
										name={tab.icon}
										size={14}
										color={activeFilter === tab.key ? "#FFFFFF" : "#374151"}
									/>
									<Text
										style={[
											styles.filterLabel,
											activeFilter === tab.key && styles.filterLabelActive,
										]}>
										{tab.label}
									</Text>
								</TouchableOpacity>
							))}
						</ScrollView>
					</View>
				}
				ListEmptyComponent={
					<EmptyState
						icon="receipt-outline"
						title={searchQuery ? "No results found" : "No orders yet"}
						description={
							searchQuery
								? "Try a different search term."
								: "Your errand history will appear here."
						}
						style={styles.emptyState}
					/>
				}
				ListFooterComponent={
					hasNextPage ? (
						<TouchableOpacity
							style={styles.loadMoreButton}
							onPress={handleLoadMore}
							disabled={isFetchingNextPage}>
							{isFetchingNextPage ? (
								<ActivityIndicator size="small" color="#19543B" />
							) : (
								<Text style={styles.loadMoreText}>Load older activity</Text>
							)}
						</TouchableOpacity>
					) : data.length > 0 ? (
						<Text style={styles.historyEndText}>
							You have reached the end of your order history.
						</Text>
					) : null
				}
			/>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: "#F3F5EF" },
	centered: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "#F3F5EF",
	},
	heroCard: {
		marginHorizontal: 20,
		marginTop: 12,
		marginBottom: 16,
	},
	heroStatsRow: {
		gap: 10,
		marginTop: 18,
	},
	heroStatCard: {
		backgroundColor: "#FFFFFF",
		borderRadius: 20,
		padding: 16,
	},
	heroStatValue: {
		fontSize: 24,
		fontWeight: "800",
		color: "#142013",
	},
	heroStatLabel: {
		fontSize: 12,
		fontWeight: "700",
		letterSpacing: 0.8,
		textTransform: "uppercase",
		color: "#748175",
		marginTop: 4,
	},
	liveSection: {
		gap: 10,
		paddingHorizontal: 20,
		marginBottom: 16,
	},
	reassuranceCard: {
		marginHorizontal: 20,
		marginBottom: 16,
		backgroundColor: "#FFFFFF",
		borderRadius: 18,
		borderWidth: 1,
		borderColor: "#E4E8DE",
		padding: 14,
		flexDirection: "row",
		alignItems: "flex-start",
		gap: 10,
	},
	reassuranceText: {
		flex: 1,
		fontSize: 13,
		lineHeight: 18,
		color: "#475569",
	},
	liveSectionTitle: {
		fontSize: 20,
		fontWeight: "800",
		letterSpacing: -0.5,
		color: "#142013",
	},
	liveCard: {
		backgroundColor: "#FFFFFF",
		borderRadius: 22,
		borderWidth: 1,
		borderColor: "#E4E8DE",
		padding: 16,
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
	},
	liveIconWrap: {
		width: 44,
		height: 44,
		borderRadius: 14,
		alignItems: "center",
		justifyContent: "center",
	},
	liveCopy: {
		flex: 1,
	},
	liveTitle: {
		fontSize: 15,
		fontWeight: "800",
		color: "#142013",
	},
	liveMeta: {
		fontSize: 12,
		color: "#6B7280",
		marginTop: 3,
	},
	searchContainer: {
		paddingHorizontal: 20,
		paddingBottom: 8,
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
		backgroundColor: "#FFFFFF",
		marginHorizontal: 20,
		borderWidth: 1,
		borderColor: "#E4E8DE",
		borderRadius: 18,
	},
	searchInput: {
		flex: 1,
		paddingRight: 16,
		paddingVertical: 12,
		fontSize: 15,
		color: "#111827",
	},
	filterContainer: { maxHeight: 54 },
	filterRow: { paddingHorizontal: 20, gap: 8, paddingBottom: 12 },
	filterTab: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		backgroundColor: "#FFFFFF",
		borderRadius: 999,
		paddingHorizontal: 14,
		paddingVertical: 10,
		borderWidth: 1,
		borderColor: "#E4E8DE",
	},
	filterTabActive: {
		backgroundColor: "#19543B",
		borderColor: "#19543B",
	},
	filterLabel: { fontSize: 13, fontWeight: "600", color: "#374151" },
	filterLabelActive: { color: "#FFFFFF" },
	list: { paddingBottom: 40, paddingTop: 4 },
	card: {
		backgroundColor: "#FFFFFF",
		borderRadius: 22,
		padding: 16,
		marginBottom: 12,
		borderWidth: 1,
		borderColor: "#E4E8DE",
		marginHorizontal: 20,
	},
	cardTop: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "flex-start",
		marginBottom: 12,
		gap: 12,
	},
	trackingNumber: { fontSize: 15, fontWeight: "700", color: "#111827" },
	category: { fontSize: 13, color: "#6B7280", marginTop: 2 },
	badge: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 10,
		paddingVertical: 6,
		borderRadius: 999,
		gap: 6,
	},
	badgeText: { fontSize: 12, fontWeight: "700" },
	routeContainer: { gap: 8, marginBottom: 12 },
	routeRow: { flexDirection: "row", alignItems: "center", gap: 10 },
	routeText: { fontSize: 13, color: "#374151", flex: 1 },
	nextStepCard: {
		flexDirection: "row",
		alignItems: "flex-start",
		gap: 8,
		backgroundColor: "#EDF2EA",
		borderRadius: 14,
		padding: 12,
		marginBottom: 12,
	},
	nextStepText: {
		flex: 1,
		fontSize: 12,
		lineHeight: 17,
		color: "#3D5140",
	},
	cardBottom: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		borderTopWidth: 1,
		borderTopColor: "#EEF1EA",
		paddingTop: 12,
	},
	price: { fontSize: 15, fontWeight: "800", color: "#142013" },
	date: { fontSize: 12, color: "#6B7280" },
	emptyState: {
		marginHorizontal: 20,
		alignItems: "center",
		paddingTop: 60,
		paddingBottom: 20,
	},
	emptyIconWrap: {
		width: 64,
		height: 64,
		borderRadius: 20,
		backgroundColor: "#FFFFFF",
		borderWidth: 1,
		borderColor: "#E4E8DE",
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 12,
	},
	emptyTitle: { fontSize: 16, fontWeight: "600", color: "#374151" },
	emptySubtitle: {
		fontSize: 14,
		color: "#9CA3AF",
		marginTop: 4,
		textAlign: "center",
	},
	loadMoreButton: {
		marginHorizontal: 20,
		marginTop: 4,
		marginBottom: 16,
		paddingVertical: 14,
		borderRadius: 14,
		borderWidth: 1,
		borderColor: "#D6DDD1",
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "#FFFFFF",
	},
	loadMoreText: { fontSize: 14, fontWeight: "700", color: "#19543B" },
	historyEndText: {
		textAlign: "center",
		fontSize: 13,
		lineHeight: 18,
		color: "#6B7280",
		marginHorizontal: 32,
		marginTop: 4,
	},
});
