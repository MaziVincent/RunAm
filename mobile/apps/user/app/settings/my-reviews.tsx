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
				<View style={styles.summaryLeft}>
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
				<Text style={styles.reviewDate}>
					{new Date(item.createdAt).toLocaleDateString()}
				</Text>
			</View>
			<Text style={styles.revieweeName}>To: {item.revieweeName}</Text>
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
				<ActivityIndicator size="large" color="#3B82F6" />
			</View>
		);
	}

	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<View style={styles.header}>
				<TouchableOpacity onPress={() => router.back()}>
					<Text style={styles.backBtn}>← Back</Text>
				</TouchableOpacity>
				<Text style={styles.headerTitle}>My Reviews</Text>
			</View>

			<FlatList
				data={allReviews}
				keyExtractor={(item) => item.id}
				renderItem={renderReview}
				contentContainerStyle={styles.listContent}
				showsVerticalScrollIndicator={false}
				ListHeaderComponent={renderSummary}
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={onRefresh}
						tintColor="#3B82F6"
					/>
				}
				ListEmptyComponent={
					<View style={styles.emptyState}>
						<Text style={styles.emptyIcon}>⭐</Text>
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
	container: { flex: 1, backgroundColor: "#F8FAFC" },
	centered: { flex: 1, justifyContent: "center", alignItems: "center" },
	header: { paddingHorizontal: 20, paddingVertical: 12 },
	backBtn: { fontSize: 15, color: "#3B82F6", fontWeight: "600" },
	headerTitle: {
		fontSize: 24,
		fontWeight: "800",
		color: "#1E293B",
		marginTop: 8,
	},
	listContent: { padding: 16, paddingBottom: 40 },

	// Summary card
	summaryCard: {
		flexDirection: "row",
		backgroundColor: "#FFFFFF",
		borderRadius: 16,
		padding: 20,
		marginBottom: 20,
		borderWidth: 1,
		borderColor: "#E2E8F0",
	},
	summaryLeft: {
		alignItems: "center",
		justifyContent: "center",
		marginRight: 20,
		minWidth: 80,
	},
	summaryRating: { fontSize: 36, fontWeight: "800", color: "#1E293B" },
	summaryStars: { fontSize: 14, color: "#F59E0B", marginTop: 4 },
	summaryCount: { fontSize: 12, color: "#94A3B8", marginTop: 4 },
	summaryRight: { flex: 1, justifyContent: "center" },
	barRow: { flexDirection: "row", alignItems: "center", marginVertical: 2 },
	barLabel: { fontSize: 12, color: "#64748B", width: 16, textAlign: "center" },
	barTrack: {
		flex: 1,
		height: 8,
		backgroundColor: "#F1F5F9",
		borderRadius: 4,
		marginHorizontal: 8,
		overflow: "hidden",
	},
	barFill: { height: 8, backgroundColor: "#F59E0B", borderRadius: 4 },
	barCount: { fontSize: 12, color: "#94A3B8", width: 24, textAlign: "right" },

	// Review card
	reviewCard: {
		backgroundColor: "#FFFFFF",
		borderRadius: 14,
		padding: 16,
		marginBottom: 10,
		borderWidth: 1,
		borderColor: "#F1F5F9",
	},
	reviewHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 6,
	},
	reviewStars: { fontSize: 16, color: "#F59E0B" },
	reviewDate: { fontSize: 12, color: "#94A3B8" },
	revieweeName: {
		fontSize: 13,
		fontWeight: "600",
		color: "#64748B",
		marginBottom: 4,
	},
	reviewComment: { fontSize: 14, color: "#334155", lineHeight: 20 },
	noComment: { fontSize: 13, color: "#CBD5E1", fontStyle: "italic" },

	// Empty state
	emptyState: { alignItems: "center", paddingTop: 60 },
	emptyIcon: { fontSize: 48, marginBottom: 12 },
	emptyTitle: { fontSize: 18, fontWeight: "600", color: "#374151" },
	emptySubtitle: { fontSize: 14, color: "#9CA3AF", marginTop: 4 },
});
