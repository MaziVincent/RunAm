import { useState, useCallback, useEffect } from "react";
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	FlatList,
	TextInput,
	ActivityIndicator,
	RefreshControl,
	Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { getVendors } from "@runam/shared/api/vendors";
import type { PaginatedResult } from "@runam/shared/api/client";
import type { Vendor } from "@runam/shared/types";
import { useLocationStore } from "@runam/shared/stores/location-store";

export default function VendorListScreen() {
	const router = useRouter();
	const params = useLocalSearchParams<{
		categoryId?: string;
		categoryName?: string;
	}>();

	const [search, setSearch] = useState("");
	const [refreshing, setRefreshing] = useState(false);

	const { lat, lng, request: requestLocation } = useLocationStore();

	useEffect(() => {
		requestLocation();
	}, [requestLocation]);

	const {
		data: vendorResult,
		isLoading,
		refetch,
	} = useQuery<PaginatedResult<Vendor>>({
		queryKey: ["vendors", params.categoryId, search, lat, lng],
		queryFn: () =>
			getVendors({
				categoryId: params.categoryId,
				search: search || undefined,
				...(lat && lng ? { lat, lng, radius: 10 } : {}),
			}),
	});

	const vendors = vendorResult?.items;

	const onRefresh = useCallback(async () => {
		setRefreshing(true);
		await refetch();
		setRefreshing(false);
	}, [refetch]);

	const renderVendor = ({ item }: { item: Vendor }) => (
		<TouchableOpacity
			style={styles.vendorCard}
			activeOpacity={0.7}
			onPress={() =>
				router.push({
					pathname: "/vendors/[id]",
					params: { id: item.id },
				})
			}>
			{item.bannerUrl ? (
				<Image source={{ uri: item.bannerUrl }} style={styles.vendorBanner} />
			) : (
				<View style={styles.vendorBannerPlaceholder}>
					<Text style={{ fontSize: 36 }}>🏪</Text>
				</View>
			)}
			<View style={styles.vendorInfo}>
				<View style={styles.vendorHeader}>
					<View style={{ flex: 1 }}>
						<Text style={styles.vendorName}>{item.businessName}</Text>
						{item.description ? (
							<Text style={styles.vendorDesc} numberOfLines={1}>
								{item.description}
							</Text>
						) : null}
					</View>
					<View
						style={[
							styles.openBadge,
							{ backgroundColor: item.isOpen ? "#D1FAE5" : "#F3F4F6" },
						]}>
						<View
							style={[
								styles.openDot,
								{ backgroundColor: item.isOpen ? "#10B981" : "#9CA3AF" },
							]}
						/>
						<Text
							style={[
								styles.openText,
								{ color: item.isOpen ? "#065F46" : "#6B7280" },
							]}>
							{item.isOpen ? "Open" : "Closed"}
						</Text>
					</View>
				</View>

				<View style={styles.vendorMeta}>
					<Text style={styles.metaText}>⭐ {item.rating.toFixed(1)}</Text>
					<Text style={styles.metaDot}>·</Text>
					<Text style={styles.metaText}>
						{item.estimatedPrepTimeMinutes} min
					</Text>
					<Text style={styles.metaDot}>·</Text>
					<Text style={styles.metaText}>
						{item.deliveryFee > 0
							? `₦${item.deliveryFee.toLocaleString()} delivery`
							: "Free delivery"}
					</Text>
				</View>

				{item.serviceCategories.length > 0 && (
					<View style={styles.tagRow}>
						{item.serviceCategories.slice(0, 3).map((sc) => (
							<View key={sc.id} style={styles.tag}>
								<Text style={styles.tagText}>{sc.name}</Text>
							</View>
						))}
					</View>
				)}
			</View>
		</TouchableOpacity>
	);

	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			{/* Header */}
			<View style={styles.header}>
				<TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
					<Text style={styles.backText}>‹</Text>
				</TouchableOpacity>
				<Text style={styles.headerTitle}>
					{params.categoryName || "Vendors"}
				</Text>
				<View style={{ width: 40 }} />
			</View>

			{/* Search */}
			<View style={styles.searchWrap}>
				<TextInput
					style={styles.searchInput}
					placeholder="Search vendors…"
					placeholderTextColor="#9CA3AF"
					value={search}
					onChangeText={setSearch}
					returnKeyType="search"
				/>
			</View>

			{isLoading && !refreshing ? (
				<View style={styles.center}>
					<ActivityIndicator size="large" color="#3B82F6" />
				</View>
			) : !vendors || vendors.length === 0 ? (
				<View style={styles.center}>
					<Text style={styles.emptyIcon}>🔍</Text>
					<Text style={styles.emptyText}>No vendors found</Text>
					<Text style={styles.emptySubtext}>
						{search ? "Try a different search" : "Check back soon!"}
					</Text>
				</View>
			) : (
				<FlatList
					data={vendors}
					keyExtractor={(item) => item.id}
					renderItem={renderVendor}
					contentContainerStyle={styles.list}
					showsVerticalScrollIndicator={false}
					refreshControl={
						<RefreshControl
							refreshing={refreshing}
							onRefresh={onRefresh}
							tintColor="#3B82F6"
						/>
					}
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
		backgroundColor: "#FFFFFF",
		borderBottomWidth: 1,
		borderBottomColor: "#F3F4F6",
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
	searchWrap: {
		paddingHorizontal: 16,
		paddingVertical: 12,
		backgroundColor: "#FFFFFF",
	},
	searchInput: {
		backgroundColor: "#F3F4F6",
		borderRadius: 12,
		paddingHorizontal: 16,
		paddingVertical: 12,
		fontSize: 15,
		color: "#111827",
	},
	list: {
		padding: 16,
	},
	vendorCard: {
		backgroundColor: "#FFFFFF",
		borderRadius: 16,
		marginBottom: 16,
		overflow: "hidden",
		borderWidth: 1,
		borderColor: "#F3F4F6",
	},
	vendorBanner: {
		width: "100%",
		height: 120,
	},
	vendorBannerPlaceholder: {
		width: "100%",
		height: 120,
		backgroundColor: "#EEF2FF",
		alignItems: "center",
		justifyContent: "center",
	},
	vendorInfo: {
		padding: 14,
	},
	vendorHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "flex-start",
	},
	vendorName: {
		fontSize: 17,
		fontWeight: "700",
		color: "#111827",
	},
	vendorDesc: {
		fontSize: 13,
		color: "#6B7280",
		marginTop: 2,
	},
	openBadge: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 12,
		marginLeft: 8,
	},
	openDot: {
		width: 6,
		height: 6,
		borderRadius: 3,
		marginRight: 4,
	},
	openText: {
		fontSize: 12,
		fontWeight: "600",
	},
	vendorMeta: {
		flexDirection: "row",
		alignItems: "center",
		marginTop: 8,
	},
	metaText: {
		fontSize: 13,
		color: "#6B7280",
	},
	metaDot: {
		marginHorizontal: 6,
		color: "#D1D5DB",
	},
	tagRow: {
		flexDirection: "row",
		flexWrap: "wrap",
		marginTop: 8,
		gap: 6,
	},
	tag: {
		backgroundColor: "#EEF2FF",
		paddingHorizontal: 8,
		paddingVertical: 3,
		borderRadius: 8,
	},
	tagText: {
		fontSize: 11,
		fontWeight: "600",
		color: "#4F46E5",
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
		color: "#374151",
	},
	emptySubtext: {
		fontSize: 14,
		color: "#9CA3AF",
		marginTop: 4,
	},
});
