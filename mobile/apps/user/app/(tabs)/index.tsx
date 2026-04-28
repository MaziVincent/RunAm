import { useEffect, useMemo, useState } from "react";
import {
	ActivityIndicator,
	Image,
	RefreshControl,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { getErrands } from "@runam/shared/api/errands";
import { getUnreadCount } from "@runam/shared/api/notifications";
import { getServiceCategories, getVendors } from "@runam/shared/api/vendors";
import { useAuthStore } from "@runam/shared/stores/auth-store";
import { useCartStore } from "@runam/shared/stores/cart-store";
import { useDeliveryAddressStore } from "@runam/shared/stores/delivery-address-store";
import { useLocationStore } from "@runam/shared/stores/location-store";
import type {
	Errand,
	ErrandCategory,
	ServiceCategory,
	Vendor,
} from "@runam/shared/types";
import AddressPickerHeader from "../components/AddressPickerHeader";
import CategoryRail, {
	buildVendorCategoryTiles,
} from "../components/CategoryRail";
import EmptyState from "../components/EmptyState";
import LiveOrderBar from "../components/LiveOrderBar";
import PromoCarousel, { type PromoSlide } from "../components/PromoCarousel";
import SearchSheet from "../components/SearchSheet";
import VendorCard from "../components/VendorCard";
import { colors } from "../lib/design";
import { getVendorDiscoveryTags, getVendorDistanceKm } from "../lib/discovery";

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

const promoSlides: PromoSlide[] = [
	{
		id: "free-delivery",
		eyebrow: "This week",
		title: "₦0 delivery on first order",
		subtitle: "Use code RUNAM0 at checkout.",
		icon: "bicycle-outline",
		accent: "#DDF3E7",
	},
	{
		id: "send-package",
		eyebrow: "Send anything",
		title: "Same-day package delivery",
		subtitle: "Pickup in minutes, track live.",
		icon: "cube-outline",
		accent: "#FFE3D6",
	},
	{
		id: "groceries",
		eyebrow: "Stock the kitchen",
		title: "Groceries from local markets",
		subtitle: "Curated picks delivered cold.",
		icon: "basket-outline",
		accent: "#E5F1FB",
	},
];

export default function HomeScreen() {
	const router = useRouter();
	const { user, isAuthenticated } = useAuthStore();
	const cartItems = useCartStore((state) => state.items);
	const cartVendorName = useCartStore((state) => state.vendorName);
	const { activeAddress } = useDeliveryAddressStore();
	const { lat, lng, request, hasRequested } = useLocationStore();
	const [refreshing, setRefreshing] = useState(false);
	const [searchOpen, setSearchOpen] = useState(false);
	const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

	const effectiveLat = activeAddress?.latitude ?? lat;
	const effectiveLng = activeAddress?.longitude ?? lng;

	useEffect(() => {
		if (!hasRequested && lat == null && lng == null && !activeAddress) {
			void request();
		}
	}, [hasRequested, lat, lng, request, activeAddress]);

	const { data: unreadCount } = useQuery({
		queryKey: ["notifications", "unread-count"],
		queryFn: getUnreadCount,
		enabled: isAuthenticated,
	});

	const {
		data: recentOrders,
		isLoading: ordersLoading,
		refetch: refetchOrders,
	} = useQuery({
		queryKey: ["home", "recent-orders"],
		queryFn: () => getErrands({ page: 1, pageSize: 6 }),
		enabled: isAuthenticated,
	});

	const {
		data: serviceCategories,
		isLoading: categoriesLoading,
		refetch: refetchCategories,
	} = useQuery<ServiceCategory[]>({
		queryKey: ["service-categories"],
		queryFn: getServiceCategories,
	});

	const {
		data: vendorResult,
		isLoading: vendorsLoading,
		refetch: refetchVendors,
	} = useQuery({
		queryKey: ["home", "recommendations", effectiveLat, effectiveLng],
		queryFn: async () => {
			const params = { pageSize: 8 };

			if (effectiveLat != null && effectiveLng != null) {
				const nearby = await getVendors({
					...params,
					lat: effectiveLat,
					lng: effectiveLng,
					radius: 15,
				});

				if (nearby.items.length > 0) {
					return nearby;
				}
			}

			return getVendors(params);
		},
	});

	const activeOrders = useMemo(
		() =>
			(recentOrders?.items ?? []).filter((order) =>
				ACTIVE_STATUSES.includes(order.status),
			),
		[recentOrders],
	);

	const recommendedCategories = useMemo(
		() =>
			(serviceCategories ?? [])
				.filter((category) => category.requiresVendor && category.isActive)
				.sort((first, second) => first.sortOrder - second.sortOrder),
		[serviceCategories],
	);

	const activeVendors = useMemo(
		() =>
			(vendorResult?.items ?? []).filter(
				(vendor: Vendor) => vendor.status === "Active",
			),
		[vendorResult],
	);

	const topRatedVendors = useMemo(
		() =>
			[...activeVendors]
				.sort((first, second) => second.rating - first.rating)
				.slice(0, 5),
		[activeVendors],
	);

	const fastestVendors = useMemo(
		() =>
			[...activeVendors]
				.sort(
					(first, second) =>
						first.estimatedPrepTimeMinutes - second.estimatedPrepTimeMinutes,
				)
				.slice(0, 5),
		[activeVendors],
	);

	const completedShortcuts = useMemo(
		() =>
			(recentOrders?.items ?? [])
				.filter(
					(order) =>
						!ACTIVE_STATUSES.includes(order.status) &&
						order.status !== "Cancelled" &&
						order.status !== "Disputed",
				)
				.slice(0, 5),
		[recentOrders],
	);

	const popularSuggestions = useMemo(
		() => recommendedCategories.map((category) => category.name).slice(0, 6),
		[recommendedCategories],
	);

	const categoryTiles = useMemo(() => {
		const baseTiles = buildVendorCategoryTiles(
			recommendedCategories,
			(category) =>
				router.push({
					pathname: "/vendors/list",
					params: { categoryId: category.id, categoryName: category.name },
				}),
		);
		return [
			{
				id: "send-package",
				title: "Send package",
				icon: "cube-outline" as const,
				accent: "#FFE3D6",
				onPress: () =>
					router.push({
						pathname: "/errand/new",
						params: { category: "PackageDelivery" satisfies ErrandCategory },
					}),
			},
			...baseTiles,
		];
	}, [recommendedCategories, router]);

	const handleRefresh = async () => {
		setRefreshing(true);
		await Promise.all([refetchOrders(), refetchCategories(), refetchVendors()]);
		setRefreshing(false);
	};

	const submitSearch = (term: string) => {
		setSearchOpen(false);
		router.push({
			pathname: "/vendors/list",
			params: term ? { search: term } : {},
		});
	};

	const openVendor = (vendor: Vendor) => {
		router.push({ pathname: "/vendors/[id]", params: { id: vendor.id } });
	};

	const openOrderAgain = (order: Errand) => {
		if (
			order.category === "FoodDelivery" ||
			order.category === "GroceryShopping"
		) {
			router.push("/(tabs)/services");
			return;
		}
		router.push({
			pathname: "/errand/new",
			params: { category: order.category },
		});
	};

	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<ScrollView
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={handleRefresh}
						tintColor={colors.brandAccent}
					/>
				}>
				<AddressPickerHeader
					notificationsCount={unreadCount?.unreadCount ?? 0}
					cartCount={cartCount}
					onNotificationsPress={() => router.push("/notifications")}
					onCartPress={() => router.push("/cart")}
				/>

				<TouchableOpacity
					style={styles.searchTrigger}
					activeOpacity={0.85}
					onPress={() => setSearchOpen(true)}>
					<Ionicons name="search-outline" size={18} color={colors.textMuted} />
					<Text style={styles.searchTriggerText}>
						{`Hey ${user?.firstName || "there"}, what can we get you today?`}
					</Text>
					<View style={styles.searchTriggerIcon}>
						<Ionicons name="options-outline" size={16} color={colors.white} />
					</View>
				</TouchableOpacity>

				<View style={styles.categoriesBlock}>
					{categoriesLoading && categoryTiles.length === 1 ? (
						<View style={styles.categoryLoading}>
							<ActivityIndicator color={colors.brandAccent} />
						</View>
					) : (
						<CategoryRail tiles={categoryTiles} />
					)}
				</View>

				<PromoCarousel slides={promoSlides} />

				{cartCount > 0 ? (
					<TouchableOpacity
						style={styles.resumeCard}
						onPress={() => router.push("/cart")}
						activeOpacity={0.85}>
						<View style={styles.resumeIconWrap}>
							<Ionicons
								name="bag-check-outline"
								size={22}
								color={colors.brandAccent}
							/>
						</View>
						<View style={styles.resumeCopy}>
							<Text style={styles.resumeTitle}>Resume your cart</Text>
							<Text style={styles.resumeText}>
								{cartCount} item{cartCount === 1 ? "" : "s"}
								{cartVendorName
									? ` from ${cartVendorName}`
									: " waiting for checkout"}
							</Text>
						</View>
						<Ionicons
							name="arrow-forward"
							size={18}
							color={colors.brandAccent}
						/>
					</TouchableOpacity>
				) : null}

				{isAuthenticated && completedShortcuts.length > 0 ? (
					<View style={styles.section}>
						<View style={styles.sectionHeader}>
							<Text style={styles.sectionTitle}>Order it again</Text>
							<TouchableOpacity onPress={() => router.push("/(tabs)/activity")}>
								<Text style={styles.sectionAction}>History</Text>
							</TouchableOpacity>
						</View>
						<ScrollView
							horizontal
							showsHorizontalScrollIndicator={false}
							contentContainerStyle={styles.recentRail}>
							{completedShortcuts.map((order) => {
								const initials = (order.description ?? order.category)
									.split(" ")
									.map((part) => part.charAt(0))
									.slice(0, 2)
									.join("")
									.toUpperCase();
								return (
									<TouchableOpacity
										key={order.id}
										style={styles.reorderCard}
										onPress={() => openOrderAgain(order)}
										activeOpacity={0.85}>
										<View style={styles.reorderAvatar}>
											<Text style={styles.reorderAvatarText}>
												{initials || "RA"}
											</Text>
										</View>
										<View style={styles.reorderCopy}>
											<Text style={styles.reorderTitle} numberOfLines={1}>
												{order.description?.trim() || order.category}
											</Text>
											<Text style={styles.reorderMeta} numberOfLines={1}>
												#{order.trackingNumber}
											</Text>
										</View>
										<View style={styles.reorderButton}>
											<Ionicons
												name="repeat"
												size={14}
												color={colors.brandAccent}
											/>
											<Text style={styles.reorderButtonText}>Reorder</Text>
										</View>
									</TouchableOpacity>
								);
							})}
						</ScrollView>
					</View>
				) : null}

				<View style={styles.section}>
					<View style={styles.sectionHeader}>
						<Text style={styles.sectionTitle}>Top rated near you</Text>
						<TouchableOpacity
							onPress={() =>
								router.push({
									pathname: "/vendors/list",
									params: { sort: "rating" },
								})
							}>
							<Text style={styles.sectionAction}>See more</Text>
						</TouchableOpacity>
					</View>
					{vendorsLoading ? (
						<View style={styles.loadingCard}>
							<ActivityIndicator color={colors.brandAccent} />
						</View>
					) : topRatedVendors.length > 0 ? (
						<ScrollView
							horizontal
							showsHorizontalScrollIndicator={false}
							contentContainerStyle={styles.railRow}>
							{topRatedVendors.map((vendor) => (
								<VendorCard
									key={`rated-${vendor.id}`}
									vendor={vendor}
									onPress={() => openVendor(vendor)}
									style={styles.railCard}
									distanceKm={getVendorDistanceKm(
										vendor,
										effectiveLat,
										effectiveLng,
									)}
									rankingLabel="Top rated nearby"
									tags={getVendorDiscoveryTags(vendor)}
								/>
							))}
						</ScrollView>
					) : (
						<EmptyState
							icon="storefront-outline"
							title="No vendors yet"
							description="Pull to refresh once stores come online in your area."
						/>
					)}
				</View>

				<View style={styles.section}>
					<View style={styles.sectionHeader}>
						<Text style={styles.sectionTitle}>Fast delivery</Text>
						<TouchableOpacity onPress={() => router.push("/(tabs)/services")}>
							<Text style={styles.sectionAction}>Explore</Text>
						</TouchableOpacity>
					</View>

					{effectiveLat == null || effectiveLng == null ? (
						<View style={styles.recommendationBanner}>
							<Ionicons
								name="location-outline"
								size={18}
								color={colors.brandAccent}
							/>
							<Text style={styles.recommendationBannerText}>
								Set a delivery address to see picks ranked by distance.
							</Text>
						</View>
					) : null}

					{vendorsLoading ? (
						<View style={styles.loadingCard}>
							<ActivityIndicator color={colors.brandAccent} />
						</View>
					) : fastestVendors.length > 0 ? (
						<ScrollView
							horizontal
							showsHorizontalScrollIndicator={false}
							contentContainerStyle={styles.railRow}>
							{fastestVendors.map((vendor) => (
								<VendorCard
									key={`fast-${vendor.id}`}
									vendor={vendor}
									onPress={() => openVendor(vendor)}
									style={styles.railCard}
									distanceKm={getVendorDistanceKm(
										vendor,
										effectiveLat,
										effectiveLng,
									)}
									rankingLabel="Fast prep"
									tags={getVendorDiscoveryTags(vendor)}
								/>
							))}
						</ScrollView>
					) : (
						<EmptyState
							icon="flash-outline"
							title="No fast picks"
							description="We'll surface quick-prep stores once they're live."
						/>
					)}
				</View>

				{ordersLoading || activeOrders.length === 0 ? null : (
					<View style={styles.section}>
						<View style={styles.sectionHeader}>
							<Text style={styles.sectionTitle}>Live orders</Text>
							<TouchableOpacity onPress={() => router.push("/(tabs)/activity")}>
								<Text style={styles.sectionAction}>See all</Text>
							</TouchableOpacity>
						</View>
						{activeOrders.slice(0, 2).map((order) => {
							const pickup = order.stops?.find((s) => s.stopType === "Pickup");
							const dropoff = order.stops?.find(
								(s) => s.stopType === "Dropoff",
							);
							return (
								<TouchableOpacity
									key={order.id}
									style={styles.orderCard}
									onPress={() =>
										router.push({
											pathname: "/errand/tracking",
											params: { id: order.id },
										})
									}
									activeOpacity={0.85}>
									<View style={styles.orderTopRow}>
										<View>
											<Text style={styles.orderLabel}>
												#{order.trackingNumber}
											</Text>
											<Text style={styles.orderTitle}>{order.status}</Text>
										</View>
										<View style={styles.orderStatusPill}>
											<Text style={styles.orderStatusText}>
												{order.category}
											</Text>
										</View>
									</View>
									<View style={styles.routeRow}>
										<Ionicons
											name="ellipse"
											size={10}
											color={colors.brandAccent}
										/>
										<Text style={styles.routeText} numberOfLines={1}>
											{pickup?.address || "Pickup pending"}
										</Text>
									</View>
									<View style={styles.routeRow}>
										<Ionicons name="navigate" size={12} color={colors.error} />
										<Text style={styles.routeText} numberOfLines={1}>
											{dropoff?.address || "Dropoff pending"}
										</Text>
									</View>
								</TouchableOpacity>
							);
						})}
					</View>
				)}

				<View style={styles.bottomSpacer} />
			</ScrollView>

			<SearchSheet
				visible={searchOpen}
				onClose={() => setSearchOpen(false)}
				onSubmit={submitSearch}
				suggestions={popularSuggestions}
			/>

			<LiveOrderBar />
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: colors.background,
	},
	scrollContent: {
		paddingHorizontal: 20,
		paddingBottom: 36,
	},
	searchTrigger: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		backgroundColor: colors.surface,
		borderRadius: 999,
		borderWidth: 1,
		borderColor: colors.border,
		paddingHorizontal: 14,
		paddingVertical: 12,
		marginBottom: 18,
	},
	searchTriggerText: {
		flex: 1,
		fontSize: 14,
		fontWeight: "600",
		color: colors.textSecondary,
	},
	searchTriggerIcon: {
		width: 32,
		height: 32,
		borderRadius: 16,
		backgroundColor: colors.brandAccent,
		alignItems: "center",
		justifyContent: "center",
	},
	categoriesBlock: {
		marginBottom: 18,
	},
	categoryLoading: {
		paddingVertical: 24,
		alignItems: "center",
	},
	resumeCard: {
		backgroundColor: colors.surface,
		borderRadius: 22,
		borderWidth: 1,
		borderColor: colors.border,
		padding: 16,
		marginBottom: 18,
		flexDirection: "row",
		alignItems: "center",
		gap: 14,
	},
	resumeIconWrap: {
		width: 44,
		height: 44,
		borderRadius: 14,
		backgroundColor: colors.brandSoft,
		alignItems: "center",
		justifyContent: "center",
	},
	resumeCopy: {
		flex: 1,
	},
	resumeTitle: {
		fontSize: 15,
		fontWeight: "800",
		color: colors.textPrimary,
	},
	resumeText: {
		fontSize: 12,
		color: colors.textSecondary,
		marginTop: 2,
	},
	section: {
		marginBottom: 22,
	},
	sectionHeader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		marginBottom: 12,
	},
	sectionTitle: {
		fontSize: 20,
		fontWeight: "800",
		color: colors.textPrimary,
		letterSpacing: -0.4,
	},
	sectionAction: {
		fontSize: 13,
		fontWeight: "700",
		color: colors.brandAccent,
	},
	loadingCard: {
		backgroundColor: colors.surface,
		borderRadius: 22,
		borderWidth: 1,
		borderColor: colors.border,
		paddingVertical: 28,
		alignItems: "center",
	},
	recentRail: {
		gap: 12,
		paddingBottom: 2,
	},
	reorderCard: {
		width: 220,
		backgroundColor: colors.surface,
		borderRadius: 18,
		borderWidth: 1,
		borderColor: colors.border,
		padding: 12,
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
	},
	reorderAvatar: {
		width: 44,
		height: 44,
		borderRadius: 14,
		backgroundColor: colors.brandSoft,
		alignItems: "center",
		justifyContent: "center",
	},
	reorderAvatarText: {
		fontSize: 14,
		fontWeight: "800",
		color: colors.brand,
	},
	reorderCopy: {
		flex: 1,
	},
	reorderTitle: {
		fontSize: 14,
		fontWeight: "800",
		color: colors.textPrimary,
	},
	reorderMeta: {
		fontSize: 11,
		fontWeight: "700",
		color: colors.textMuted,
		marginTop: 2,
	},
	reorderButton: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
		paddingHorizontal: 8,
		paddingVertical: 6,
		borderRadius: 999,
		backgroundColor: colors.brandSoft,
	},
	reorderButtonText: {
		fontSize: 11,
		fontWeight: "800",
		color: colors.brandAccent,
	},
	railRow: {
		gap: 12,
		paddingBottom: 2,
	},
	railCard: {
		width: 286,
	},
	orderCard: {
		backgroundColor: colors.surface,
		borderRadius: 22,
		borderWidth: 1,
		borderColor: colors.border,
		padding: 18,
		marginBottom: 12,
	},
	orderTopRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "flex-start",
		marginBottom: 10,
		gap: 10,
	},
	orderLabel: {
		fontSize: 11,
		fontWeight: "700",
		letterSpacing: 1,
		textTransform: "uppercase",
		color: colors.textMuted,
		marginBottom: 4,
	},
	orderTitle: {
		fontSize: 16,
		fontWeight: "800",
		color: colors.textPrimary,
	},
	orderStatusPill: {
		borderRadius: 999,
		backgroundColor: colors.infoSoft,
		paddingHorizontal: 12,
		paddingVertical: 7,
	},
	orderStatusText: {
		fontSize: 11,
		fontWeight: "700",
		color: colors.brandAccent,
		textTransform: "uppercase",
		letterSpacing: 0.7,
	},
	routeRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
		marginTop: 6,
	},
	routeText: {
		flex: 1,
		fontSize: 13,
		lineHeight: 18,
		color: colors.textSecondary,
	},
	recommendationBanner: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
		backgroundColor: colors.infoSoft,
		borderRadius: 18,
		padding: 14,
		marginBottom: 12,
	},
	recommendationBannerText: {
		flex: 1,
		fontSize: 13,
		lineHeight: 18,
		color: colors.textSecondary,
	},
	bottomSpacer: {
		height: 80,
	},
});
