import {
	View,
	Text,
	StyleSheet,
	FlatList,
	ActivityIndicator,
	ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import apiClient from "@runam/shared/api/client";
import type { Review, ReviewSummary } from "@runam/shared/types";
import { TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

export default function RiderRatingsScreen() {
	const router = useRouter();

	const { data: summary, isLoading: loadingSummary } = useQuery<ReviewSummary>({
		queryKey: ["myRatingSummary"],
		queryFn: () => apiClient.get("/reviews/me/summary"),
	});

	const { data: reviews = [], isLoading: loadingReviews } = useQuery<Review[]>({
		queryKey: ["myReviews"],
		queryFn: () => apiClient.get("/reviews/me?pageSize=50"),
	});

	const avgRating = summary?.averageRating ?? 0;
	const totalReviews = summary?.totalReviews ?? 0;

	const starBreakdown: Record<number, number> = {
		5: summary?.fiveStarCount ?? 0,
		4: summary?.fourStarCount ?? 0,
		3: summary?.threeStarCount ?? 0,
		2: summary?.twoStarCount ?? 0,
		1: summary?.oneStarCount ?? 0,
	};

	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<ScrollView contentContainerStyle={styles.content}>
				{/* Header */}
				<View style={styles.header}>
					<TouchableOpacity onPress={() => router.back()}>
						<Text style={styles.backBtn}>← Back</Text>
					</TouchableOpacity>
					<Text style={styles.title}>My Ratings</Text>
				</View>

				{/* Summary Card */}
				{loadingSummary ? (
					<ActivityIndicator
						size="large"
						color="#10B981"
						style={styles.loader}
					/>
				) : (
					<View style={styles.summaryCard}>
						<View style={styles.avgSection}>
							<Text style={styles.avgNumber}>{avgRating.toFixed(1)}</Text>
							<View style={styles.starsRow}>
								{[1, 2, 3, 4, 5].map((s) => (
									<Text
										key={s}
										style={[
											styles.starIcon,
											s <= Math.round(avgRating) && styles.starActive,
										]}>
										★
									</Text>
								))}
							</View>
							<Text style={styles.totalLabel}>
								{totalReviews} {totalReviews === 1 ? "review" : "reviews"}
							</Text>
						</View>

						{/* Star Breakdown */}
						<View style={styles.breakdown}>
							{[5, 4, 3, 2, 1].map((star) => {
								const count = starBreakdown[star] ?? 0;
								const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
								return (
									<View key={star} style={styles.barRow}>
										<Text style={styles.barLabel}>{star}★</Text>
										<View style={styles.barTrack}>
											<View style={[styles.barFill, { width: `${pct}%` }]} />
										</View>
										<Text style={styles.barCount}>{count}</Text>
									</View>
								);
							})}
						</View>
					</View>
				)}

				{/* Reviews List */}
				<Text style={styles.sectionTitle}>Recent Reviews</Text>
				{loadingReviews ? (
					<ActivityIndicator
						size="small"
						color="#10B981"
						style={styles.loader}
					/>
				) : reviews.length === 0 ? (
					<View style={styles.emptyContainer}>
						<Text style={styles.emptyIcon}>⭐</Text>
						<Text style={styles.emptyText}>
							No reviews yet. Complete deliveries to receive ratings!
						</Text>
					</View>
				) : (
					reviews.map((item) => (
						<View key={item.id} style={styles.reviewCard}>
							<View style={styles.reviewHeader}>
								<View style={styles.reviewStars}>
									{[1, 2, 3, 4, 5].map((s) => (
										<Text
											key={s}
											style={[
												styles.miniStar,
												s <= item.rating && styles.miniStarActive,
											]}>
											★
										</Text>
									))}
								</View>
								<Text style={styles.reviewDate}>
									{new Date(item.createdAt).toLocaleDateString()}
								</Text>
							</View>
							{item.comment ? (
								<Text style={styles.reviewComment}>{item.comment}</Text>
							) : (
								<Text style={styles.reviewNoComment}>No comment</Text>
							)}
							<Text style={styles.reviewerName}>— {item.reviewerName}</Text>
						</View>
					))
				)}
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: "#F8FAFC" },
	content: { padding: 20, paddingBottom: 40 },
	header: { marginBottom: 20 },
	backBtn: { fontSize: 15, color: "#10B981", fontWeight: "600" },
	title: {
		fontSize: 24,
		fontWeight: "800",
		color: "#1E293B",
		marginTop: 12,
	},
	loader: { marginVertical: 24 },
	summaryCard: {
		backgroundColor: "#FFFFFF",
		borderRadius: 16,
		padding: 20,
		borderWidth: 1,
		borderColor: "#E2E8F0",
		marginBottom: 24,
	},
	avgSection: { alignItems: "center", marginBottom: 20 },
	avgNumber: { fontSize: 48, fontWeight: "900", color: "#1E293B" },
	starsRow: { flexDirection: "row", marginTop: 4, gap: 4 },
	starIcon: { fontSize: 22, color: "#CBD5E1" },
	starActive: { color: "#FBBF24" },
	totalLabel: { fontSize: 13, color: "#64748B", marginTop: 4 },
	breakdown: { gap: 6 },
	barRow: { flexDirection: "row", alignItems: "center" },
	barLabel: {
		width: 30,
		fontSize: 13,
		color: "#64748B",
		fontWeight: "600",
	},
	barTrack: {
		flex: 1,
		height: 8,
		backgroundColor: "#F1F5F9",
		borderRadius: 4,
		marginHorizontal: 8,
		overflow: "hidden",
	},
	barFill: { height: 8, backgroundColor: "#FBBF24", borderRadius: 4 },
	barCount: { width: 28, fontSize: 12, color: "#94A3B8", textAlign: "right" },
	sectionTitle: {
		fontSize: 16,
		fontWeight: "700",
		color: "#1E293B",
		marginBottom: 12,
	},
	reviewCard: {
		backgroundColor: "#FFFFFF",
		borderRadius: 14,
		padding: 16,
		marginBottom: 10,
		borderWidth: 1,
		borderColor: "#E2E8F0",
	},
	reviewHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	reviewStars: { flexDirection: "row", gap: 2 },
	miniStar: { fontSize: 16, color: "#CBD5E1" },
	miniStarActive: { color: "#FBBF24" },
	reviewDate: { fontSize: 11, color: "#94A3B8" },
	reviewComment: {
		fontSize: 14,
		color: "#334155",
		marginTop: 8,
		lineHeight: 20,
	},
	reviewNoComment: {
		fontSize: 13,
		color: "#CBD5E1",
		marginTop: 8,
		fontStyle: "italic",
	},
	reviewerName: {
		fontSize: 12,
		color: "#64748B",
		marginTop: 8,
		fontWeight: "500",
	},
	emptyContainer: { alignItems: "center", paddingVertical: 32 },
	emptyIcon: { fontSize: 48 },
	emptyText: {
		fontSize: 14,
		color: "#64748B",
		marginTop: 8,
		textAlign: "center",
	},
});
