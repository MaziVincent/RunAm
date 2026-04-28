import { useState, useCallback, useEffect } from "react";
import {
	View,
	Text,
	StyleSheet,
	FlatList,
	TouchableOpacity,
	RefreshControl,
	ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { getMyReviews, getMyReviewSummary } from "@runam/shared/api/reviews";
import type { Review, ReviewSummary } from "@runam/shared/types";
import type { PaginatedResult } from "@runam/shared/api/client";

export default function MyReviewsScreen() {
	const router = useRouter();
	const [refreshing, setRefreshing] = useState(false);
	const [page, setPage] = useState(1);
	const [allReviews, setAllReviews] = useState<Review[]>([]);

	const {
		data: reviewsData,
		refetch,
		isLoading,
	} = useQuery<PaginatedResult<Review>>({
		queryKey: ["my-reviews", page],
		queryFn: () => getMyReviews({ page, pageSize: 20 }),
	});

	const { data: summary } = useQuery<ReviewSummary>({
		queryKey: ["my-review-summary"],
		queryFn: getMyReviewSummary,
	});

	useEffect(() => {
		if (reviewsData?.items) {
			setAllReviews((prev) =>
				page === 1 ? reviewsData.items : [...prev, ...reviewsData.items],
			);
		}
	}, [reviewsData, page]);

	const totalPages = reviewsData?.totalPages ?? 1;

	const onRefresh = useCallback(async () => {
		setRefreshing(true);
		setPage(1);
		setAllReviews([]);
		await refetch();
		setRefreshing(false);
	}, [refetch]);

	const renderStars = (rating: number) => {
		return "★".repeat(rating) + "☆".repeat(5 - rating);
	};

	const renderSummary = () => {
		if (!summary) return null;
		return (
			<View style={styles.summaryCard}>
				<View style={styles.summaryHero}>
					<Text style={styles.summaryKicker}>Ratings</Text>
					<Text style={styles.summaryRating}>
						{summary.averageRating.toFixed(1)}
					</Text>
					<Text style={styles.summaryStars}>
						{renderStars(Math.round(summary.averageRating))}
					</Text>
					<Text style={styles.summaryCount}>
						{summary.totalReviews} review{summary.totalReviews !== 1 ? "s" : ""}
					</Text>
				</View>
				<View style={styles.summaryRight}>
					{[5, 4, 3, 2, 1].map((star) => {
						const count =
							star === 5
								? summary.fiveStarCount
								: star === 4
									? summary.fourStarCount
									: star === 3
										? summary.threeStarCount
										: star === 2
											? summary.twoStarCount
											: summary.oneStarCount;
						const pct =
							summary.totalReviews > 0
								? (count / summary.totalReviews) * 100
								: 0;
						return (
							<View key={star} style={styles.barRow}>
								<Text style={styles.barLabel}>{star}</Text>
								<View style={styles.barTrack}>
									<View style={[styles.barFill, { width: `${pct}%` }]} />
								</View>
								<Text style={styles.barCount}>{count}</Text>
							</View>
						);
					})}
				</View>
			</View>
		);
	};

	const renderReview = ({ item }: { item: Review }) => (
		<View style={styles.reviewCard}>
			<View style={styles.reviewHeader}>
				<Text style={styles.reviewStars}>{renderStars(item.rating)}</Text>
				<View style={styles.reviewDatePill}>
					<Text style={styles.reviewDate}>
						{new Date(item.createdAt).toLocaleDateString()}
					</Text>
				</View>
			</View>
			<Text style={styles.revieweeLabel}>Reviewed rider</Text>
			<Text style={styles.revieweeName}>{item.revieweeName}</Text>
			{item.comment ? (
				<Text style={styles.reviewComment}>{item.comment}</Text>
			) : (
				<Text style={styles.noComment}>No comment</Text>
			)}
		</View>
	);

	if (isLoading) {
		return (
			<View style={styles.centered}>
				<ActivityIndicator size="large" color="#2F8F4E" />
			</View>
		);
	}

	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<FlatList
				data={allReviews}
				keyExtractor={(item) => item.id}
				renderItem={renderReview}
				contentContainerStyle={styles.listContent}
				showsVerticalScrollIndicator={false}
				ListHeaderComponent={
					<>
						<View style={styles.heroCard}>
							<TouchableOpacity
								style={styles.backButton}
								onPress={() => router.back()}
								activeOpacity={0.82}>
								<Ionicons name="chevron-back" size={18} color="#142013" />
								<Text style={styles.backBtn}>Back</Text>
							</TouchableOpacity>
							<Text style={styles.kicker}>Reviews</Text>
							<Text style={styles.headerTitle}>
								Everything you’ve rated stays here.
							</Text>
							<Text style={styles.headerSubtitle}>
								Track the ratings and comments you’ve left for riders after
								completed orders.
							</Text>
						</View>
						{renderSummary()}
						<Text style={styles.sectionTitle}>Recent reviews</Text>
					</>
				}
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={onRefresh}
						tintColor="#2F8F4E"
					/>
				}
				ListEmptyComponent={
					<View style={styles.emptyState}>
						<View style={styles.emptyIconWrap}>
							<Ionicons name="star-outline" size={28} color="#19543B" />
						</View>
						<Text style={styles.emptyTitle}>No reviews yet</Text>
						<Text style={styles.emptySubtitle}>
							Reviews you leave for riders will appear here
						</Text>
					</View>
				}
				onEndReached={() => {
					if (page < totalPages) setPage((p) => p + 1);
				}}
				onEndReachedThreshold={0.5}
			/>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: "#F3F5EF" },
	centered: { flex: 1, justifyContent: "center", alignItems: "center" },
	heroCard: {
		margin: 20,
		marginBottom: 16,
		backgroundColor: "#103E2B",
		borderRadius: 30,
		padding: 22,
	},
	backButton: {
		alignSelf: "flex-start",
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
		marginBottom: 18,
	},
	backBtn: { fontSize: 14, color: "#DDF3E7", fontWeight: "800" },
	kicker: {
		fontSize: 12,
		fontWeight: "700",
		letterSpacing: 1.5,
		textTransform: "uppercase",
		color: "#A6E4C3",
	},
	headerTitle: {
		fontSize: 28,
		fontWeight: "800",
		lineHeight: 33,
		letterSpacing: -0.8,
		color: "#FFFFFF",
		marginTop: 8,
	},
	headerSubtitle: {
		fontSize: 14,
		lineHeight: 21,
		color: "#D6EFE1",
		marginTop: 10,
	},
	listContent: { paddingBottom: 40 },
	sectionTitle: {
		fontSize: 16,
		fontWeight: "800",
		color: "#142013",
		paddingHorizontal: 20,
		paddingBottom: 12,
	},

	summaryCard: {
		marginHorizontal: 20,
		backgroundColor: "#FFFFFF",
		borderRadius: 24,
		padding: 20,
		marginBottom: 20,
		borderWidth: 1,
		borderColor: "#E4E8DE",
	},
	summaryHero: {
		alignItems: "center",
		paddingBottom: 18,
		borderBottomWidth: 1,
		borderBottomColor: "#EEF1EA",
	},
	summaryKicker: {
		fontSize: 11,
		fontWeight: "700",
		letterSpacing: 1.2,
		textTransform: "uppercase",
		color: "#7A8579",
	},
	summaryRating: {
		fontSize: 42,
		fontWeight: "800",
		color: "#142013",
		marginTop: 8,
	},
	summaryStars: { fontSize: 16, color: "#D97706", marginTop: 4 },
	summaryCount: { fontSize: 12, color: "#7A8579", marginTop: 6 },
	summaryRight: { justifyContent: "center", marginTop: 18 },
	barRow: { flexDirection: "row", alignItems: "center", marginVertical: 2 },
	barLabel: { fontSize: 12, color: "#667268", width: 16, textAlign: "center" },
	barTrack: {
		flex: 1,
		height: 8,
		backgroundColor: "#EEF1EA",
		borderRadius: 4,
		marginHorizontal: 8,
		overflow: "hidden",
	},
	barFill: { height: 8, backgroundColor: "#D97706", borderRadius: 4 },
	barCount: { fontSize: 12, color: "#7A8579", width: 24, textAlign: "right" },

	reviewCard: {
		backgroundColor: "#FFFFFF",
		borderRadius: 20,
		padding: 18,
		marginBottom: 10,
		borderWidth: 1,
		borderColor: "#E4E8DE",
		marginHorizontal: 20,
	},
	reviewHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 6,
	},
	reviewStars: { fontSize: 16, color: "#D97706" },
	reviewDatePill: {
		backgroundColor: "#EEF1EA",
		borderRadius: 999,
		paddingHorizontal: 10,
		paddingVertical: 6,
	},
	reviewDate: { fontSize: 11, color: "#667268", fontWeight: "700" },
	revieweeLabel: {
		fontSize: 11,
		fontWeight: "700",
		letterSpacing: 1,
		textTransform: "uppercase",
		color: "#7A8579",
	},
	revieweeName: {
		fontSize: 16,
		fontWeight: "800",
		color: "#142013",
		marginTop: 6,
		marginBottom: 8,
	},
	reviewComment: { fontSize: 14, color: "#334155", lineHeight: 20 },
	noComment: { fontSize: 13, color: "#A3ADA1", fontStyle: "italic" },

	emptyState: {
		alignItems: "center",
		paddingTop: 36,
		paddingHorizontal: 24,
		paddingBottom: 20,
		backgroundColor: "#FFFFFF",
		borderRadius: 22,
		borderWidth: 1,
		borderColor: "#E4E8DE",
		marginHorizontal: 20,
	},
	emptyIconWrap: {
		width: 60,
		height: 60,
		borderRadius: 20,
		backgroundColor: "#ECF5EF",
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 12,
	},
	emptyTitle: { fontSize: 18, fontWeight: "800", color: "#142013" },
	emptySubtitle: {
		fontSize: 14,
		color: "#7A8579",
		marginTop: 4,
		textAlign: "center",
		lineHeight: 20,
	},
});
