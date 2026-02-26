import { useState, useCallback } from "react";
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	TouchableOpacity,
	FlatList,
	RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@runam/shared/stores/auth-store";
import apiClient from "@runam/shared/api/client";
import { getServiceCategories } from "@runam/shared/api/vendors";
import type {
	Errand,
	ErrandCategory,
	ServiceCategory,
} from "@runam/shared/types";

interface CategoryItem {
	id: ErrandCategory;
	label: string;
	icon: string;
	color: string;
}

const categories: CategoryItem[] = [
	{
		id: "PackageDelivery",
		label: "Package\nDelivery",
		icon: "📦",
		color: "#EFF6FF",
	},
	{ id: "FoodDelivery", label: "Food\nDelivery", icon: "🍔", color: "#FEF3C7" },
	{
		id: "GroceryShopping",
		label: "Grocery\nShopping",
		icon: "🛒",
		color: "#D1FAE5",
	},
	{
		id: "DocumentDelivery",
		label: "Document\nDelivery",
		icon: "📄",
		color: "#EDE9FE",
	},
	{ id: "Pharmacy", label: "Pharmacy\nPickup", icon: "💊", color: "#FCE7F3" },
	{ id: "Laundry", label: "Laundry\nPickup", icon: "👔", color: "#DBEAFE" },
];

const statusColors: Record<string, string> = {
	Pending: "#F59E0B",
	Matched: "#3B82F6",
	InTransit: "#8B5CF6",
	Delivered: "#10B981",
	Completed: "#10B981",
	Cancelled: "#EF4444",
};

export default function HomeScreen() {
	const router = useRouter();
	const { user } = useAuthStore();
	const [refreshing, setRefreshing] = useState(false);

	const { data: recentErrands, refetch } = useQuery<Errand[]>({
		queryKey: ["errands", "recent"],
		queryFn: () =>
			apiClient.get("/errands?pageSize=5&sortBy=createdAt&sortDesc=true"),
	});

	const { data: serviceCategories } = useQuery<ServiceCategory[]>({
		queryKey: ["service-categories"],
		queryFn: getServiceCategories,
	});

	const onRefresh = useCallback(async () => {
		setRefreshing(true);
		await refetch();
		setRefreshing(false);
	}, [refetch]);

	const handleCategoryPress = (category: ErrandCategory) => {
		router.push({ pathname: "/errand/new", params: { category } });
	};

	const renderErrandItem = ({ item }: { item: Errand }) => (
		<TouchableOpacity
			style={styles.errandCard}
			activeOpacity={0.7}
			onPress={() =>
				router.push({ pathname: "/errand/tracking", params: { id: item.id } })
			}>
			<View style={styles.errandHeader}>
				<Text style={styles.errandTracking}>#{item.trackingNumber}</Text>
				<View
					style={[
						styles.statusBadge,
						{
							backgroundColor: (statusColors[item.status] || "#6B7280") + "20",
						},
					]}>
					<Text
						style={[
							styles.statusText,
							{ color: statusColors[item.status] || "#6B7280" },
						]}>
						{item.status}
					</Text>
				</View>
			</View>
			<Text style={styles.errandDescription} numberOfLines={1}>
				{item.description}
			</Text>
			<Text style={styles.errandDate}>
				{new Date(item.createdAt).toLocaleDateString()}
			</Text>
		</TouchableOpacity>
	);

	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<ScrollView
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={onRefresh}
						tintColor="#3B82F6"
					/>
				}>
				{/* Greeting */}
				<View style={styles.greeting}>
					<Text style={styles.greetingText}>
						Hello, {user?.firstName || "there"} 👋
					</Text>
					<Text style={styles.greetingSubtext}>
						What do you need done today?
					</Text>
				</View>

				{/* Category Grid */}
				<View style={styles.categoryGrid}>
					{categories.map((cat) => (
						<TouchableOpacity
							key={cat.id}
							style={[styles.categoryCard, { backgroundColor: cat.color }]}
							onPress={() => handleCategoryPress(cat.id)}
							activeOpacity={0.7}>
							<Text style={styles.categoryIcon}>{cat.icon}</Text>
							<Text style={styles.categoryLabel}>{cat.label}</Text>
						</TouchableOpacity>
					))}
				</View>

				{/* Marketplace Services */}
				{serviceCategories &&
					serviceCategories.filter((c) => c.requiresVendor).length > 0 && (
						<View style={styles.section}>
							<View style={styles.sectionHeader}>
								<Text style={styles.sectionTitle}>Services</Text>
								<TouchableOpacity
									onPress={() => router.push("/vendors/categories")}>
									<Text style={styles.seeAll}>See All</Text>
								</TouchableOpacity>
							</View>
							<ScrollView
								horizontal
								showsHorizontalScrollIndicator={false}
								contentContainerStyle={{ paddingRight: 20 }}>
								{serviceCategories
									.filter((c) => c.requiresVendor && c.isActive)
									.sort((a, b) => a.sortOrder - b.sortOrder)
									.map((sc) => (
										<TouchableOpacity
											key={sc.id}
											style={styles.serviceCard}
											activeOpacity={0.7}
											onPress={() =>
												router.push({
													pathname: "/vendors/list",
													params: { categoryId: sc.id, categoryName: sc.name },
												})
											}>
											{sc.iconUrl ? (
												<View style={styles.serviceIconWrap}>
													<Text style={{ fontSize: 28 }}>{sc.iconUrl}</Text>
												</View>
											) : (
												<View
													style={[
														styles.serviceIconWrap,
														{ backgroundColor: "#EEF2FF" },
													]}>
													<Text style={{ fontSize: 28 }}>🏪</Text>
												</View>
											)}
											<Text style={styles.serviceName} numberOfLines={1}>
												{sc.name}
											</Text>
										</TouchableOpacity>
									))}
							</ScrollView>
						</View>
					)}

				{/* Recent Errands */}
				<View style={styles.section}>
					<View style={styles.sectionHeader}>
						<Text style={styles.sectionTitle}>Recent Errands</Text>
						<TouchableOpacity onPress={() => router.push("/(tabs)/activity")}>
							<Text style={styles.seeAll}>See All</Text>
						</TouchableOpacity>
					</View>

					{recentErrands && recentErrands.length > 0 ? (
						recentErrands.map((errand) => (
							<View key={errand.id}>{renderErrandItem({ item: errand })}</View>
						))
					) : (
						<View style={styles.emptyState}>
							<Text style={styles.emptyIcon}>📭</Text>
							<Text style={styles.emptyText}>No errands yet</Text>
							<Text style={styles.emptySubtext}>
								Create your first errand above!
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
		backgroundColor: "#F9FAFB",
	},
	scrollContent: {
		paddingBottom: 24,
	},
	greeting: {
		paddingHorizontal: 20,
		paddingTop: 16,
		paddingBottom: 24,
	},
	greetingText: {
		fontSize: 28,
		fontWeight: "800",
		color: "#111827",
	},
	greetingSubtext: {
		fontSize: 16,
		color: "#6B7280",
		marginTop: 4,
	},
	categoryGrid: {
		flexDirection: "row",
		flexWrap: "wrap",
		paddingHorizontal: 16,
		gap: 12,
	},
	categoryCard: {
		width: "30%",
		aspectRatio: 1,
		borderRadius: 16,
		alignItems: "center",
		justifyContent: "center",
		padding: 12,
	},
	categoryIcon: {
		fontSize: 32,
		marginBottom: 8,
	},
	categoryLabel: {
		fontSize: 12,
		fontWeight: "600",
		color: "#374151",
		textAlign: "center",
		lineHeight: 16,
	},
	section: {
		marginTop: 32,
		paddingHorizontal: 20,
	},
	sectionHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 16,
	},
	sectionTitle: {
		fontSize: 20,
		fontWeight: "700",
		color: "#111827",
	},
	seeAll: {
		fontSize: 14,
		color: "#3B82F6",
		fontWeight: "600",
	},
	errandCard: {
		backgroundColor: "#FFFFFF",
		borderRadius: 12,
		padding: 16,
		marginBottom: 12,
		borderWidth: 1,
		borderColor: "#F3F4F6",
	},
	errandHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 8,
	},
	errandTracking: {
		fontSize: 14,
		fontWeight: "700",
		color: "#374151",
	},
	statusBadge: {
		paddingHorizontal: 10,
		paddingVertical: 4,
		borderRadius: 20,
	},
	statusText: {
		fontSize: 12,
		fontWeight: "600",
	},
	errandDescription: {
		fontSize: 14,
		color: "#6B7280",
		marginBottom: 4,
	},
	errandDate: {
		fontSize: 12,
		color: "#9CA3AF",
	},
	emptyState: {
		alignItems: "center",
		paddingVertical: 40,
	},
	emptyIcon: {
		fontSize: 48,
		marginBottom: 12,
	},
	emptyText: {
		fontSize: 16,
		fontWeight: "600",
		color: "#374151",
	},
	emptySubtext: {
		fontSize: 14,
		color: "#9CA3AF",
		marginTop: 4,
	},
	serviceCard: {
		alignItems: "center",
		marginRight: 16,
		width: 80,
	},
	serviceIconWrap: {
		width: 64,
		height: 64,
		borderRadius: 16,
		backgroundColor: "#F3F4F6",
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 8,
	},
	serviceName: {
		fontSize: 12,
		fontWeight: "600",
		color: "#374151",
		textAlign: "center",
	},
});
