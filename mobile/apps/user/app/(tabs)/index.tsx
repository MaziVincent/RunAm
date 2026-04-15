import { useEffect, useState } from "react";
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
import { getUnreadCount } from "@runam/shared/api/notifications";
import {
	getServiceCategories,
	getVendorProducts,
	getVendors,
} from "@runam/shared/api/vendors";
import { useAuthStore } from "@runam/shared/stores/auth-store";
import { useCartStore } from "@runam/shared/stores/cart-store";
import { useLocationStore } from "@runam/shared/stores/location-store";
import type {
	ErrandCategory,
	Product,
	ServiceCategory,
	Vendor,
} from "@runam/shared/types";

interface LogisticsShortcut {
	id: string;
	title: string;
	subtitle: string;
	icon: string;
	category: ErrandCategory;
	accent: string;
}

interface FeaturedProduct {
	product: Product;
	vendorId: string;
	vendorName: string;
	categoryName: string;
}

const logisticsShortcuts: LogisticsShortcut[] = [
	{
		id: "package-delivery",
		title: "Send a package",
		subtitle: "Pickup and drop-off in minutes",
		icon: "📦",
		category: "PackageDelivery",
		accent: "#DCFCE7",
	},
	{
		id: "document-delivery",
		title: "Move documents",
		subtitle: "Fast handoff for urgent files",
		icon: "📄",
		category: "DocumentDelivery",
		accent: "#E0F2FE",
	},
];

export default function HomeScreen() {
	const router = useRouter();
	const { user, isAuthenticated } = useAuthStore();
	const cartItems = useCartStore((state) => state.items);
	const { lat, lng, request, hasRequested } = useLocationStore();
	const [refreshing, setRefreshing] = useState(false);
	const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

	useEffect(() => {
		if (!hasRequested && lat == null && lng == null) {
			void request();
		}
	}, [hasRequested, lat, lng, request]);

	const { data: unreadCount } = useQuery({
		queryKey: ["notifications", "unread-count"],
		queryFn: getUnreadCount,
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
		data: vendorsData,
		isLoading: vendorsLoading,
		refetch: refetchVendors,
	} = useQuery({
		queryKey: ["vendors", "marketplace-home", lat, lng],
		queryFn: () =>
			getVendors({
				lat,
				lng,
				radius: lat != null && lng != null ? 15 : undefined,
				pageSize: 6,
			}),
	});

	const featuredVendors = (vendorsData?.items ?? []).filter(
		(vendor) => vendor.status === "Active",
	);

	const {
		data: featuredProducts,
		isLoading: featuredLoading,
		refetch: refetchProducts,
	} = useQuery<FeaturedProduct[]>({
		queryKey: [
			"vendors",
			"featured-products",
			featuredVendors.map((vendor) => vendor.id).join(","),
		],
		enabled: featuredVendors.length > 0,
		queryFn: async () => {
			const vendors = featuredVendors.slice(0, 4);
			const productGroups = await Promise.all(
				vendors.map(async (vendor) => ({
					vendor,
					categories: await getVendorProducts(vendor.id),
				})),
			);

			return productGroups
				.flatMap(({ vendor, categories }) =>
					categories.flatMap((category) =>
						category.products
							.filter((product) => product.isActive && product.isAvailable)
							.slice(0, 2)
							.map((product) => ({
								product,
								vendorId: vendor.id,
								vendorName: vendor.businessName,
								categoryName: category.name,
							})),
					),
				)
				.slice(0, 8);
		},
	});

	const vendorCategories = (serviceCategories ?? [])
		.filter((category) => category.requiresVendor && category.isActive)
		.sort((first, second) => first.sortOrder - second.sortOrder)
		.slice(0, 8);

	const handleRefresh = async () => {
		setRefreshing(true);
		await Promise.all([
			refetchCategories(),
			refetchVendors(),
			refetchProducts(),
		]);
		setRefreshing(false);
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

	const openProduct = (entry: FeaturedProduct) => {
		router.push({
			pathname: "/vendors/product",
			params: {
				productId: entry.product.id,
				vendorId: entry.vendorId,
				vendorName: entry.vendorName,
				productJson: JSON.stringify(entry.product),
			},
		});
	};

	const openVendor = (vendor: Vendor) => {
		router.push({ pathname: "/vendors/[id]", params: { id: vendor.id } });
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
						tintColor="#2F8F4E"
					/>
				}>
				<View style={styles.heroCard}>
					<View style={styles.heroGlowOne} />
					<View style={styles.heroGlowTwo} />
					<View style={styles.headerRow}>
						<View style={styles.headerCopy}>
							<Text style={styles.kicker}>Marketplace</Text>
							<Text style={styles.heroTitle}>
								Hello, {user?.firstName || "there"}
							</Text>
							<Text style={styles.heroSubtitle}>
								Shop vendors nearby, add items to cart, and only sign in when
								you&apos;re ready to check out.
							</Text>
						</View>
						<View style={styles.iconCluster}>
							<TouchableOpacity
								style={styles.headerIconButton}
								onPress={() => router.push("/notifications")}
								activeOpacity={0.8}>
								<Text style={styles.headerIcon}>🔔</Text>
								{isAuthenticated && (unreadCount?.unreadCount ?? 0) > 0 ? (
									<View style={styles.badge}>
										<Text style={styles.badgeText}>
											{Math.min(unreadCount?.unreadCount ?? 0, 99)}
										</Text>
									</View>
								) : null}
							</TouchableOpacity>
							<TouchableOpacity
								style={styles.headerIconButton}
								onPress={() => router.push("/cart")}
								activeOpacity={0.8}>
								<Text style={styles.headerIcon}>🛒</Text>
								{cartCount > 0 ? (
									<View style={styles.badge}>
										<Text style={styles.badgeText}>{Math.min(cartCount, 99)}</Text>
									</View>
								) : null}
							</TouchableOpacity>
						</View>
					</View>

					<View style={styles.heroActionsRow}>
						<TouchableOpacity
							style={styles.primaryHeroButton}
							onPress={() => router.push("/(tabs)/services")}
							activeOpacity={0.85}>
							<Text style={styles.primaryHeroButtonText}>Browse Services</Text>
						</TouchableOpacity>
						<TouchableOpacity
							style={styles.secondaryHeroButton}
							onPress={() => openLogistics("PackageDelivery")}
							activeOpacity={0.85}>
							<Text style={styles.secondaryHeroButtonText}>Quick Delivery</Text>
						</TouchableOpacity>
					</View>
				</View>

				<View style={styles.section}>
					<View style={styles.sectionHeader}>
						<Text style={styles.sectionTitle}>Logistics shortcuts</Text>
						<TouchableOpacity onPress={() => router.push("/(tabs)/services")}>
							<Text style={styles.sectionAction}>More services</Text>
						</TouchableOpacity>
					</View>
					<View style={styles.shortcutsRow}>
						{logisticsShortcuts.map((shortcut) => (
							<TouchableOpacity
								key={shortcut.id}
								style={[styles.shortcutCard, { backgroundColor: shortcut.accent }]}
								onPress={() => openLogistics(shortcut.category)}
								activeOpacity={0.85}>
								<Text style={styles.shortcutIcon}>{shortcut.icon}</Text>
								<Text style={styles.shortcutTitle}>{shortcut.title}</Text>
								<Text style={styles.shortcutSubtitle}>{shortcut.subtitle}</Text>
							</TouchableOpacity>
						))}
					</View>
				</View>

				<View style={styles.section}>
					<View style={styles.sectionHeader}>
						<Text style={styles.sectionTitle}>Shop by category</Text>
						<TouchableOpacity onPress={() => router.push("/vendors/categories")}>
							<Text style={styles.sectionAction}>See all</Text>
						</TouchableOpacity>
					</View>
					{categoriesLoading ? (
						<View style={styles.loadingWrap}>
							<ActivityIndicator color="#2F8F4E" />
						</View>
					) : (
						<ScrollView
							horizontal
							showsHorizontalScrollIndicator={false}
							contentContainerStyle={styles.categoryStrip}>
							{vendorCategories.map((category) => (
								<TouchableOpacity
									key={category.id}
									style={styles.categoryPill}
									onPress={() => openCategory(category)}
									activeOpacity={0.8}>
									<Text style={styles.categoryPillIcon}>{category.iconUrl || "🏪"}</Text>
									<Text style={styles.categoryPillText}>{category.name}</Text>
								</TouchableOpacity>
							))}
						</ScrollView>
					)}
				</View>

				<View style={styles.section}>
					<View style={styles.sectionHeader}>
						<Text style={styles.sectionTitle}>Featured products</Text>
						<TouchableOpacity onPress={() => router.push("/cart")}>
							<Text style={styles.sectionAction}>Open cart</Text>
						</TouchableOpacity>
					</View>
					{featuredLoading ? (
						<View style={styles.loadingWrap}>
							<ActivityIndicator color="#2F8F4E" />
						</View>
					) : featuredProducts && featuredProducts.length > 0 ? (
						<ScrollView
							horizontal
							showsHorizontalScrollIndicator={false}
							contentContainerStyle={styles.productStrip}>
							{featuredProducts.map((entry) => (
								<TouchableOpacity
									key={`${entry.vendorId}-${entry.product.id}`}
									style={styles.productCard}
									onPress={() => openProduct(entry)}
									activeOpacity={0.85}>
									{entry.product.imageUrl ? (
										<Image
											source={{ uri: entry.product.imageUrl }}
											style={styles.productImage}
										/>
									) : (
										<View style={styles.productImageFallback}>
											<Text style={styles.productImageEmoji}>🛍️</Text>
										</View>
									)}
									<Text style={styles.productVendor}>{entry.vendorName}</Text>
									<Text style={styles.productName} numberOfLines={2}>
										{entry.product.name}
									</Text>
									<Text style={styles.productMeta}>{entry.categoryName}</Text>
									<Text style={styles.productPrice}>
										₦{entry.product.price.toLocaleString()}
									</Text>
								</TouchableOpacity>
							))}
						</ScrollView>
					) : (
						<View style={styles.emptyCard}>
							<Text style={styles.emptyTitle}>No featured products yet</Text>
							<Text style={styles.emptyCopy}>
								Vendor catalogues will appear here as stores publish products.
							</Text>
						</View>
					)}
				</View>

				<View style={styles.section}>
					<View style={styles.sectionHeader}>
						<Text style={styles.sectionTitle}>Top vendors nearby</Text>
						<TouchableOpacity onPress={() => router.push("/vendors/categories")}>
							<Text style={styles.sectionAction}>Explore</Text>
						</TouchableOpacity>
					</View>
					{vendorsLoading ? (
						<View style={styles.loadingWrap}>
							<ActivityIndicator color="#2F8F4E" />
						</View>
					) : featuredVendors.length > 0 ? (
						featuredVendors.map((vendor) => (
							<TouchableOpacity
								key={vendor.id}
								style={styles.vendorCard}
								onPress={() => openVendor(vendor)}
								activeOpacity={0.85}>
								<View style={styles.vendorIdentity}>
									{vendor.logoUrl ? (
										<Image
											source={{ uri: vendor.logoUrl }}
											style={styles.vendorLogo}
										/>
									) : (
										<View style={styles.vendorLogoFallback}>
											<Text style={styles.vendorLogoText}>🏬</Text>
										</View>
									)}
									<View style={styles.vendorCopy}>
										<Text style={styles.vendorName}>{vendor.businessName}</Text>
										<Text style={styles.vendorMeta} numberOfLines={1}>
											{vendor.serviceCategories.map((item) => item.name).join(" • ")}
										</Text>
										<Text style={styles.vendorMeta} numberOfLines={1}>
											{vendor.address}
										</Text>
									</View>
								</View>
								<View style={styles.vendorStatsRow}>
									<View style={styles.vendorChip}>
										<Text style={styles.vendorChipText}>
											⭐ {vendor.rating.toFixed(1)}
										</Text>
									</View>
									<View style={styles.vendorChip}>
										<Text style={styles.vendorChipText}>
											₦{vendor.deliveryFee.toLocaleString()} delivery
										</Text>
									</View>
									<View
										style={[
											styles.statusPill,
											vendor.isOpen ? styles.statusOpen : styles.statusClosed,
										]}>
										<Text
											style={[
												styles.statusPillText,
												vendor.isOpen ? styles.statusOpenText : styles.statusClosedText,
											]}>
											{vendor.isOpen ? "Open now" : "Closed"}
										</Text>
									</View>
								</View>
							</TouchableOpacity>
						))
					) : (
						<View style={styles.emptyCard}>
							<Text style={styles.emptyTitle}>No vendors nearby yet</Text>
							<Text style={styles.emptyCopy}>
								Enable location or pull to refresh after vendors come online.
							</Text>
						</View>
					)}
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#F5F7F1",
	},
	scrollContent: {
		paddingBottom: 32,
	},
	heroCard: {
		marginHorizontal: 20,
		marginTop: 12,
		padding: 22,
		borderRadius: 28,
		backgroundColor: "#103E2B",
		overflow: "hidden",
	},
	heroGlowOne: {
		position: "absolute",
		top: -40,
		right: -20,
		width: 180,
		height: 180,
		borderRadius: 90,
		backgroundColor: "#1F7A56",
		opacity: 0.45,
	},
	heroGlowTwo: {
		position: "absolute",
		bottom: -60,
		left: -20,
		width: 160,
		height: 160,
		borderRadius: 80,
		backgroundColor: "#F4B63D",
		opacity: 0.18,
	},
	headerRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		gap: 16,
	},
	headerCopy: {
		flex: 1,
	},
	kicker: {
		fontSize: 12,
		fontWeight: "700",
		letterSpacing: 2,
		textTransform: "uppercase",
		color: "#B7E4C7",
		marginBottom: 8,
	},
	heroTitle: {
		fontSize: 30,
		fontWeight: "800",
		color: "#FFFFFF",
		letterSpacing: -0.8,
	},
	heroSubtitle: {
		fontSize: 15,
		lineHeight: 22,
		color: "#D1FAE5",
		marginTop: 10,
		maxWidth: 260,
	},
	iconCluster: {
		flexDirection: "row",
		alignItems: "flex-start",
		gap: 10,
	},
	headerIconButton: {
		width: 46,
		height: 46,
		borderRadius: 16,
		backgroundColor: "rgba(255,255,255,0.14)",
		alignItems: "center",
		justifyContent: "center",
	},
	headerIcon: {
		fontSize: 20,
	},
	badge: {
		position: "absolute",
		top: -6,
		right: -6,
		minWidth: 20,
		height: 20,
		paddingHorizontal: 5,
		borderRadius: 10,
		backgroundColor: "#F97316",
		alignItems: "center",
		justifyContent: "center",
	},
	badgeText: {
		fontSize: 11,
		fontWeight: "700",
		color: "#FFFFFF",
	},
	heroActionsRow: {
		flexDirection: "row",
		gap: 12,
		marginTop: 26,
	},
	primaryHeroButton: {
		flex: 1,
		backgroundColor: "#F5F7F1",
		borderRadius: 16,
		paddingVertical: 14,
		alignItems: "center",
	},
	primaryHeroButtonText: {
		fontSize: 15,
		fontWeight: "700",
		color: "#103E2B",
	},
	secondaryHeroButton: {
		paddingHorizontal: 18,
		borderRadius: 16,
		paddingVertical: 14,
		borderWidth: 1,
		borderColor: "rgba(255,255,255,0.24)",
		alignItems: "center",
		justifyContent: "center",
	},
	secondaryHeroButtonText: {
		fontSize: 14,
		fontWeight: "700",
		color: "#FFFFFF",
	},
	section: {
		marginTop: 28,
		paddingHorizontal: 20,
	},
	sectionHeader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		marginBottom: 14,
	},
	sectionTitle: {
		fontSize: 22,
		fontWeight: "800",
		color: "#142013",
		letterSpacing: -0.5,
	},
	sectionAction: {
		fontSize: 14,
		fontWeight: "700",
		color: "#2F8F4E",
	},
	shortcutsRow: {
		flexDirection: "row",
		gap: 12,
	},
	shortcutCard: {
		flex: 1,
		borderRadius: 20,
		padding: 16,
		minHeight: 150,
		justifyContent: "space-between",
	},
	shortcutIcon: {
		fontSize: 30,
		marginBottom: 16,
	},
	shortcutTitle: {
		fontSize: 18,
		fontWeight: "800",
		color: "#142013",
		letterSpacing: -0.4,
	},
	shortcutSubtitle: {
		fontSize: 13,
		lineHeight: 18,
		color: "#3F3F46",
		marginTop: 8,
	},
	loadingWrap: {
		paddingVertical: 24,
		alignItems: "center",
		justifyContent: "center",
	},
	categoryStrip: {
		paddingRight: 20,
		gap: 10,
	},
	categoryPill: {
		backgroundColor: "#FFFFFF",
		borderRadius: 18,
		paddingVertical: 14,
		paddingHorizontal: 16,
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
		borderWidth: 1,
		borderColor: "#E7EAE1",
	},
	categoryPillIcon: {
		fontSize: 20,
	},
	categoryPillText: {
		fontSize: 14,
		fontWeight: "700",
		color: "#243121",
	},
	productStrip: {
		paddingRight: 20,
		gap: 14,
	},
	productCard: {
		width: 210,
		backgroundColor: "#FFFFFF",
		borderRadius: 22,
		padding: 12,
		borderWidth: 1,
		borderColor: "#E7EAE1",
	},
	productImage: {
		width: "100%",
		height: 128,
		borderRadius: 16,
		marginBottom: 12,
	},
	productImageFallback: {
		width: "100%",
		height: 128,
		borderRadius: 16,
		marginBottom: 12,
		backgroundColor: "#F1F5EF",
		alignItems: "center",
		justifyContent: "center",
	},
	productImageEmoji: {
		fontSize: 32,
	},
	productVendor: {
		fontSize: 12,
		fontWeight: "700",
		color: "#2F8F4E",
		textTransform: "uppercase",
		letterSpacing: 1,
	},
	productName: {
		fontSize: 16,
		fontWeight: "700",
		color: "#142013",
		marginTop: 8,
		minHeight: 40,
	},
	productMeta: {
		fontSize: 13,
		color: "#6B7280",
		marginTop: 4,
	},
	productPrice: {
		fontSize: 18,
		fontWeight: "800",
		color: "#111827",
		marginTop: 10,
	},
	vendorCard: {
		backgroundColor: "#FFFFFF",
		borderRadius: 22,
		padding: 16,
		borderWidth: 1,
		borderColor: "#E7EAE1",
		marginBottom: 14,
	},
	vendorIdentity: {
		flexDirection: "row",
		gap: 12,
		alignItems: "center",
	},
	vendorLogo: {
		width: 58,
		height: 58,
		borderRadius: 18,
	},
	vendorLogoFallback: {
		width: 58,
		height: 58,
		borderRadius: 18,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "#F1F5EF",
	},
	vendorLogoText: {
		fontSize: 28,
	},
	vendorCopy: {
		flex: 1,
	},
	vendorName: {
		fontSize: 17,
		fontWeight: "800",
		color: "#142013",
	},
	vendorMeta: {
		fontSize: 13,
		color: "#6B7280",
		marginTop: 4,
	},
	vendorStatsRow: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 8,
		marginTop: 14,
	},
	vendorChip: {
		paddingHorizontal: 10,
		paddingVertical: 8,
		borderRadius: 999,
		backgroundColor: "#F1F5EF",
	},
	vendorChipText: {
		fontSize: 12,
		fontWeight: "700",
		color: "#374151",
	},
	statusPill: {
		paddingHorizontal: 10,
		paddingVertical: 8,
		borderRadius: 999,
	},
	statusOpen: {
		backgroundColor: "#DCFCE7",
	},
	statusClosed: {
		backgroundColor: "#FEE2E2",
	},
	statusPillText: {
		fontSize: 12,
		fontWeight: "700",
	},
	statusOpenText: {
		color: "#166534",
	},
	statusClosedText: {
		color: "#B91C1C",
	},
	emptyCard: {
		backgroundColor: "#FFFFFF",
		borderRadius: 22,
		padding: 20,
		borderWidth: 1,
		borderColor: "#E7EAE1",
	},
	emptyTitle: {
		fontSize: 16,
		fontWeight: "800",
		color: "#142013",
	},
	emptyCopy: {
		fontSize: 14,
		lineHeight: 21,
		color: "#6B7280",
		marginTop: 6,
	},
});
