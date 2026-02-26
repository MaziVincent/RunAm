import { useState, useCallback } from "react";
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	RefreshControl,
	ActivityIndicator,
	TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import apiClient from "@runam/shared/api/client";
import type { RiderPerformance, RiderBonus } from "@runam/shared/types";

function MetricCard({
	label,
	value,
	suffix,
	color,
}: {
	label: string;
	value: string | number;
	suffix?: string;
	color?: string;
}) {
	return (
		<View style={styles.metricCard}>
			<Text style={[styles.metricValue, color ? { color } : undefined]}>
				{value}
				{suffix && <Text style={styles.metricSuffix}>{suffix}</Text>}
			</Text>
			<Text style={styles.metricLabel}>{label}</Text>
		</View>
	);
}

function ProgressRing({
	value,
	label,
	color,
}: {
	value: number;
	label: string;
	color: string;
}) {
	const pct = Math.min(100, Math.max(0, value));
	return (
		<View style={styles.ringContainer}>
			<View style={[styles.ringOuter, { borderColor: color + "30" }]}>
				<View style={[styles.ringInner]}>
					<Text style={[styles.ringValue, { color }]}>{pct.toFixed(0)}%</Text>
				</View>
			</View>
			<Text style={styles.ringLabel}>{label}</Text>
		</View>
	);
}

export default function PerformanceScreen() {
	const [refreshing, setRefreshing] = useState(false);
	const router = useRouter();

	const {
		data: perf,
		refetch,
		isLoading,
	} = useQuery<RiderPerformance>({
		queryKey: ["rider", "performance"],
		queryFn: () => apiClient.get("/riders/me/performance"),
	});

	const { data: bonuses } = useQuery<RiderBonus[]>({
		queryKey: ["rider", "bonuses"],
		queryFn: () => apiClient.get("/riders/me/bonuses"),
	});

	const onRefresh = useCallback(async () => {
		setRefreshing(true);
		await refetch();
		setRefreshing(false);
	}, [refetch]);

	if (isLoading) {
		return (
			<View style={styles.centered}>
				<ActivityIndicator size="large" color="#3B82F6" />
			</View>
		);
	}

	const activeBonuses = bonuses?.filter((b) => !b.isCompleted) || [];
	const completedBonuses = bonuses?.filter((b) => b.isCompleted) || [];

	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<ScrollView
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={onRefresh}
						tintColor="#3B82F6"
					/>
				}>
				{/* Header */}
				<View style={styles.header}>
					<TouchableOpacity
						onPress={() => router.back()}
						style={styles.backBtn}>
						<Text style={styles.backText}>‹ Back</Text>
					</TouchableOpacity>
					<Text style={styles.title}>Performance</Text>
					<View style={{ width: 60 }} />
				</View>

				{/* Rating + Deliveries Hero */}
				<View style={styles.heroCard}>
					<View style={styles.heroItem}>
						<Text style={styles.heroEmoji}>⭐</Text>
						<Text style={styles.heroValue}>
							{perf?.averageRating.toFixed(1) ?? "0.0"}
						</Text>
						<Text style={styles.heroLabel}>Avg Rating</Text>
					</View>
					<View style={styles.heroDivider} />
					<View style={styles.heroItem}>
						<Text style={styles.heroEmoji}>📦</Text>
						<Text style={styles.heroValue}>{perf?.totalDeliveries ?? 0}</Text>
						<Text style={styles.heroLabel}>Total Deliveries</Text>
					</View>
				</View>

				{/* Rate Rings */}
				<View style={styles.ringsRow}>
					<ProgressRing
						value={perf?.completionRate ?? 0}
						label="Completion"
						color="#10B981"
					/>
					<ProgressRing
						value={perf?.acceptanceRate ?? 0}
						label="Acceptance"
						color="#3B82F6"
					/>
					<ProgressRing
						value={perf?.onTimeRate ?? 0}
						label="On Time"
						color="#F59E0B"
					/>
				</View>

				{/* Delivery Breakdown */}
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Deliveries Breakdown</Text>
					<View style={styles.breakdownRow}>
						<MetricCard
							label="Today"
							value={perf?.todayDeliveries ?? 0}
							color="#3B82F6"
						/>
						<MetricCard
							label="This Week"
							value={perf?.weekDeliveries ?? 0}
							color="#8B5CF6"
						/>
						<MetricCard
							label="This Month"
							value={perf?.monthDeliveries ?? 0}
							color="#10B981"
						/>
					</View>
				</View>

				{/* Other Stats */}
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Details</Text>
					<View style={styles.detailCard}>
						<View style={styles.detailRow}>
							<Text style={styles.detailLabel}>⏱ Avg Delivery Time</Text>
							<Text style={styles.detailValue}>
								{perf?.averageDeliveryTimeMinutes?.toFixed(0) ?? "—"} min
							</Text>
						</View>
						<View style={styles.detailDivider} />
						<View style={styles.detailRow}>
							<Text style={styles.detailLabel}>❌ Cancelled</Text>
							<Text style={[styles.detailValue, { color: "#EF4444" }]}>
								{perf?.cancelledCount ?? 0}
							</Text>
						</View>
						<View style={styles.detailDivider} />
						<View style={styles.detailRow}>
							<Text style={styles.detailLabel}>⚠️ Disputed</Text>
							<Text style={[styles.detailValue, { color: "#F59E0B" }]}>
								{perf?.disputedCount ?? 0}
							</Text>
						</View>
					</View>
				</View>

				{/* Active Bonuses */}
				{activeBonuses.length > 0 && (
					<View style={styles.section}>
						<Text style={styles.sectionTitle}>Active Bonuses</Text>
						{activeBonuses.map((bonus) => {
							const progress = Math.min(1, bonus.current / bonus.target);
							return (
								<View key={bonus.id} style={styles.bonusCard}>
									<View style={styles.bonusHeader}>
										<Text style={styles.bonusTitle}>{bonus.title}</Text>
										<Text style={styles.bonusReward}>
											+{bonus.currency} {bonus.rewardAmount.toLocaleString()}
										</Text>
									</View>
									<Text style={styles.bonusDesc}>{bonus.description}</Text>
									<View style={styles.bonusProgressBg}>
										<View
											style={[
												styles.bonusProgressFill,
												{ width: `${progress * 100}%` },
											]}
										/>
									</View>
									<Text style={styles.bonusProgressText}>
										{bonus.current} / {bonus.target}
										{bonus.expiresAt &&
											` • Expires ${new Date(bonus.expiresAt).toLocaleDateString()}`}
									</Text>
								</View>
							);
						})}
					</View>
				)}

				{/* Completed Bonuses */}
				{completedBonuses.length > 0 && (
					<View style={styles.section}>
						<Text style={styles.sectionTitle}>
							🏆 Completed Bonuses ({completedBonuses.length})
						</Text>
						{completedBonuses.slice(0, 3).map((bonus) => (
							<View key={bonus.id} style={[styles.bonusCard, { opacity: 0.7 }]}>
								<View style={styles.bonusHeader}>
									<Text style={styles.bonusTitle}>✅ {bonus.title}</Text>
									<Text style={[styles.bonusReward, { color: "#10B981" }]}>
										+{bonus.currency} {bonus.rewardAmount.toLocaleString()}
									</Text>
								</View>
							</View>
						))}
					</View>
				)}
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: "#F9FAFB" },
	centered: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "#F9FAFB",
	},
	content: { padding: 20, paddingBottom: 40 },
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		marginBottom: 20,
	},
	backBtn: { width: 60 },
	backText: { fontSize: 17, color: "#3B82F6", fontWeight: "600" },
	title: { fontSize: 20, fontWeight: "700", color: "#111827" },

	heroCard: {
		flexDirection: "row",
		backgroundColor: "#FFFFFF",
		borderRadius: 20,
		padding: 24,
		marginBottom: 20,
		borderWidth: 1,
		borderColor: "#F3F4F6",
	},
	heroItem: { flex: 1, alignItems: "center" },
	heroEmoji: { fontSize: 28, marginBottom: 8 },
	heroValue: { fontSize: 28, fontWeight: "800", color: "#111827" },
	heroLabel: { fontSize: 13, color: "#6B7280", marginTop: 4 },
	heroDivider: { width: 1, backgroundColor: "#F3F4F6", marginHorizontal: 16 },

	ringsRow: {
		flexDirection: "row",
		justifyContent: "space-around",
		marginBottom: 24,
	},
	ringContainer: { alignItems: "center" },
	ringOuter: {
		width: 80,
		height: 80,
		borderRadius: 40,
		borderWidth: 6,
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 8,
	},
	ringInner: { alignItems: "center", justifyContent: "center" },
	ringValue: { fontSize: 18, fontWeight: "800" },
	ringLabel: { fontSize: 12, color: "#6B7280", fontWeight: "500" },

	section: { marginBottom: 24 },
	sectionTitle: {
		fontSize: 17,
		fontWeight: "700",
		color: "#111827",
		marginBottom: 12,
	},

	breakdownRow: { flexDirection: "row", gap: 10 },
	metricCard: {
		flex: 1,
		backgroundColor: "#FFFFFF",
		borderRadius: 14,
		padding: 16,
		alignItems: "center",
		borderWidth: 1,
		borderColor: "#F3F4F6",
	},
	metricValue: { fontSize: 24, fontWeight: "800", color: "#111827" },
	metricSuffix: { fontSize: 14, fontWeight: "500", color: "#9CA3AF" },
	metricLabel: {
		fontSize: 12,
		color: "#6B7280",
		fontWeight: "500",
		marginTop: 4,
	},

	detailCard: {
		backgroundColor: "#FFFFFF",
		borderRadius: 14,
		borderWidth: 1,
		borderColor: "#F3F4F6",
		overflow: "hidden",
	},
	detailRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		padding: 16,
	},
	detailLabel: { fontSize: 14, color: "#374151", fontWeight: "500" },
	detailValue: { fontSize: 16, fontWeight: "700", color: "#111827" },
	detailDivider: { height: 1, backgroundColor: "#F3F4F6" },

	bonusCard: {
		backgroundColor: "#FFFFFF",
		borderRadius: 14,
		padding: 16,
		marginBottom: 10,
		borderWidth: 1,
		borderColor: "#F3F4F6",
	},
	bonusHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 6,
	},
	bonusTitle: { fontSize: 15, fontWeight: "600", color: "#111827", flex: 1 },
	bonusReward: { fontSize: 14, fontWeight: "700", color: "#3B82F6" },
	bonusDesc: { fontSize: 13, color: "#6B7280", marginBottom: 10 },
	bonusProgressBg: {
		height: 6,
		backgroundColor: "#E5E7EB",
		borderRadius: 3,
		overflow: "hidden",
		marginBottom: 6,
	},
	bonusProgressFill: {
		height: 6,
		backgroundColor: "#3B82F6",
		borderRadius: 3,
	},
	bonusProgressText: { fontSize: 12, color: "#9CA3AF" },
});
