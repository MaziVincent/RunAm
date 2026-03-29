import { useState, useCallback } from "react";
import {
	View,
	Text,
	StyleSheet,
	FlatList,
	RefreshControl,
	ActivityIndicator,
	TouchableOpacity,
	Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { getLeaderboard } from "@runam/shared/api/rider";
import type { Leaderboard, LeaderboardEntry } from "@runam/shared/types";

type Period = "daily" | "weekly" | "monthly";

const PERIODS: { key: Period; label: string }[] = [
	{ key: "daily", label: "Today" },
	{ key: "weekly", label: "This Week" },
	{ key: "monthly", label: "This Month" },
];

const MEDAL_EMOJIS: Record<number, string> = {
	1: "🥇",
	2: "🥈",
	3: "🥉",
};

export default function LeaderboardScreen() {
	const [period, setPeriod] = useState<Period>("weekly");
	const [refreshing, setRefreshing] = useState(false);
	const router = useRouter();

	const {
		data: leaderboard,
		refetch,
		isLoading,
	} = useQuery<Leaderboard>({
		queryKey: ["rider", "leaderboard", period],
		queryFn: () => getLeaderboard(period),
	});

	const onRefresh = useCallback(async () => {
		setRefreshing(true);
		await refetch();
		setRefreshing(false);
	}, [refetch]);

	const renderEntry = ({ item }: { item: LeaderboardEntry }) => {
		const medal = MEDAL_EMOJIS[item.rank];
		const isTop3 = item.rank <= 3;

		return (
			<View
				style={[
					styles.entryRow,
					item.isCurrentUser && styles.entryRowCurrent,
					isTop3 && styles.entryRowTop,
				]}>
				{/* Rank */}
				<View style={styles.rankContainer}>
					{medal ? (
						<Text style={styles.medal}>{medal}</Text>
					) : (
						<Text style={styles.rank}>{item.rank}</Text>
					)}
				</View>

				{/* Avatar */}
				<View
					style={[styles.avatar, item.isCurrentUser && styles.avatarCurrent]}>
					{item.profilePictureUrl ? (
						<Image
							source={{ uri: item.profilePictureUrl }}
							style={styles.avatarImage}
						/>
					) : (
						<Text style={styles.avatarText}>
							{item.riderName?.[0]?.toUpperCase() ?? "?"}
						</Text>
					)}
				</View>

				{/* Info */}
				<View style={styles.entryInfo}>
					<Text
						style={[
							styles.entryName,
							item.isCurrentUser && styles.entryNameCurrent,
						]}>
						{item.riderName}
						{item.isCurrentUser ? " (You)" : ""}
					</Text>
					<View style={styles.entryMeta}>
						<Text style={styles.entryDeliveries}>
							{item.deliveries} deliveries
						</Text>
						<Text style={styles.entrySep}>•</Text>
						<Text style={styles.entryRating}>⭐ {item.rating.toFixed(1)}</Text>
					</View>
				</View>

				{/* Score */}
				<View style={styles.scoreContainer}>
					<Text style={[styles.score, isTop3 && styles.scoreTop]}>
						{item.score}
					</Text>
					<Text style={styles.scoreSuffix}>pts</Text>
				</View>
			</View>
		);
	};

	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			{/* Header */}
			<View style={styles.header}>
				<TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
					<Text style={styles.backText}>‹ Back</Text>
				</TouchableOpacity>
				<Text style={styles.title}>🏆 Leaderboard</Text>
				<View style={{ width: 60 }} />
			</View>

			{/* Period Tabs */}
			<View style={styles.tabs}>
				{PERIODS.map((p) => (
					<TouchableOpacity
						key={p.key}
						style={[styles.tab, period === p.key && styles.tabActive]}
						onPress={() => setPeriod(p.key)}>
						<Text
							style={[
								styles.tabText,
								period === p.key && styles.tabTextActive,
							]}>
							{p.label}
						</Text>
					</TouchableOpacity>
				))}
			</View>

			{/* Your Rank Banner */}
			{leaderboard?.currentUserRank && (
				<View style={styles.yourRank}>
					<Text style={styles.yourRankText}>
						Your Rank:{" "}
						<Text style={styles.yourRankValue}>
							#{leaderboard.currentUserRank}
						</Text>
					</Text>
				</View>
			)}

			{isLoading ? (
				<View style={styles.centered}>
					<ActivityIndicator size="large" color="#3B82F6" />
				</View>
			) : (
				<FlatList
					data={leaderboard?.entries || []}
					keyExtractor={(item) => item.riderId}
					renderItem={renderEntry}
					contentContainerStyle={styles.listContent}
					showsVerticalScrollIndicator={false}
					refreshControl={
						<RefreshControl
							refreshing={refreshing}
							onRefresh={onRefresh}
							tintColor="#3B82F6"
						/>
					}
					ListEmptyComponent={
						<View style={styles.emptyState}>
							<Text style={styles.emptyIcon}>🏆</Text>
							<Text style={styles.emptyTitle}>No leaderboard data yet</Text>
							<Text style={styles.emptySubtitle}>
								Complete deliveries to appear on the leaderboard
							</Text>
						</View>
					}
				/>
			)}
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: "#F9FAFB" },
	centered: { flex: 1, alignItems: "center", justifyContent: "center" },
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 20,
		paddingVertical: 12,
	},
	backBtn: { width: 60 },
	backText: { fontSize: 17, color: "#3B82F6", fontWeight: "600" },
	title: { fontSize: 20, fontWeight: "700", color: "#111827" },

	tabs: {
		flexDirection: "row",
		marginHorizontal: 20,
		backgroundColor: "#F1F5F9",
		borderRadius: 12,
		padding: 4,
		marginBottom: 12,
	},
	tab: {
		flex: 1,
		paddingVertical: 10,
		borderRadius: 10,
		alignItems: "center",
	},
	tabActive: {
		backgroundColor: "#FFFFFF",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 2,
		elevation: 2,
	},
	tabText: { fontSize: 14, fontWeight: "500", color: "#6B7280" },
	tabTextActive: { color: "#3B82F6", fontWeight: "700" },

	yourRank: {
		marginHorizontal: 20,
		backgroundColor: "#EFF6FF",
		borderRadius: 12,
		padding: 14,
		marginBottom: 12,
		alignItems: "center",
		borderWidth: 1,
		borderColor: "#DBEAFE",
	},
	yourRankText: { fontSize: 15, fontWeight: "500", color: "#374151" },
	yourRankValue: { fontSize: 18, fontWeight: "800", color: "#3B82F6" },

	listContent: { paddingHorizontal: 20, paddingBottom: 40 },

	entryRow: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#FFFFFF",
		borderRadius: 14,
		padding: 14,
		marginBottom: 8,
		borderWidth: 1,
		borderColor: "#F3F4F6",
	},
	entryRowCurrent: {
		borderColor: "#3B82F6",
		backgroundColor: "#EFF6FF",
	},
	entryRowTop: {
		borderColor: "#FDE68A",
	},

	rankContainer: { width: 36, alignItems: "center" },
	medal: { fontSize: 22 },
	rank: { fontSize: 16, fontWeight: "700", color: "#9CA3AF" },

	avatar: {
		width: 42,
		height: 42,
		borderRadius: 21,
		backgroundColor: "#E5E7EB",
		alignItems: "center",
		justifyContent: "center",
		marginRight: 12,
	},
	avatarCurrent: { backgroundColor: "#3B82F6" },
	avatarImage: { width: 42, height: 42, borderRadius: 21 },
	avatarText: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },

	entryInfo: { flex: 1 },
	entryName: { fontSize: 15, fontWeight: "600", color: "#111827" },
	entryNameCurrent: { color: "#3B82F6" },
	entryMeta: {
		flexDirection: "row",
		alignItems: "center",
		marginTop: 3,
		gap: 6,
	},
	entryDeliveries: { fontSize: 12, color: "#6B7280" },
	entrySep: { fontSize: 10, color: "#D1D5DB" },
	entryRating: { fontSize: 12, color: "#6B7280" },

	scoreContainer: { alignItems: "center" },
	score: { fontSize: 18, fontWeight: "800", color: "#111827" },
	scoreTop: { color: "#F59E0B" },
	scoreSuffix: { fontSize: 10, color: "#9CA3AF", fontWeight: "500" },

	emptyState: { alignItems: "center", paddingTop: 60 },
	emptyIcon: { fontSize: 56, marginBottom: 16 },
	emptyTitle: { fontSize: 18, fontWeight: "600", color: "#374151" },
	emptySubtitle: {
		fontSize: 14,
		color: "#9CA3AF",
		marginTop: 4,
		textAlign: "center",
	},
});
