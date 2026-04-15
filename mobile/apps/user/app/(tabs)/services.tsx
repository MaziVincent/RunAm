import {
	ActivityIndicator,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { getServiceCategories } from "@runam/shared/api/vendors";
import { useAuthStore } from "@runam/shared/stores/auth-store";
import type { ErrandCategory, ServiceCategory } from "@runam/shared/types";

interface LogisticsOption {
	id: string;
	title: string;
	subtitle: string;
	icon: string;
	category: ErrandCategory;
	accent: string;
}

const logisticsOptions: LogisticsOption[] = [
	{
		id: "package",
		title: "Package delivery",
		subtitle: "Book pickup and drop-off now",
		icon: "📦",
		category: "PackageDelivery",
		accent: "#DFF5E8",
	},
	{
		id: "documents",
		title: "Document runs",
		subtitle: "Move files, contracts, and paperwork",
		icon: "📄",
		category: "DocumentDelivery",
		accent: "#E0F2FE",
	},
	{
		id: "pharmacy",
		title: "Pharmacy pickup",
		subtitle: "Collect prescriptions and essentials",
		icon: "💊",
		category: "Pharmacy",
		accent: "#FCE7F3",
	},
];

export default function ServicesScreen() {
	const router = useRouter();
	const { isAuthenticated } = useAuthStore();

	const { data: categories, isLoading } = useQuery<ServiceCategory[]>({
		queryKey: ["service-categories"],
		queryFn: getServiceCategories,
	});

	const vendorCategories = (categories ?? [])
		.filter((category) => category.requiresVendor && category.isActive)
		.sort((first, second) => first.sortOrder - second.sortOrder);

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
				<View style={styles.hero}>
					<Text style={styles.kicker}>Services</Text>
					<Text style={styles.title}>Move things. Order things. Get things done.</Text>
					<Text style={styles.subtitle}>
						Logistics opens the pickup and drop-off wizard immediately. Marketplace
						categories take you straight to available vendors.
					</Text>
				</View>

				{!isAuthenticated ? (
					<View style={styles.guestBanner}>
						<Text style={styles.guestBannerTitle}>Guest mode stays open</Text>
						<Text style={styles.guestBannerCopy}>
							Browse services and build your cart first. You&apos;ll only be asked to
							log in when it&apos;s time to pay.
						</Text>
					</View>
				) : null}

				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Logistics</Text>
					<View style={styles.logisticsList}>
						{logisticsOptions.map((option) => (
							<TouchableOpacity
								key={option.id}
								style={[styles.logisticsCard, { backgroundColor: option.accent }]}
								onPress={() => openLogistics(option.category)}
								activeOpacity={0.85}>
								<Text style={styles.logisticsIcon}>{option.icon}</Text>
								<View style={styles.logisticsCopy}>
									<Text style={styles.logisticsTitle}>{option.title}</Text>
									<Text style={styles.logisticsSubtitle}>{option.subtitle}</Text>
								</View>
								<Text style={styles.chevron}>›</Text>
							</TouchableOpacity>
						))}
					</View>
				</View>

				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Marketplace categories</Text>
					{isLoading ? (
						<View style={styles.loadingWrap}>
							<ActivityIndicator color="#2F8F4E" />
						</View>
					) : (
						<View style={styles.categoryGrid}>
							{vendorCategories.map((category) => (
								<TouchableOpacity
									key={category.id}
									style={styles.categoryCard}
									onPress={() => openCategory(category)}
									activeOpacity={0.85}>
									<Text style={styles.categoryIcon}>{category.iconUrl || "🏪"}</Text>
									<Text style={styles.categoryTitle}>{category.name}</Text>
									<Text style={styles.categoryDescription} numberOfLines={3}>
										{category.description || "Browse nearby vendors and order in a few taps."}
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
					<Text style={styles.catalogButtonText}>Open Full Service Catalog</Text>
				</TouchableOpacity>
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
		padding: 20,
		paddingBottom: 32,
	},
	hero: {
		backgroundColor: "#FFFFFF",
		borderRadius: 28,
		padding: 22,
		borderWidth: 1,
		borderColor: "#E7EAE1",
	},
	kicker: {
		fontSize: 12,
		fontWeight: "700",
		textTransform: "uppercase",
		letterSpacing: 2,
		color: "#2F8F4E",
		marginBottom: 8,
	},
	title: {
		fontSize: 29,
		fontWeight: "800",
		lineHeight: 34,
		letterSpacing: -0.8,
		color: "#142013",
	},
	subtitle: {
		fontSize: 15,
		lineHeight: 22,
		color: "#6B7280",
		marginTop: 10,
	},
	guestBanner: {
		marginTop: 18,
		padding: 18,
		borderRadius: 22,
		backgroundColor: "#103E2B",
	},
	guestBannerTitle: {
		fontSize: 16,
		fontWeight: "800",
		color: "#FFFFFF",
	},
	guestBannerCopy: {
		fontSize: 14,
		lineHeight: 20,
		color: "#D1FAE5",
		marginTop: 6,
	},
	section: {
		marginTop: 26,
	},
	sectionTitle: {
		fontSize: 21,
		fontWeight: "800",
		letterSpacing: -0.4,
		color: "#142013",
		marginBottom: 14,
	},
	logisticsList: {
		gap: 12,
	},
	logisticsCard: {
		borderRadius: 20,
		padding: 18,
		flexDirection: "row",
		alignItems: "center",
		gap: 14,
	},
	logisticsIcon: {
		fontSize: 28,
	},
	logisticsCopy: {
		flex: 1,
	},
	logisticsTitle: {
		fontSize: 17,
		fontWeight: "800",
		color: "#142013",
	},
	logisticsSubtitle: {
		fontSize: 13,
		lineHeight: 18,
		color: "#4B5563",
		marginTop: 4,
	},
	chevron: {
		fontSize: 26,
		fontWeight: "300",
		color: "#374151",
	},
	loadingWrap: {
		paddingVertical: 24,
		alignItems: "center",
		justifyContent: "center",
	},
	categoryGrid: {
		gap: 12,
	},
	categoryCard: {
		backgroundColor: "#FFFFFF",
		borderRadius: 20,
		padding: 18,
		borderWidth: 1,
		borderColor: "#E7EAE1",
	},
	categoryIcon: {
		fontSize: 26,
		marginBottom: 12,
	},
	categoryTitle: {
		fontSize: 17,
		fontWeight: "800",
		color: "#142013",
	},
	categoryDescription: {
		fontSize: 13,
		lineHeight: 19,
		color: "#6B7280",
		marginTop: 6,
	},
	catalogButton: {
		marginTop: 28,
		backgroundColor: "#2F8F4E",
		borderRadius: 18,
		paddingVertical: 16,
		alignItems: "center",
	},
	catalogButtonText: {
		fontSize: 15,
		fontWeight: "800",
		color: "#FFFFFF",
	},
});