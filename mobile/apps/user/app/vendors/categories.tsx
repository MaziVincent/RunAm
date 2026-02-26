import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	FlatList,
	ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { getServiceCategories } from "@runam/shared/api/vendors";
import type { ServiceCategory } from "@runam/shared/types";

export default function VendorCategoriesScreen() {
	const router = useRouter();

	const { data: categories, isLoading } = useQuery<ServiceCategory[]>({
		queryKey: ["service-categories"],
		queryFn: getServiceCategories,
	});

	const vendorCategories = (categories ?? [])
		.filter((c) => c.requiresVendor && c.isActive)
		.sort((a, b) => a.sortOrder - b.sortOrder);

	const renderCategory = ({ item }: { item: ServiceCategory }) => (
		<TouchableOpacity
			style={styles.card}
			activeOpacity={0.7}
			onPress={() =>
				router.push({
					pathname: "/vendors/list",
					params: { categoryId: item.id, categoryName: item.name },
				})
			}>
			<View style={styles.iconWrap}>
				<Text style={styles.icon}>{item.iconUrl || "🏪"}</Text>
			</View>
			<View style={styles.cardContent}>
				<Text style={styles.cardTitle}>{item.name}</Text>
				{item.description ? (
					<Text style={styles.cardDesc} numberOfLines={2}>
						{item.description}
					</Text>
				) : null}
			</View>
			<Text style={styles.chevron}>›</Text>
		</TouchableOpacity>
	);

	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<View style={styles.header}>
				<TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
					<Text style={styles.backText}>‹</Text>
				</TouchableOpacity>
				<Text style={styles.headerTitle}>Services</Text>
				<View style={{ width: 40 }} />
			</View>

			{isLoading ? (
				<View style={styles.center}>
					<ActivityIndicator size="large" color="#3B82F6" />
				</View>
			) : vendorCategories.length === 0 ? (
				<View style={styles.center}>
					<Text style={styles.emptyIcon}>🏪</Text>
					<Text style={styles.emptyText}>No services available yet</Text>
				</View>
			) : (
				<FlatList
					data={vendorCategories}
					keyExtractor={(item) => item.id}
					renderItem={renderCategory}
					contentContainerStyle={styles.list}
					showsVerticalScrollIndicator={false}
				/>
			)}
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#F9FAFB",
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderBottomWidth: 1,
		borderBottomColor: "#F3F4F6",
		backgroundColor: "#FFFFFF",
	},
	backBtn: {
		width: 40,
		height: 40,
		alignItems: "center",
		justifyContent: "center",
	},
	backText: {
		fontSize: 28,
		color: "#374151",
		fontWeight: "300",
	},
	headerTitle: {
		fontSize: 18,
		fontWeight: "700",
		color: "#111827",
	},
	list: {
		padding: 16,
	},
	card: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#FFFFFF",
		borderRadius: 12,
		padding: 16,
		marginBottom: 12,
		borderWidth: 1,
		borderColor: "#F3F4F6",
	},
	iconWrap: {
		width: 52,
		height: 52,
		borderRadius: 12,
		backgroundColor: "#EEF2FF",
		alignItems: "center",
		justifyContent: "center",
		marginRight: 12,
	},
	icon: {
		fontSize: 28,
	},
	cardContent: {
		flex: 1,
	},
	cardTitle: {
		fontSize: 16,
		fontWeight: "700",
		color: "#111827",
	},
	cardDesc: {
		fontSize: 13,
		color: "#6B7280",
		marginTop: 2,
	},
	chevron: {
		fontSize: 24,
		color: "#9CA3AF",
		marginLeft: 8,
	},
	center: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	emptyIcon: {
		fontSize: 48,
		marginBottom: 12,
	},
	emptyText: {
		fontSize: 16,
		fontWeight: "600",
		color: "#6B7280",
	},
});
