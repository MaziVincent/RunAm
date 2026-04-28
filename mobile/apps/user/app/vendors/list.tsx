import { useState, useCallback, useEffect, useMemo } from "react";
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	FlatList,
	TextInput,
	ActivityIndicator,
	RefreshControl,
	ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { getVendors } from "@runam/shared/api/vendors";
import type { PaginatedResult } from "@runam/shared/api/client";
import type { Vendor } from "@runam/shared/types";
import { useLocationStore } from "@runam/shared/stores/location-store";
import BackHeader from "../components/BackHeader";
import EmptyState from "../components/EmptyState";
import HeroCard from "../components/HeroCard";
import VendorCard from "../components/VendorCard";
import { getVendorDiscoveryTags, getVendorDistanceKm } from "../lib/discovery";

type SortOption = "nearest" | "rating" | "fastest";

type VendorBrowseEntry = {
	vendor: Vendor;
	distanceKm: number | null;
	rankingLabel: string;
	tags: string[];
};

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
	{ value: "nearest", label: "Nearest" },
	{ value: "rating", label: "Top rated" },
	{ value: "fastest", label: "Fastest" },
];

export default function VendorListScreen() {
	const router = useRouter();
	const params = useLocalSearchParams<{
		categoryId?: string;
		categoryName?: string;
		search?: string;
		sort?: SortOption;
	}>();

	const initialSearch = typeof params.search === "string" ? params.search : "";
	const initialSort =
		typeof params.sort === "string" &&
		SORT_OPTIONS.some((option) => option.value === params.sort)
			? params.sort
			: "nearest";

	const [search, setSearch] = useState(initialSearch);
	const [refreshing, setRefreshing] = useState(false);
	const [sortBy, setSortBy] = useState<SortOption>(initialSort);
	const [openOnly, setOpenOnly] = useState(false);
	const [topRatedOnly, setTopRatedOnly] = useState(false);
	const [quickPrepOnly, setQuickPrepOnly] = useState(false);

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
		queryFn: async () => {
			const baseParams = {
				categoryId: params.categoryId,
				search: search || undefined,
			};

			if (lat != null && lng != null) {
				const nearbyResults = await getVendors({
					...baseParams,
					lat,
					lng,
					radius: 10,
				});

				if (nearbyResults.items.length > 0) {
					return nearbyResults;
				}
			}

			return getVendors(baseParams);
		},
	});

	const vendorEntries = useMemo<VendorBrowseEntry[]>(() => {
		const mappedEntries = (vendorResult?.items ?? []).map((vendor, index) => ({
			vendor,
			distanceKm: getVendorDistanceKm(vendor, lat, lng),
			rankingLabel:
				index === 0 ? "Best match for this lane" : "Recommended nearby",
			tags: getVendorDiscoveryTags(vendor),
		}));

		let filteredEntries = mappedEntries;

		if (openOnly) {
			filteredEntries = filteredEntries.filter((entry) => entry.vendor.isOpen);
		}

		if (topRatedOnly) {
			filteredEntries = filteredEntries.filter(
				(entry) => entry.vendor.rating >= 4.5,
			);
		}

		if (quickPrepOnly) {
			filteredEntries = filteredEntries.filter(
				(entry) => entry.vendor.estimatedPrepTimeMinutes <= 25,
			);
		}

		filteredEntries = [...filteredEntries];

		if (sortBy === "rating") {
			filteredEntries.sort(
				(first, second) => second.vendor.rating - first.vendor.rating,
			);
		} else if (sortBy === "fastest") {
			filteredEntries.sort(
				(first, second) =>
					first.vendor.estimatedPrepTimeMinutes -
					second.vendor.estimatedPrepTimeMinutes,
			);
		} else {
			filteredEntries.sort(
				(first, second) =>
					(first.distanceKm ?? Number.POSITIVE_INFINITY) -
					(second.distanceKm ?? Number.POSITIVE_INFINITY),
			);
		}

		return filteredEntries.map((entry, index) => {
			let rankingLabel = "Recommended nearby";

			if (sortBy === "nearest") {
				rankingLabel =
					index === 0
						? "Closest pick for you"
						: entry.distanceKm != null && entry.distanceKm < 3
							? "Easy to reach"
							: "Available in your area";
			} else if (sortBy === "rating") {
				rankingLabel =
					index === 0
						? "Highest rated in this lane"
						: "Strong customer ratings";
			} else if (sortBy === "fastest") {
				rankingLabel =
					index === 0 ? "Fastest prep right now" : "Quick turnaround";
			}

			return {
				...entry,
				rankingLabel,
			};
		});
	}, [lat, lng, openOnly, quickPrepOnly, sortBy, topRatedOnly, vendorResult]);

	const highlightedTags = useMemo(
		() =>
			Array.from(new Set(vendorEntries.flatMap((entry) => entry.tags))).slice(
				0,
				6,
			),
		[vendorEntries],
	);

	const summaryStats = useMemo(() => {
		const openCount = vendorEntries.filter(
			(entry) => entry.vendor.isOpen,
		).length;
		const averagePrep =
			vendorEntries.length > 0
				? Math.round(
						vendorEntries.reduce(
							(total, entry) => total + entry.vendor.estimatedPrepTimeMinutes,
							0,
						) / vendorEntries.length,
					)
				: 0;

		return {
			results: vendorEntries.length,
			openCount,
			averagePrep,
		};
	}, [vendorEntries]);

	const onRefresh = useCallback(async () => {
		setRefreshing(true);
		await refetch();
		setRefreshing(false);
	}, [refetch]);

	const renderVendor = ({ item }: { item: VendorBrowseEntry }) => (
		<VendorCard
			vendor={item.vendor}
			onPress={() =>
				router.push({
					pathname: "/vendors/[id]",
					params: { id: item.vendor.id },
				})
			}
			style={styles.vendorCard}
			distanceKm={item.distanceKm}
			rankingLabel={item.rankingLabel}
			tags={item.tags}
		/>
	);

	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<BackHeader
				title={params.categoryName || "Vendors"}
				onBack={() => router.back()}
			/>

			{isLoading && !refreshing ? (
				<View style={styles.center}>
					<ActivityIndicator size="large" color="#2F8F4E" />
				</View>
			) : vendorEntries.length === 0 ? (
				<View style={styles.emptyWrap}>
					<HeroCard
						kicker={params.categoryName ? "Category" : "Marketplace"}
						title={
							params.categoryName
								? `Browse ${params.categoryName}.`
								: "Browse live vendors near you."
						}
						subtitle="Use search and quick filters to compare merchants faster before you open a store."
						style={styles.heroCard}
					/>
					<View style={styles.searchWrap}>
						<View style={styles.searchInputWrap}>
							<Ionicons name="search-outline" size={18} color="#9CA3AF" />
							<TextInput
								style={styles.searchInput}
								placeholder="Search vendors"
								placeholderTextColor="#9CA3AF"
								value={search}
								onChangeText={setSearch}
								returnKeyType="search"
							/>
						</View>
						<ScrollView
							horizontal
							showsHorizontalScrollIndicator={false}
							contentContainerStyle={styles.filterRow}>
							{SORT_OPTIONS.map((option) => (
								<TouchableOpacity
									key={option.value}
									style={[
										styles.filterChip,
										sortBy === option.value && styles.filterChipActive,
									]}
									onPress={() => setSortBy(option.value)}
									activeOpacity={0.82}>
									<Text
										style={[
											styles.filterChipText,
											sortBy === option.value && styles.filterChipTextActive,
										]}>
										{option.label}
									</Text>
								</TouchableOpacity>
							))}
						</ScrollView>
					</View>
					<EmptyState
						icon="search-outline"
						title="No vendors found"
						description={
							search ? "Try a different search." : "Check back soon."
						}
					/>
				</View>
			) : (
				<FlatList
					data={vendorEntries}
					keyExtractor={(item) => item.vendor.id}
					renderItem={renderVendor}
					contentContainerStyle={styles.list}
					showsVerticalScrollIndicator={false}
					ListHeaderComponent={
						<View>
							<HeroCard
								kicker={params.categoryName ? "Category" : "Marketplace"}
								title={
									params.categoryName
										? `Browse ${params.categoryName}.`
										: "Browse live vendors near you."
								}
								subtitle="Use search and quick filters to compare merchants faster before you open a store."
								style={styles.heroCard}
							/>
							<View style={styles.searchWrap}>
								<View style={styles.searchInputWrap}>
									<Ionicons name="search-outline" size={18} color="#9CA3AF" />
									<TextInput
										style={styles.searchInput}
										placeholder="Search vendors"
										placeholderTextColor="#9CA3AF"
										value={search}
										onChangeText={setSearch}
										returnKeyType="search"
									/>
								</View>
								<View style={styles.summaryRow}>
									<View style={styles.summaryCard}>
										<Text style={styles.summaryValue}>
											{summaryStats.results}
										</Text>
										<Text style={styles.summaryLabel}>Results</Text>
									</View>
									<View style={styles.summaryCard}>
										<Text style={styles.summaryValue}>
											{summaryStats.openCount}
										</Text>
										<Text style={styles.summaryLabel}>Open now</Text>
									</View>
									<View style={styles.summaryCard}>
										<Text style={styles.summaryValue}>
											{summaryStats.averagePrep}
										</Text>
										<Text style={styles.summaryLabel}>Avg prep</Text>
									</View>
								</View>
								<ScrollView
									horizontal
									showsHorizontalScrollIndicator={false}
									contentContainerStyle={styles.filterRow}>
									{SORT_OPTIONS.map((option) => (
										<TouchableOpacity
											key={option.value}
											style={[
												styles.filterChip,
												sortBy === option.value && styles.filterChipActive,
											]}
											onPress={() => setSortBy(option.value)}
											activeOpacity={0.82}>
											<Text
												style={[
													styles.filterChipText,
													sortBy === option.value &&
														styles.filterChipTextActive,
												]}>
												{option.label}
											</Text>
										</TouchableOpacity>
									))}
									<TouchableOpacity
										style={[
											styles.filterChip,
											openOnly && styles.filterChipActive,
										]}
										onPress={() => setOpenOnly((value) => !value)}
										activeOpacity={0.82}>
										<Text
											style={[
												styles.filterChipText,
												openOnly && styles.filterChipTextActive,
											]}>
											Open now
										</Text>
									</TouchableOpacity>
									<TouchableOpacity
										style={[
											styles.filterChip,
											topRatedOnly && styles.filterChipActive,
										]}
										onPress={() => setTopRatedOnly((value) => !value)}
										activeOpacity={0.82}>
										<Text
											style={[
												styles.filterChipText,
												topRatedOnly && styles.filterChipTextActive,
											]}>
											4.5+
										</Text>
									</TouchableOpacity>
									<TouchableOpacity
										style={[
											styles.filterChip,
											quickPrepOnly && styles.filterChipActive,
										]}
										onPress={() => setQuickPrepOnly((value) => !value)}
										activeOpacity={0.82}>
										<Text
											style={[
												styles.filterChipText,
												quickPrepOnly && styles.filterChipTextActive,
											]}>
											Under 25 min
										</Text>
									</TouchableOpacity>
								</ScrollView>
								{highlightedTags.length > 0 ? (
									<ScrollView
										horizontal
										showsHorizontalScrollIndicator={false}
										contentContainerStyle={styles.tagRow}>
										{highlightedTags.map((tag) => (
											<View key={tag} style={styles.tagChip}>
												<Text style={styles.tagText}>{tag}</Text>
											</View>
										))}
									</ScrollView>
								) : null}
							</View>
						</View>
					}
					refreshControl={
						<RefreshControl
							refreshing={refreshing}
							onRefresh={onRefresh}
							tintColor="#2F8F4E"
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
		backgroundColor: "#F3F5EF",
	},
	heroCard: {
		marginHorizontal: 16,
		marginTop: 8,
		marginBottom: 16,
	},
	searchWrap: {
		paddingHorizontal: 16,
		paddingBottom: 12,
	},
	searchInputWrap: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		backgroundColor: "#FFFFFF",
		borderRadius: 16,
		borderWidth: 1,
		borderColor: "#E4E8DE",
		paddingHorizontal: 14,
		paddingVertical: 12,
	},
	searchInput: {
		flex: 1,
		fontSize: 15,
		color: "#111827",
	},
	filterRow: {
		gap: 8,
		paddingTop: 12,
		paddingBottom: 4,
	},
	filterChip: {
		paddingHorizontal: 14,
		paddingVertical: 10,
		borderRadius: 999,
		backgroundColor: "#FFFFFF",
		borderWidth: 1,
		borderColor: "#E4E8DE",
	},
	filterChipActive: {
		backgroundColor: "#19543B",
		borderColor: "#19543B",
	},
	filterChipText: {
		fontSize: 12,
		fontWeight: "800",
		color: "#334155",
	},
	filterChipTextActive: {
		color: "#FFFFFF",
	},
	summaryRow: {
		flexDirection: "row",
		gap: 10,
		paddingHorizontal: 16,
		paddingBottom: 12,
	},
	summaryCard: {
		flex: 1,
		backgroundColor: "#FFFFFF",
		borderRadius: 18,
		borderWidth: 1,
		borderColor: "#E4E8DE",
		padding: 14,
	},
	summaryValue: {
		fontSize: 20,
		fontWeight: "800",
		color: "#142013",
	},
	summaryLabel: {
		fontSize: 11,
		fontWeight: "700",
		textTransform: "uppercase",
		letterSpacing: 0.8,
		color: "#7A8579",
		marginTop: 4,
	},
	tagRow: {
		gap: 8,
		paddingHorizontal: 16,
		paddingBottom: 12,
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
	list: {
		padding: 16,
		paddingTop: 0,
	},
	vendorCard: {
		marginBottom: 16,
	},
	center: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	emptyWrap: {
		paddingBottom: 20,
	},
});
