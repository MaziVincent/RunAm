import { useEffect, useMemo, useState } from "react";
import {
	ActivityIndicator,
	Image,
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
import { getServiceCategories } from "@runam/shared/api/vendors";
import { useAuthStore } from "@runam/shared/stores/auth-store";
import { useCartStore } from "@runam/shared/stores/cart-store";
import { useDeliveryAddressStore } from "@runam/shared/stores/delivery-address-store";
import { useLocationStore } from "@runam/shared/stores/location-store";
import { getUnreadCount } from "@runam/shared/api/notifications";
import type { ErrandCategory, ServiceCategory } from "@runam/shared/types";
import AddressPickerHeader from "../components/AddressPickerHeader";
import EmptyState from "../components/EmptyState";
import LiveOrderBar from "../components/LiveOrderBar";
import SearchSheet from "../components/SearchSheet";
import { colors, radii } from "../lib/design";

interface LogisticsOption {
	id: string;
	title: string;
	subtitle: string;
	icon: keyof typeof Ionicons.glyphMap;
	category: ErrandCategory;
	accent: string;
}

const logisticsOptions: LogisticsOption[] = [
	{
		id: "package",
		title: "Send package",
		subtitle: "Pickup and drop-off in minutes.",
		icon: "cube-outline",
		category: "PackageDelivery",
		accent: "#FFE3D6",
	},
	{
		id: "documents",
		title: "Document run",
		subtitle: "Urgent paperwork with proof of handoff.",
		icon: "document-text-outline",
		category: "DocumentDelivery",
		accent: "#E6E1FA",
	},
	{
		id: "laundry",
		title: "Laundry pickup",
		subtitle: "We'll handle the round-trip.",
		icon: "shirt-outline",
		category: "Laundry",
		accent: "#E5F1FB",
	},
];

export default function ServicesScreen() {
	const router = useRouter();
	const { isAuthenticated } = useAuthStore();
	const cartItems = useCartStore((state) => state.items);
	const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
	const { activeAddress } = useDeliveryAddressStore();
	const {
		lat,
		lng,
		request: requestLocation,
		hasRequested,
	} = useLocationStore();
	const [searchOpen, setSearchOpen] = useState(false);

	const effectiveLat = activeAddress?.latitude ?? lat;
	const effectiveLng = activeAddress?.longitude ?? lng;

	useEffect(() => {
		if (
			!hasRequested &&
			lat == null &&
			lng == null &&
			!activeAddress &&
			isAuthenticated
		) {
			void requestLocation();
		}
	}, [hasRequested, lat, lng, requestLocation, activeAddress, isAuthenticated]);

	const { data: unreadCount } = useQuery({
		queryKey: ["notifications", "unread-count"],
		queryFn: getUnreadCount,
		enabled: isAuthenticated,
	});

	const { data: categories, isLoading } = useQuery<ServiceCategory[]>({
		queryKey: ["service-categories"],
		queryFn: getServiceCategories,
	});

	const vendorCategories = useMemo(
		() =>
			(categories ?? [])
				.filter((category) => category.requiresVendor && category.isActive)
				.sort((first, second) => first.sortOrder - second.sortOrder),
		[categories],
	);

	const submitSearch = (term: string) => {
		setSearchOpen(false);
		router.push({
			pathname: "/vendors/list",
			params: term ? { search: term } : {},
		});
	};

	const openLogistics = (category: ErrandCategory) => {
		router.push({ pathname: "/errand/new", params: { category } });
	};

	const openCategory = (category: ServiceCategory) => {
		router.push({
			pathname: "/vendors/list",
			params: { categoryId: category.id, categoryName: category.name },
		});
	};

	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<ScrollView
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}>
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
						Search restaurants, products, or stores
					</Text>
				</TouchableOpacity>

				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Send something</Text>
					<Text style={styles.sectionMeta}>
						Skip the queue. Pick a delivery type to start the errand wizard.
					</Text>
					<View style={styles.logisticsGrid}>
						{logisticsOptions.map((option) => (
							<TouchableOpacity
								key={option.id}
								style={[
									styles.logisticsCard,
									{ backgroundColor: option.accent },
								]}
								onPress={() => openLogistics(option.category)}
								activeOpacity={0.85}>
								<View style={styles.logisticsIconWrap}>
									<Ionicons name={option.icon} size={22} color={colors.brand} />
								</View>
								<Text style={styles.logisticsTitle}>{option.title}</Text>
								<Text style={styles.logisticsSubtitle}>{option.subtitle}</Text>
							</TouchableOpacity>
						))}
					</View>
				</View>

				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Shop something</Text>
					<Text style={styles.sectionMeta}>
						Browse marketplace categories and tap into nearby vendors.
					</Text>
					{isLoading ? (
						<View style={styles.loadingWrap}>
							<ActivityIndicator color={colors.brandAccent} />
						</View>
					) : vendorCategories.length === 0 ? (
						<EmptyState
							icon="storefront-outline"
							title="No categories yet"
							description="Marketplace categories will appear here once vendors are live."
						/>
					) : (
						<View style={styles.categoryGrid}>
							{vendorCategories.map((category) => (
								<TouchableOpacity
									key={category.id}
									style={styles.categoryCard}
									onPress={() => openCategory(category)}
									activeOpacity={0.85}>
									<View style={styles.categoryIconWrap}>
										{category.iconUrl ? (
											<Image
												source={{ uri: category.iconUrl }}
												style={styles.categoryIconImage}
											/>
										) : (
											<Ionicons
												name="storefront-outline"
												size={20}
												color={colors.brandAccent}
											/>
										)}
									</View>
									<Text style={styles.categoryTitle}>{category.name}</Text>
									<Text style={styles.categoryDescription} numberOfLines={3}>
										{category.description ||
											"Browse nearby vendors and order in a few taps."}
									</Text>
								</TouchableOpacity>
							))}
						</View>
					)}
				</View>

				<TouchableOpacity
					style={styles.catalogButton}
					onPress={() => router.push("/vendors/categories")}
					activeOpacity={0.85}>
					<Text style={styles.catalogButtonText}>
						See all marketplace categories
					</Text>
				</TouchableOpacity>

				<View style={styles.bottomSpacer} />
			</ScrollView>

			<SearchSheet
				visible={searchOpen}
				onClose={() => setSearchOpen(false)}
				onSubmit={submitSearch}
				suggestions={vendorCategories.slice(0, 6).map((c) => c.name)}
				placeholder="Search restaurants, products, or stores"
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
		paddingBottom: 32,
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
		marginBottom: 22,
	},
	searchTriggerText: {
		flex: 1,
		fontSize: 14,
		fontWeight: "600",
		color: colors.textSecondary,
	},
	section: {
		marginBottom: 26,
	},
	sectionTitle: {
		fontSize: 20,
		fontWeight: "800",
		letterSpacing: -0.4,
		color: colors.textPrimary,
	},
	sectionMeta: {
		fontSize: 13,
		lineHeight: 18,
		color: colors.textSecondary,
		marginTop: 4,
		marginBottom: 14,
	},
	logisticsGrid: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 12,
	},
	logisticsCard: {
		width: "47.5%",
		borderRadius: radii.xl,
		padding: 14,
	},
	logisticsIconWrap: {
		width: 40,
		height: 40,
		borderRadius: 14,
		backgroundColor: "rgba(255,255,255,0.72)",
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 10,
	},
	logisticsTitle: {
		fontSize: 15,
		fontWeight: "800",
		color: colors.textPrimary,
	},
	logisticsSubtitle: {
		fontSize: 12,
		lineHeight: 17,
		color: colors.textSecondary,
		marginTop: 4,
	},
	loadingWrap: {
		paddingVertical: 24,
		alignItems: "center",
	},
	categoryGrid: {
		gap: 12,
	},
	categoryCard: {
		backgroundColor: colors.surface,
		borderRadius: radii.xl,
		padding: 16,
		borderWidth: 1,
		borderColor: colors.border,
	},
	categoryIconWrap: {
		width: 44,
		height: 44,
		borderRadius: 14,
		backgroundColor: colors.infoSoft,
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 10,
	},
	categoryIconImage: {
		width: 22,
		height: 22,
		borderRadius: 11,
	},
	categoryTitle: {
		fontSize: 16,
		fontWeight: "800",
		color: colors.textPrimary,
	},
	categoryDescription: {
		fontSize: 13,
		lineHeight: 19,
		color: colors.textSecondary,
		marginTop: 6,
	},
	catalogButton: {
		marginTop: 4,
		backgroundColor: colors.brandAccent,
		borderRadius: radii.lg,
		paddingVertical: 16,
		alignItems: "center",
	},
	catalogButtonText: {
		fontSize: 14,
		fontWeight: "800",
		color: colors.white,
	},
	bottomSpacer: {
		height: 80,
	},
});
