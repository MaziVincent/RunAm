import { useMemo, useState } from "react";
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
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { getVendorById } from "@runam/shared/api/vendors";
import { useCartStore } from "@runam/shared/stores/cart-store";
import type { Product, VendorDetail } from "@runam/shared/types";
import { getVendorDiscoveryTags } from "../lib/discovery";

function formatCurrency(amount: number): string {
	return `₦${amount.toLocaleString()}`;
}

type ProductWithCategory = {
	product: Product;
	categoryName: string;
};

export default function VendorDetailScreen() {
	const router = useRouter();
	const { id } = useLocalSearchParams<{ id: string }>();
	const cartItemCount = useCartStore((state) => state.getItemCount());
	const cartVendorId = useCartStore((state) => state.vendorId);
	const cartSubtotal = useCartStore((state) => state.getSubtotal());

	const { data: vendor, isLoading } = useQuery<VendorDetail>({
		queryKey: ["vendor", id],
		queryFn: () => getVendorById(id!),
		enabled: !!id,
	});

	const [activeCategory, setActiveCategory] = useState<string | null>(null);

	const productCategories = useMemo(
		() =>
			(vendor?.productCategories ?? []).filter(
				(category) =>
					category.isActive &&
					(category.products?.some((product) => product.isActive) ?? false),
			),
		[vendor?.productCategories],
	);

	const selectedCategoryId = activeCategory || productCategories[0]?.id;
	const selectedCategory = productCategories.find(
		(category) => category.id === selectedCategoryId,
	);
	const selectedProducts = useMemo(
		() =>
			(selectedCategory?.products ?? []).filter((product) => product.isActive),
		[selectedCategory],
	);

	const featuredProducts = useMemo<ProductWithCategory[]>(() => {
		const items = productCategories.flatMap((category) =>
			category.products
				.filter((product) => product.isActive)
				.map((product) => ({ product, categoryName: category.name })),
		);

		return [...items]
			.sort((first, second) => {
				const firstOnPromo =
					first.product.compareAtPrice != null &&
					first.product.compareAtPrice > first.product.price;
				const secondOnPromo =
					second.product.compareAtPrice != null &&
					second.product.compareAtPrice > second.product.price;

				if (firstOnPromo !== secondOnPromo) {
					return Number(secondOnPromo) - Number(firstOnPromo);
				}

				if (first.product.isAvailable !== second.product.isAvailable) {
					return (
						Number(second.product.isAvailable) -
						Number(first.product.isAvailable)
					);
				}

				return (first.product.sortOrder ?? 0) - (second.product.sortOrder ?? 0);
			})
			.slice(0, 4);
	}, [productCategories]);

	if (isLoading) {
		return (
			<SafeAreaView style={styles.container}>
				<View style={styles.centered}>
					<ActivityIndicator size="large" color="#19543B" />
				</View>
			</SafeAreaView>
		);
	}

	if (!vendor) {
		return (
			<SafeAreaView style={styles.container}>
				<View style={styles.centered}>
					<Text style={styles.emptyTitle}>Vendor not found</Text>
					<TouchableOpacity onPress={() => router.back()} activeOpacity={0.8}>
						<Text style={styles.linkText}>Go back</Text>
					</TouchableOpacity>
				</View>
			</SafeAreaView>
		);
	}

	const isCartForVendor = cartItemCount > 0 && cartVendorId === vendor.id;

	const vendorTags = getVendorDiscoveryTags(vendor);

	const openProduct = (product: Product) => {
		router.push({
			pathname: "/vendors/product",
			params: {
				productId: product.id,
				vendorId: vendor.id,
				vendorName: vendor.businessName,
				productJson: JSON.stringify(product),
			},
		});
	};

	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<ScrollView
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}>
				<View style={styles.bannerWrap}>
					{vendor.bannerUrl ? (
						<Image
							source={{ uri: vendor.bannerUrl }}
							style={styles.bannerImage}
						/>
					) : (
						<View style={styles.bannerFallback}>
							<Ionicons name="storefront-outline" size={42} color="#19543B" />
						</View>
					)}
					<View style={styles.bannerActions}>
						<TouchableOpacity
							style={styles.bannerButton}
							onPress={() => router.back()}>
							<Ionicons name="chevron-back" size={22} color="#142013" />
						</TouchableOpacity>
						{isCartForVendor ? (
							<TouchableOpacity
								style={styles.bannerButtonWide}
								onPress={() => router.push("/cart" as any)}>
								<Ionicons name="cart-outline" size={18} color="#142013" />
								<Text style={styles.bannerButtonText}>{cartItemCount}</Text>
							</TouchableOpacity>
						) : null}
					</View>

					{vendor.logoUrl ? (
						<Image source={{ uri: vendor.logoUrl }} style={styles.logo} />
					) : (
						<View style={styles.logoFallback}>
							<Ionicons name="storefront" size={26} color="#19543B" />
						</View>
					)}
				</View>

				<View style={styles.infoCard}>
					<View style={styles.infoHeader}>
						<View style={styles.infoTitleBlock}>
							<Text style={styles.businessName}>{vendor.businessName}</Text>
							{vendor.description ? (
								<Text style={styles.description}>{vendor.description}</Text>
							) : null}
						</View>
						<View
							style={[
								styles.statusPill,
								vendor.isOpen ? styles.statusOpen : styles.statusClosed,
							]}>
							<Text
								style={[
									styles.statusText,
									vendor.isOpen
										? styles.statusTextOpen
										: styles.statusTextClosed,
								]}>
								{vendor.isOpen ? "Open now" : "Closed"}
							</Text>
						</View>
					</View>

					<View style={styles.statsRow}>
						<View style={styles.statCard}>
							<Text style={styles.statValue}>{vendor.rating.toFixed(1)}</Text>
							<Text style={styles.statLabel}>
								{vendor.totalReviews} reviews
							</Text>
						</View>
						<View style={styles.statCard}>
							<Text style={styles.statValue}>
								{vendor.estimatedPrepTimeMinutes} min
							</Text>
							<Text style={styles.statLabel}>Prep time</Text>
						</View>
						<View style={styles.statCard}>
							<Text style={styles.statValue}>
								{vendor.minimumOrderAmount > 0
									? formatCurrency(vendor.minimumOrderAmount)
									: "—"}
							</Text>
							<Text style={styles.statLabel}>Min order</Text>
						</View>
					</View>

					{vendorTags.length > 0 ? (
						<View style={styles.tagRow}>
							{vendorTags.map((tag) => (
								<View key={tag} style={styles.tagChip}>
									<Text style={styles.tagText}>{tag}</Text>
								</View>
							))}
						</View>
					) : null}

					{vendor.minimumOrderAmount > 0 ? (
						<View style={styles.noticeCard}>
							<Ionicons
								name="information-circle-outline"
								size={18}
								color="#19543B"
							/>
							<Text style={styles.noticeText}>
								Minimum order is {formatCurrency(vendor.minimumOrderAmount)}{" "}
								before delivery fees.
							</Text>
						</View>
					) : null}
				</View>

				{featuredProducts.length > 0 ? (
					<View style={styles.featuredSection}>
						<View style={styles.sectionHeader}>
							<View>
								<Text style={styles.sectionTitle}>Popular right now</Text>
								<Text style={styles.sectionMeta}>
									Start with high-intent picks
								</Text>
							</View>
						</View>
						<ScrollView
							horizontal
							showsHorizontalScrollIndicator={false}
							contentContainerStyle={styles.featuredRow}>
							{featuredProducts.map(({ product, categoryName }) => (
								<TouchableOpacity
									key={product.id}
									style={styles.featuredCard}
									onPress={() => openProduct(product)}
									activeOpacity={0.84}>
									{product.imageUrl ? (
										<Image
											source={{ uri: product.imageUrl }}
											style={styles.featuredImage}
										/>
									) : (
										<View style={styles.featuredImageFallback}>
											<Ionicons name="cube-outline" size={24} color="#19543B" />
										</View>
									)}
									<Text style={styles.featuredCategory}>{categoryName}</Text>
									<Text style={styles.featuredTitle} numberOfLines={2}>
										{product.name}
									</Text>
									<Text style={styles.featuredPrice}>
										{formatCurrency(product.price)}
									</Text>
									<Text style={styles.featuredAction}>Customize</Text>
								</TouchableOpacity>
							))}
						</ScrollView>
					</View>
				) : null}

				<View style={styles.sectionHeader}>
					<View>
						<Text style={styles.sectionTitle}>Browse menu</Text>
						<Text style={styles.sectionMeta}>
							{productCategories.length} sections
						</Text>
					</View>
				</View>

				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					contentContainerStyle={styles.categoryRow}>
					{productCategories.map((category) => {
						const isActive = selectedCategoryId === category.id;
						const productCount = category.products.filter(
							(product) => product.isActive,
						).length;

						return (
							<TouchableOpacity
								key={category.id}
								style={[
									styles.categoryChip,
									isActive && styles.categoryChipActive,
								]}
								onPress={() => setActiveCategory(category.id)}
								activeOpacity={0.82}>
								<Text
									style={[
										styles.categoryChipText,
										isActive && styles.categoryChipTextActive,
									]}>
									{category.name}
								</Text>
								<View
									style={[
										styles.categoryCount,
										isActive && styles.categoryCountActive,
									]}>
									<Text
										style={[
											styles.categoryCountText,
											isActive && styles.categoryCountTextActive,
										]}>
										{productCount}
									</Text>
								</View>
							</TouchableOpacity>
						);
					})}
				</ScrollView>

				<View style={styles.productsSection}>
					<Text style={styles.productsHeading}>
						{selectedCategory?.name || "Products"}
					</Text>
					{selectedProducts.length > 0 ? (
						selectedProducts.map((product) => (
							<TouchableOpacity
								key={product.id}
								style={styles.productCard}
								onPress={() => openProduct(product)}
								activeOpacity={0.82}>
								{product.imageUrl ? (
									<Image
										source={{ uri: product.imageUrl }}
										style={styles.productImage}
									/>
								) : (
									<View style={styles.productImageFallback}>
										<Ionicons name="cube-outline" size={24} color="#19543B" />
									</View>
								)}
								<View style={styles.productContent}>
									<View style={styles.productTopRow}>
										<Text style={styles.productName}>{product.name}</Text>
										{!product.isAvailable ? (
											<View style={styles.unavailableBadge}>
												<Text style={styles.unavailableText}>Unavailable</Text>
											</View>
										) : null}
									</View>
									{product.description ? (
										<Text style={styles.productDescription} numberOfLines={2}>
											{product.description}
										</Text>
									) : null}
									<View style={styles.productBottomRow}>
										<View>
											<Text style={styles.productPrice}>
												{formatCurrency(product.price)}
											</Text>
											{product.compareAtPrice != null &&
											product.compareAtPrice > product.price ? (
												<Text style={styles.comparePrice}>
													{formatCurrency(product.compareAtPrice)}
												</Text>
											) : null}
										</View>
										<View style={styles.viewAction}>
											<Text style={styles.viewActionText}>Customize</Text>
											<Ionicons
												name="arrow-forward"
												size={16}
												color="#19543B"
											/>
										</View>
									</View>
								</View>
							</TouchableOpacity>
						))
					) : (
						<View style={styles.emptyProducts}>
							<Ionicons name="grid-outline" size={26} color="#9CA3AF" />
							<Text style={styles.emptyProductsTitle}>
								No products here yet
							</Text>
							<Text style={styles.emptyProductsCopy}>
								Switch categories or check back later.
							</Text>
						</View>
					)}
				</View>

				<View style={styles.footerSpacer} />
			</ScrollView>

			{isCartForVendor ? (
				<View style={styles.cartFooter}>
					<View>
						<Text style={styles.cartFooterLabel}>
							{cartItemCount} item{cartItemCount > 1 ? "s" : ""}
						</Text>
						<Text style={styles.cartFooterValue}>
							{formatCurrency(cartSubtotal)}
						</Text>
					</View>
					<TouchableOpacity
						style={styles.cartFooterButton}
						onPress={() => router.push("/cart" as any)}
						activeOpacity={0.85}>
						<Text style={styles.cartFooterButtonText}>View cart</Text>
					</TouchableOpacity>
				</View>
			) : null}
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#F3F5EF",
	},
	content: {
		paddingBottom: 20,
	},
	centered: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		padding: 32,
	},
	emptyTitle: {
		fontSize: 18,
		fontWeight: "800",
		color: "#142013",
	},
	linkText: {
		fontSize: 14,
		fontWeight: "800",
		color: "#19543B",
		marginTop: 12,
	},
	bannerWrap: {
		position: "relative",
	},
	bannerImage: {
		width: "100%",
		height: 220,
	},
	bannerFallback: {
		height: 220,
		backgroundColor: "#DDF3E7",
		alignItems: "center",
		justifyContent: "center",
	},
	logo: {
		position: "absolute",
		bottom: -32,
		left: 20,
		width: 72,
		height: 72,
		borderRadius: 22,
		borderWidth: 4,
		borderColor: "#FFFFFF",
		backgroundColor: "#FFFFFF",
	},
	logoFallback: {
		position: "absolute",
		bottom: -32,
		left: 20,
		width: 72,
		height: 72,
		borderRadius: 22,
		borderWidth: 4,
		borderColor: "#FFFFFF",
		backgroundColor: "#DDF3E7",
		alignItems: "center",
		justifyContent: "center",
	},
	bannerActions: {
		position: "absolute",
		top: 12,
		left: 16,
		right: 16,
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	bannerButton: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: "rgba(255,255,255,0.94)",
		alignItems: "center",
		justifyContent: "center",
	},
	bannerButtonWide: {
		minWidth: 52,
		height: 40,
		borderRadius: 20,
		backgroundColor: "rgba(255,255,255,0.94)",
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: 12,
		flexDirection: "row",
		gap: 6,
	},
	bannerButtonText: {
		fontSize: 13,
		fontWeight: "800",
		color: "#142013",
	},
	infoCard: {
		marginHorizontal: 20,
		marginTop: -26,
		backgroundColor: "#FFFFFF",
		borderRadius: 28,
		padding: 20,
		paddingTop: 56,
		borderWidth: 1,
		borderColor: "#E4E8DE",
	},
	infoHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		gap: 12,
	},
	infoTitleBlock: {
		flex: 1,
	},
	businessName: {
		fontSize: 24,
		fontWeight: "800",
		color: "#142013",
	},
	description: {
		fontSize: 14,
		lineHeight: 20,
		color: "#667268",
		marginTop: 6,
	},
	statusPill: {
		alignSelf: "flex-start",
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 999,
	},
	statusOpen: {
		backgroundColor: "#DDF3E7",
	},
	statusClosed: {
		backgroundColor: "#FDE7E6",
	},
	statusText: {
		fontSize: 12,
		fontWeight: "800",
		textTransform: "uppercase",
		letterSpacing: 0.6,
	},
	statusTextOpen: {
		color: "#19543B",
	},
	statusTextClosed: {
		color: "#C93C37",
	},
	statsRow: {
		flexDirection: "row",
		gap: 10,
		marginTop: 18,
	},
	statCard: {
		flex: 1,
		backgroundColor: "#F6F8F2",
		borderRadius: 18,
		padding: 14,
		alignItems: "center",
	},
	statValue: {
		fontSize: 16,
		fontWeight: "800",
		color: "#142013",
	},
	statLabel: {
		fontSize: 12,
		color: "#7A8579",
		marginTop: 4,
		textAlign: "center",
	},
	tagRow: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 8,
		marginTop: 14,
	},
	tagChip: {
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 999,
		backgroundColor: "#EDF2EA",
	},
	tagText: {
		fontSize: 12,
		fontWeight: "700",
		color: "#19543B",
	},
	noticeCard: {
		marginTop: 14,
		backgroundColor: "#EDF2EA",
		borderRadius: 18,
		padding: 14,
		flexDirection: "row",
		alignItems: "flex-start",
		gap: 10,
	},
	noticeText: {
		flex: 1,
		fontSize: 13,
		lineHeight: 18,
		color: "#3D5140",
	},
	featuredSection: {
		marginTop: 22,
	},
	sectionHeader: {
		marginBottom: 12,
		paddingHorizontal: 20,
	},
	sectionTitle: {
		fontSize: 21,
		fontWeight: "800",
		color: "#142013",
	},
	sectionMeta: {
		fontSize: 12,
		fontWeight: "700",
		textTransform: "uppercase",
		letterSpacing: 0.8,
		color: "#7A8579",
		marginTop: 4,
	},
	featuredRow: {
		gap: 12,
		paddingHorizontal: 20,
		paddingBottom: 4,
	},
	featuredCard: {
		width: 210,
		backgroundColor: "#FFFFFF",
		borderRadius: 24,
		padding: 14,
		borderWidth: 1,
		borderColor: "#E4E8DE",
	},
	featuredImage: {
		width: "100%",
		height: 120,
		borderRadius: 18,
		backgroundColor: "#E5E7EB",
	},
	featuredImageFallback: {
		width: "100%",
		height: 120,
		borderRadius: 18,
		backgroundColor: "#DDF3E7",
		alignItems: "center",
		justifyContent: "center",
	},
	featuredCategory: {
		fontSize: 11,
		fontWeight: "700",
		textTransform: "uppercase",
		letterSpacing: 0.8,
		color: "#7A8579",
		marginTop: 12,
	},
	featuredTitle: {
		fontSize: 16,
		fontWeight: "800",
		color: "#142013",
		marginTop: 6,
		minHeight: 42,
	},
	featuredPrice: {
		fontSize: 15,
		fontWeight: "800",
		color: "#142013",
		marginTop: 10,
	},
	featuredAction: {
		fontSize: 13,
		fontWeight: "700",
		color: "#19543B",
		marginTop: 6,
	},
	categoryRow: {
		paddingHorizontal: 20,
		gap: 8,
		paddingBottom: 6,
	},
	categoryChip: {
		paddingHorizontal: 16,
		paddingVertical: 10,
		borderRadius: 999,
		backgroundColor: "#FFFFFF",
		borderWidth: 1,
		borderColor: "#E4E8DE",
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	categoryChipActive: {
		backgroundColor: "#19543B",
		borderColor: "#19543B",
	},
	categoryChipText: {
		fontSize: 13,
		fontWeight: "700",
		color: "#374151",
	},
	categoryChipTextActive: {
		color: "#FFFFFF",
	},
	categoryCount: {
		minWidth: 24,
		paddingHorizontal: 7,
		paddingVertical: 4,
		borderRadius: 999,
		backgroundColor: "#EDF2EA",
		alignItems: "center",
	},
	categoryCountActive: {
		backgroundColor: "rgba(255,255,255,0.18)",
	},
	categoryCountText: {
		fontSize: 11,
		fontWeight: "800",
		color: "#19543B",
	},
	categoryCountTextActive: {
		color: "#FFFFFF",
	},
	productsSection: {
		paddingHorizontal: 20,
		paddingTop: 14,
	},
	productsHeading: {
		fontSize: 18,
		fontWeight: "800",
		color: "#142013",
		marginBottom: 12,
	},
	productCard: {
		backgroundColor: "#FFFFFF",
		borderRadius: 22,
		padding: 14,
		marginBottom: 12,
		borderWidth: 1,
		borderColor: "#E4E8DE",
		flexDirection: "row",
		gap: 12,
	},
	productImage: {
		width: 86,
		height: 86,
		borderRadius: 18,
		backgroundColor: "#E5E7EB",
	},
	productImageFallback: {
		width: 86,
		height: 86,
		borderRadius: 18,
		backgroundColor: "#DDF3E7",
		alignItems: "center",
		justifyContent: "center",
	},
	productContent: {
		flex: 1,
	},
	productTopRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		gap: 10,
		alignItems: "flex-start",
	},
	productName: {
		flex: 1,
		fontSize: 16,
		fontWeight: "800",
		color: "#142013",
	},
	unavailableBadge: {
		paddingHorizontal: 10,
		paddingVertical: 6,
		borderRadius: 999,
		backgroundColor: "#FDE7E6",
	},
	unavailableText: {
		fontSize: 11,
		fontWeight: "800",
		color: "#C93C37",
		textTransform: "uppercase",
		letterSpacing: 0.5,
	},
	productDescription: {
		fontSize: 13,
		lineHeight: 18,
		color: "#667268",
		marginTop: 6,
	},
	productBottomRow: {
		marginTop: 12,
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "flex-end",
		gap: 12,
	},
	productPrice: {
		fontSize: 15,
		fontWeight: "800",
		color: "#142013",
	},
	comparePrice: {
		fontSize: 12,
		color: "#9CA3AF",
		textDecorationLine: "line-through",
		marginTop: 2,
	},
	viewAction: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
	},
	viewActionText: {
		fontSize: 13,
		fontWeight: "700",
		color: "#19543B",
	},
	emptyProducts: {
		alignItems: "center",
		paddingVertical: 34,
		backgroundColor: "#FFFFFF",
		borderRadius: 22,
		borderWidth: 1,
		borderColor: "#E4E8DE",
	},
	emptyProductsTitle: {
		fontSize: 16,
		fontWeight: "800",
		color: "#142013",
		marginTop: 10,
	},
	emptyProductsCopy: {
		fontSize: 13,
		lineHeight: 18,
		color: "#667268",
		marginTop: 6,
		textAlign: "center",
		maxWidth: 220,
	},
	footerSpacer: {
		height: 96,
	},
	cartFooter: {
		position: "absolute",
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: "rgba(255,255,255,0.98)",
		borderTopWidth: 1,
		borderTopColor: "#E4E8DE",
		paddingHorizontal: 20,
		paddingTop: 14,
		paddingBottom: 24,
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	cartFooterLabel: {
		fontSize: 12,
		fontWeight: "700",
		textTransform: "uppercase",
		letterSpacing: 0.8,
		color: "#7A8579",
	},
	cartFooterValue: {
		fontSize: 22,
		fontWeight: "800",
		color: "#142013",
		marginTop: 4,
	},
	cartFooterButton: {
		backgroundColor: "#19543B",
		borderRadius: 18,
		paddingHorizontal: 20,
		paddingVertical: 14,
	},
	cartFooterButtonText: {
		fontSize: 15,
		fontWeight: "800",
		color: "#FFFFFF",
	},
});
