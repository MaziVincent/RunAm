import { useState, useRef } from "react";
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	ScrollView,
	Image,
	ActivityIndicator,
	Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { getVendorById } from "@runam/shared/api/vendors";
import { useCartStore } from "@runam/shared/stores/cart-store";
import type {
	VendorDetail,
	Product,
	ProductCategoryWithProducts,
} from "@runam/shared/types";

export default function VendorDetailScreen() {
	const router = useRouter();
	const { id } = useLocalSearchParams<{ id: string }>();
	const cartItemCount = useCartStore((s) => s.getItemCount());
	const cartVendorId = useCartStore((s) => s.vendorId);

	const { data: vendor, isLoading } = useQuery<VendorDetail>({
		queryKey: ["vendor", id],
		queryFn: () => getVendorById(id!),
		enabled: !!id,
	});

	const [activeCategory, setActiveCategory] = useState<string | null>(null);

	if (isLoading) {
		return (
			<SafeAreaView style={styles.container}>
				<View style={styles.center}>
					<ActivityIndicator size="large" color="#2F8F4E" />
				</View>
			</SafeAreaView>
		);
	}

	if (!vendor) {
		return (
			<SafeAreaView style={styles.container}>
				<View style={styles.center}>
					<Text style={styles.emptyText}>Vendor not found</Text>
					<TouchableOpacity onPress={() => router.back()}>
						<Text style={styles.linkText}>Go back</Text>
					</TouchableOpacity>
				</View>
			</SafeAreaView>
		);
	}

	const productCategories =
		vendor.productCategories?.filter((c) => c.isActive) ?? [];
	const selectedCategoryId = activeCategory || productCategories[0]?.id;

	const selectedProducts =
		productCategories
			.find((c) => c.id === selectedCategoryId)
			?.products?.filter((p) => p.isActive) ?? [];

	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<ScrollView
				showsVerticalScrollIndicator={false}
				stickyHeaderIndices={[2]}>
				{/* Banner */}
				{vendor.bannerUrl ? (
					<Image source={{ uri: vendor.bannerUrl }} style={styles.banner} />
				) : (
					<View style={styles.bannerPlaceholder}>
						<Text style={{ fontSize: 48 }}>🏪</Text>
					</View>
				)}

				{/* Back button overlay */}
				<TouchableOpacity
					style={styles.backOverlay}
					onPress={() => router.back()}>
					<Text style={styles.backIcon}>‹</Text>
				</TouchableOpacity>

				{/* Vendor Info */}
				<View style={styles.infoSection}>
					<View style={styles.nameRow}>
						<Text style={styles.vendorName}>{vendor.businessName}</Text>
						<View
							style={[
								styles.openBadge,
								{ backgroundColor: vendor.isOpen ? "#D1FAE5" : "#F3F4F6" },
							]}>
							<View
								style={[
									styles.openDot,
									{ backgroundColor: vendor.isOpen ? "#10B981" : "#9CA3AF" },
								]}
							/>
							<Text
								style={[
									styles.openText,
									{ color: vendor.isOpen ? "#065F46" : "#6B7280" },
								]}>
								{vendor.isOpen ? "Open" : "Closed"}
							</Text>
						</View>
					</View>

					{vendor.description ? (
						<Text style={styles.vendorDesc}>{vendor.description}</Text>
					) : null}

					<View style={styles.statsRow}>
						<View style={styles.statItem}>
							<Text style={styles.statValue}>
								⭐ {vendor.rating.toFixed(1)}
							</Text>
							<Text style={styles.statLabel}>
								{vendor.totalReviews} reviews
							</Text>
						</View>
						<View style={styles.statDivider} />
						<View style={styles.statItem}>
							<Text style={styles.statValue}>
								{vendor.estimatedPrepTimeMinutes} min
							</Text>
							<Text style={styles.statLabel}>Prep time</Text>
						</View>
						<View style={styles.statDivider} />
						<View style={styles.statItem}>
							<Text style={styles.statValue}>
								{vendor.deliveryFee > 0
									? `₦${vendor.deliveryFee.toLocaleString()}`
									: "Free"}
							</Text>
							<Text style={styles.statLabel}>Delivery</Text>
						</View>
					</View>

					{vendor.minimumOrderAmount > 0 && (
						<Text style={styles.minOrder}>
							Min. order: ₦{vendor.minimumOrderAmount.toLocaleString()}
						</Text>
					)}
				</View>

				{/* Category Tabs */}
				<View style={styles.categoryTabs}>
					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						contentContainerStyle={{ paddingHorizontal: 16 }}>
						{productCategories.map((cat) => (
							<TouchableOpacity
								key={cat.id}
								style={[
									styles.categoryTab,
									selectedCategoryId === cat.id && styles.categoryTabActive,
								]}
								onPress={() => setActiveCategory(cat.id)}>
								<Text
									style={[
										styles.categoryTabText,
										selectedCategoryId === cat.id &&
											styles.categoryTabTextActive,
									]}>
									{cat.name}
								</Text>
							</TouchableOpacity>
						))}
					</ScrollView>
				</View>

				{/* Products */}
				<View style={styles.productsSection}>
					{selectedProducts.length === 0 ? (
						<View style={styles.emptyProducts}>
							<Text style={styles.emptyText}>No products in this category</Text>
						</View>
					) : (
						selectedProducts.map((product) => (
							<TouchableOpacity
								key={product.id}
								style={styles.productCard}
								activeOpacity={0.7}
								onPress={() =>
									router.push({
										pathname: "/vendors/product",
										params: {
											productId: product.id,
											vendorId: vendor.id,
											vendorName: vendor.businessName,
											productJson: JSON.stringify(product),
										},
									})
								}>
								{product.imageUrl ? (
									<Image
										source={{ uri: product.imageUrl }}
										style={styles.productImage}
									/>
								) : (
									<View style={styles.productImagePlaceholder}>
										<Text style={{ fontSize: 28 }}>📦</Text>
									</View>
								)}
								<View style={styles.productInfo}>
									<Text style={styles.productName}>{product.name}</Text>
									{product.description ? (
										<Text style={styles.productDesc} numberOfLines={2}>
											{product.description}
										</Text>
									) : null}
									<View style={styles.priceRow}>
										<Text style={styles.productPrice}>
											₦{product.price.toLocaleString()}
										</Text>
										{product.compareAtPrice != null &&
											product.compareAtPrice > product.price && (
												<Text style={styles.comparePrice}>
													₦{product.compareAtPrice.toLocaleString()}
												</Text>
											)}
									</View>
									{!product.isAvailable && (
										<View style={styles.unavailableBadge}>
											<Text style={styles.unavailableText}>Unavailable</Text>
										</View>
									)}
								</View>
							</TouchableOpacity>
						))
					)}
				</View>
			</ScrollView>

			{/* Cart FAB */}
			{cartItemCount > 0 && cartVendorId === vendor.id && (
				<TouchableOpacity
					style={styles.cartFab}
					activeOpacity={0.8}
					onPress={() => router.push("/cart")}>
					<Text style={styles.cartFabText}>
						View Cart ({cartItemCount} items)
					</Text>
				</TouchableOpacity>
			)}
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#F9FAFB",
	},
	center: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	banner: {
		width: "100%",
		height: 180,
	},
	bannerPlaceholder: {
		width: "100%",
		height: 180,
		backgroundColor: "#F0FDF4",
		alignItems: "center",
		justifyContent: "center",
	},
	backOverlay: {
		position: "absolute",
		top: 12,
		left: 12,
		width: 36,
		height: 36,
		borderRadius: 18,
		backgroundColor: "rgba(255,255,255,0.9)",
		alignItems: "center",
		justifyContent: "center",
	},
	backIcon: {
		fontSize: 24,
		color: "#374151",
		fontWeight: "300",
		marginTop: -2,
	},
	infoSection: {
		paddingHorizontal: 20,
		paddingVertical: 16,
		backgroundColor: "#FFFFFF",
		borderBottomWidth: 1,
		borderBottomColor: "#F3F4F6",
	},
	nameRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	vendorName: {
		fontSize: 22,
		fontWeight: "800",
		color: "#111827",
		flex: 1,
	},
	openBadge: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 10,
		paddingVertical: 5,
		borderRadius: 12,
		marginLeft: 10,
	},
	openDot: {
		width: 7,
		height: 7,
		borderRadius: 4,
		marginRight: 5,
	},
	openText: {
		fontSize: 12,
		fontWeight: "700",
	},
	vendorDesc: {
		fontSize: 14,
		color: "#6B7280",
		marginTop: 6,
		lineHeight: 20,
	},
	statsRow: {
		flexDirection: "row",
		alignItems: "center",
		marginTop: 16,
		backgroundColor: "#F9FAFB",
		borderRadius: 12,
		padding: 12,
	},
	statItem: {
		flex: 1,
		alignItems: "center",
	},
	statValue: {
		fontSize: 15,
		fontWeight: "700",
		color: "#111827",
	},
	statLabel: {
		fontSize: 11,
		color: "#9CA3AF",
		marginTop: 2,
	},
	statDivider: {
		width: 1,
		height: 28,
		backgroundColor: "#E5E7EB",
	},
	minOrder: {
		fontSize: 12,
		color: "#6B7280",
		marginTop: 8,
		textAlign: "center",
	},
	categoryTabs: {
		backgroundColor: "#FFFFFF",
		paddingVertical: 12,
		borderBottomWidth: 1,
		borderBottomColor: "#F3F4F6",
	},
	categoryTab: {
		paddingHorizontal: 16,
		paddingVertical: 8,
		borderRadius: 20,
		backgroundColor: "#F3F4F6",
		marginRight: 8,
	},
	categoryTabActive: {
		backgroundColor: "#2F8F4E",
	},
	categoryTabText: {
		fontSize: 14,
		fontWeight: "600",
		color: "#6B7280",
	},
	categoryTabTextActive: {
		color: "#FFFFFF",
	},
	productsSection: {
		padding: 16,
	},
	emptyProducts: {
		paddingVertical: 40,
		alignItems: "center",
	},
	emptyText: {
		fontSize: 15,
		color: "#9CA3AF",
		fontWeight: "500",
	},
	linkText: {
		fontSize: 15,
		color: "#2F8F4E",
		fontWeight: "600",
		marginTop: 8,
	},
	productCard: {
		flexDirection: "row",
		backgroundColor: "#FFFFFF",
		borderRadius: 12,
		marginBottom: 12,
		overflow: "hidden",
		borderWidth: 1,
		borderColor: "#F3F4F6",
	},
	productImage: {
		width: 100,
		height: 100,
	},
	productImagePlaceholder: {
		width: 100,
		height: 100,
		backgroundColor: "#F3F4F6",
		alignItems: "center",
		justifyContent: "center",
	},
	productInfo: {
		flex: 1,
		padding: 12,
	},
	productName: {
		fontSize: 15,
		fontWeight: "700",
		color: "#111827",
	},
	productDesc: {
		fontSize: 13,
		color: "#6B7280",
		marginTop: 3,
		lineHeight: 18,
	},
	priceRow: {
		flexDirection: "row",
		alignItems: "center",
		marginTop: 6,
		gap: 6,
	},
	productPrice: {
		fontSize: 15,
		fontWeight: "700",
		color: "#111827",
	},
	comparePrice: {
		fontSize: 13,
		color: "#9CA3AF",
		textDecorationLine: "line-through",
	},
	unavailableBadge: {
		marginTop: 4,
		backgroundColor: "#FEE2E2",
		paddingHorizontal: 8,
		paddingVertical: 2,
		borderRadius: 6,
		alignSelf: "flex-start",
	},
	unavailableText: {
		fontSize: 11,
		fontWeight: "600",
		color: "#DC2626",
	},
	cartFab: {
		position: "absolute",
		bottom: 24,
		left: 20,
		right: 20,
		backgroundColor: "#2F8F4E",
		borderRadius: 16,
		paddingVertical: 16,
		alignItems: "center",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.15,
		shadowRadius: 12,
		elevation: 8,
	},
	cartFabText: {
		fontSize: 16,
		fontWeight: "700",
		color: "#FFFFFF",
	},
});
