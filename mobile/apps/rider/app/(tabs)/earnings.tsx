import { useState, useCallback } from "react";
import {
	View,
	Text,
	StyleSheet,
	FlatList,
	RefreshControl,
	ActivityIndicator,
	TouchableOpacity,
	Alert,
	TextInput,
	Modal,
	ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import {
	getRiderEarnings,
	getRiderWeeklyEarnings,
	getRiderBankAccounts,
} from "@runam/shared/api/rider";
import { getWallet, withdrawFromWallet } from "@runam/shared/api/wallet";
import type {
	RiderEarnings,
	EarningTransaction,
	WeeklyEarningsChart,
	DailyEarning,
	BankAccount,
	Wallet,
} from "@runam/shared/types";

export default function EarningsScreen() {
	const [refreshing, setRefreshing] = useState(false);
	const [showWithdrawModal, setShowWithdrawModal] = useState(false);
	const [withdrawAmount, setWithdrawAmount] = useState("");
	const [selectedBankId, setSelectedBankId] = useState<string | null>(null);
	const queryClient = useQueryClient();
	const router = useRouter();

	const {
		data: earnings,
		refetch,
		isLoading,
	} = useQuery<RiderEarnings>({
		queryKey: ["rider", "earnings"],
		queryFn: () => getRiderEarnings(),
	});

	const { data: wallet, refetch: refetchWallet } = useQuery<Wallet>({
		queryKey: ["rider", "wallet"],
		queryFn: () => getWallet(),
	});

	const { data: weeklyChart } = useQuery<WeeklyEarningsChart>({
		queryKey: ["rider", "earnings", "weekly-chart"],
		queryFn: () => getRiderWeeklyEarnings(),
	});

	const { data: bankAccounts } = useQuery<BankAccount[]>({
		queryKey: ["rider", "bank-accounts"],
		queryFn: () => getRiderBankAccounts(),
	});

	const withdrawMutation = useMutation({
		mutationFn: (params: {
			amount: number;
			bankCode: string;
			accountNumber: string;
			accountName: string;
		}) => withdrawFromWallet(params),
		onSuccess: () => {
			setShowWithdrawModal(false);
			setWithdrawAmount("");
			setSelectedBankId(null);
			queryClient.invalidateQueries({ queryKey: ["rider", "wallet"] });
			Alert.alert("Success", "Withdrawal request submitted");
		},
		onError: (err: Error) => {
			Alert.alert("Error", err.message);
		},
	});

	const handleWithdraw = () => {
		const amount = parseFloat(withdrawAmount);
		if (isNaN(amount) || amount <= 0) {
			Alert.alert("Error", "Enter a valid amount");
			return;
		}
		if (amount > (wallet?.balance ?? 0)) {
			Alert.alert("Error", "Insufficient balance");
			return;
		}
		if (!bankAccounts || bankAccounts.length === 0) {
			Alert.alert("Error", "Add a bank account first");
			return;
		}
		const selectedBank = bankAccounts.find((b) => b.id === selectedBankId);
		if (!selectedBank) {
			Alert.alert("Error", "Select a bank account");
			return;
		}
		withdrawMutation.mutate({
			amount,
			bankCode: selectedBank.bankCode,
			accountNumber: selectedBank.accountNumber,
			accountName: selectedBank.accountName,
		});
	};

	const onRefresh = useCallback(async () => {
		setRefreshing(true);
		await Promise.all([refetch(), refetchWallet()]);
		setRefreshing(false);
	}, [refetch, refetchWallet]);

	// ── Chart helpers ──
	const chartDays = weeklyChart?.days || [];
	const maxChartAmount = Math.max(...chartDays.map((d) => d.amount), 1);
	const todayDow = new Date().toLocaleDateString("en-US", { weekday: "short" });

	const renderTransaction = ({ item }: { item: EarningTransaction }) => (
		<View style={styles.txRow}>
			<View style={styles.txIconContainer}>
				<Text style={styles.txIcon}>✅</Text>
			</View>
			<View style={styles.txDetails}>
				<Text style={styles.txTracking}>#{item.trackingNumber}</Text>
				<Text style={styles.txDate}>
					{new Date(item.completedAt).toLocaleDateString()}
				</Text>
			</View>
			<Text style={styles.txAmount}>
				+{item.currency} {item.amount.toLocaleString()}
			</Text>
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
			<FlatList
				data={earnings?.recentTransactions || []}
				keyExtractor={(item) => item.id}
				renderItem={renderTransaction}
				contentContainerStyle={styles.listContent}
				showsVerticalScrollIndicator={false}
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={onRefresh}
						tintColor="#3B82F6"
					/>
				}
				ListHeaderComponent={
					<View>
						{/* Wallet Balance */}
						<View style={styles.walletCard}>
							<View style={styles.walletRow}>
								<View>
									<Text style={styles.walletLabel}>Wallet Balance</Text>
									<Text style={styles.walletAmount}>
										{wallet?.currency || "NGN"}{" "}
										{(wallet?.balance ?? 0).toLocaleString()}
									</Text>
								</View>
								<View style={styles.walletActions}>
									<TouchableOpacity
										style={styles.bankBtn}
										onPress={() => router.push("/bank-accounts" as never)}>
										<Text style={styles.bankBtnText}>🏦 Banks</Text>
									</TouchableOpacity>
									<TouchableOpacity
										style={styles.withdrawBtn}
										onPress={() => {
											// Pre-select default bank account
											const defaultBank = bankAccounts?.find(
												(b) => b.isDefault,
											);
											if (defaultBank) setSelectedBankId(defaultBank.id);
											setShowWithdrawModal(true);
										}}>
										<Text style={styles.withdrawBtnText}>Withdraw</Text>
									</TouchableOpacity>
								</View>
							</View>
						</View>

						{/* Today's Earnings */}
						<View style={styles.todayCard}>
							<Text style={styles.todayLabel}>Today's Earnings</Text>
							<Text style={styles.todayAmount}>
								{earnings?.currency || "NGN"}{" "}
								{(earnings?.todayEarnings ?? 0).toLocaleString()}
							</Text>
						</View>

						{/* Stats Row */}
						<View style={styles.statsRow}>
							<View style={styles.statCard}>
								<Text style={styles.statLabel}>This Week</Text>
								<Text style={styles.statValue}>
									{earnings?.currency || "NGN"}{" "}
									{(earnings?.weeklyEarnings ?? 0).toLocaleString()}
								</Text>
							</View>
							<View style={styles.statCard}>
								<Text style={styles.statLabel}>This Month</Text>
								<Text style={styles.statValue}>
									{earnings?.currency || "NGN"}{" "}
									{(earnings?.monthlyEarnings ?? 0).toLocaleString()}
								</Text>
							</View>
						</View>

						{/* Dynamic Weekly Chart */}
						<View style={styles.chartCard}>
							<View style={styles.chartHeader}>
								<Text style={styles.chartTitle}>Weekly Earnings</Text>
								{weeklyChart && (
									<Text style={styles.chartTotal}>
										{earnings?.currency || "NGN"}{" "}
										{weeklyChart.totalAmount.toLocaleString()}
									</Text>
								)}
							</View>
							<View style={styles.chartBars}>
								{chartDays.length > 0
									? chartDays.map((day) => {
											const height = Math.max(
												6,
												(day.amount / maxChartAmount) * 100,
											);
											const isToday = day.dayOfWeek === todayDow;
											return (
												<View key={day.date} style={styles.barColumn}>
													<Text style={styles.barAmount}>
														{day.amount > 0
															? `${(day.amount / 1000).toFixed(0)}k`
															: ""}
													</Text>
													<View
														style={[
															styles.bar,
															{ height },
															isToday && styles.barToday,
														]}
													/>
													<Text
														style={[
															styles.barLabel,
															isToday && styles.barLabelToday,
														]}>
														{day.dayOfWeek}
													</Text>
													{day.deliveries > 0 && (
														<Text style={styles.barDeliveries}>
															{day.deliveries}
														</Text>
													)}
												</View>
											);
										})
									: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
											(day) => (
												<View key={day} style={styles.barColumn}>
													<View style={[styles.bar, { height: 6 }]} />
													<Text style={styles.barLabel}>{day}</Text>
												</View>
											),
										)}
							</View>
							{weeklyChart && weeklyChart.totalDeliveries > 0 && (
								<Text style={styles.chartFooter}>
									{weeklyChart.totalDeliveries} deliveries this week
								</Text>
							)}
						</View>

						{/* Transactions Header */}
						<Text style={styles.sectionTitle}>Earnings History</Text>
					</View>
				}
				ListEmptyComponent={
					<View style={styles.emptyState}>
						<Text style={styles.emptyIcon}>💵</Text>
						<Text style={styles.emptyText}>No earnings yet</Text>
						<Text style={styles.emptySubtext}>
							Complete deliveries to start earning
						</Text>
					</View>
				}
			/>

			{/* Withdraw Modal with Bank Account Selection */}
			<Modal
				visible={showWithdrawModal}
				transparent
				animationType="slide"
				onRequestClose={() => setShowWithdrawModal(false)}>
				<View style={styles.modalOverlay}>
					<View style={styles.modalContent}>
						<Text style={styles.modalTitle}>Withdraw Funds</Text>
						<Text style={styles.modalBalance}>
							Available: {wallet?.currency || "NGN"}{" "}
							{(wallet?.balance ?? 0).toLocaleString()}
						</Text>

						<TextInput
							style={styles.modalInput}
							value={withdrawAmount}
							onChangeText={setWithdrawAmount}
							placeholder="Amount"
							placeholderTextColor="#94A3B8"
							keyboardType="numeric"
						/>

						{/* Bank Account Selection */}
						{bankAccounts && bankAccounts.length > 0 && (
							<View style={styles.bankSection}>
								<Text style={styles.bankSectionTitle}>Send to</Text>
								<ScrollView style={styles.bankList} nestedScrollEnabled>
									{bankAccounts.map((bank) => (
										<TouchableOpacity
											key={bank.id}
											style={[
												styles.bankOption,
												selectedBankId === bank.id && styles.bankOptionSelected,
											]}
											onPress={() => setSelectedBankId(bank.id)}>
											<View style={styles.bankRadio}>
												{selectedBankId === bank.id && (
													<View style={styles.bankRadioFill} />
												)}
											</View>
											<View style={styles.bankInfo}>
												<Text style={styles.bankName}>{bank.bankName}</Text>
												<Text style={styles.bankAcct}>
													{bank.accountName} • ****
													{bank.accountNumber.slice(-4)}
												</Text>
											</View>
											{bank.isDefault && (
												<View style={styles.defaultBadge}>
													<Text style={styles.defaultBadgeText}>Default</Text>
												</View>
											)}
										</TouchableOpacity>
									))}
								</ScrollView>
							</View>
						)}

						{bankAccounts && bankAccounts.length === 0 && (
							<TouchableOpacity
								style={styles.addBankBtn}
								onPress={() => {
									setShowWithdrawModal(false);
									router.push("/bank-accounts" as never);
								}}>
								<Text style={styles.addBankBtnText}>
									+ Add a bank account first
								</Text>
							</TouchableOpacity>
						)}

						<View style={styles.modalActions}>
							<TouchableOpacity
								style={styles.modalCancel}
								onPress={() => setShowWithdrawModal(false)}>
								<Text style={styles.modalCancelText}>Cancel</Text>
							</TouchableOpacity>
							<TouchableOpacity
								style={[
									styles.modalConfirm,
									(!withdrawAmount || withdrawMutation.isPending) && {
										opacity: 0.6,
									},
								]}
								onPress={handleWithdraw}
								disabled={withdrawMutation.isPending || !withdrawAmount}>
								<Text style={styles.modalConfirmText}>
									{withdrawMutation.isPending ? "Processing..." : "Withdraw"}
								</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#F9FAFB",
	},
	centered: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "#F9FAFB",
	},
	listContent: {
		padding: 20,
		paddingBottom: 40,
	},
	todayCard: {
		backgroundColor: "#10B981",
		borderRadius: 20,
		padding: 28,
		alignItems: "center",
		marginBottom: 16,
	},
	todayLabel: {
		fontSize: 14,
		color: "#A7F3D0",
		fontWeight: "500",
		marginBottom: 8,
	},
	todayAmount: {
		fontSize: 36,
		fontWeight: "800",
		color: "#FFFFFF",
	},
	statsRow: {
		flexDirection: "row",
		gap: 12,
		marginBottom: 20,
	},
	statCard: {
		flex: 1,
		backgroundColor: "#FFFFFF",
		borderRadius: 14,
		padding: 18,
		alignItems: "center",
		borderWidth: 1,
		borderColor: "#F3F4F6",
	},
	statLabel: {
		fontSize: 13,
		color: "#6B7280",
		fontWeight: "500",
		marginBottom: 6,
	},
	statValue: {
		fontSize: 18,
		fontWeight: "700",
		color: "#111827",
	},
	// ── Dynamic Chart ──
	chartCard: {
		backgroundColor: "#FFFFFF",
		borderRadius: 14,
		padding: 18,
		marginBottom: 24,
		borderWidth: 1,
		borderColor: "#F3F4F6",
	},
	chartHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 20,
	},
	chartTitle: {
		fontSize: 16,
		fontWeight: "700",
		color: "#111827",
	},
	chartTotal: {
		fontSize: 14,
		fontWeight: "700",
		color: "#3B82F6",
	},
	chartBars: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "flex-end",
		height: 120,
	},
	barColumn: {
		alignItems: "center",
		flex: 1,
	},
	barAmount: {
		fontSize: 9,
		color: "#9CA3AF",
		fontWeight: "600",
		marginBottom: 4,
	},
	bar: {
		width: 24,
		backgroundColor: "#DBEAFE",
		borderRadius: 6,
		marginBottom: 8,
	},
	barToday: {
		backgroundColor: "#3B82F6",
	},
	barLabel: {
		fontSize: 11,
		color: "#9CA3AF",
		fontWeight: "500",
	},
	barLabelToday: {
		color: "#3B82F6",
		fontWeight: "700",
	},
	barDeliveries: {
		fontSize: 9,
		color: "#6B7280",
		marginTop: 2,
	},
	chartFooter: {
		fontSize: 12,
		color: "#6B7280",
		textAlign: "center",
		marginTop: 12,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: "700",
		color: "#111827",
		marginBottom: 14,
	},
	txRow: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#FFFFFF",
		borderRadius: 12,
		padding: 14,
		marginBottom: 10,
		borderWidth: 1,
		borderColor: "#F3F4F6",
	},
	txIconContainer: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: "#D1FAE5",
		alignItems: "center",
		justifyContent: "center",
		marginRight: 12,
	},
	txIcon: {
		fontSize: 18,
	},
	txDetails: {
		flex: 1,
	},
	txTracking: {
		fontSize: 14,
		fontWeight: "600",
		color: "#374151",
	},
	txDate: {
		fontSize: 12,
		color: "#9CA3AF",
		marginTop: 2,
	},
	txAmount: {
		fontSize: 15,
		fontWeight: "700",
		color: "#10B981",
	},
	emptyState: {
		alignItems: "center",
		paddingTop: 40,
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
	walletCard: {
		backgroundColor: "#1E293B",
		borderRadius: 20,
		padding: 24,
		marginBottom: 16,
	},
	walletRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	walletLabel: {
		fontSize: 13,
		color: "#94A3B8",
		fontWeight: "500",
		marginBottom: 4,
	},
	walletAmount: {
		fontSize: 28,
		fontWeight: "800",
		color: "#FFFFFF",
	},
	walletActions: {
		flexDirection: "row",
		gap: 8,
	},
	bankBtn: {
		backgroundColor: "#334155",
		borderRadius: 12,
		paddingHorizontal: 14,
		paddingVertical: 12,
	},
	bankBtnText: {
		fontSize: 13,
		fontWeight: "600",
		color: "#FFFFFF",
	},
	withdrawBtn: {
		backgroundColor: "#3B82F6",
		borderRadius: 12,
		paddingHorizontal: 20,
		paddingVertical: 12,
	},
	withdrawBtnText: {
		fontSize: 14,
		fontWeight: "700",
		color: "#FFFFFF",
	},
	// ── Modal ──
	modalOverlay: {
		flex: 1,
		backgroundColor: "rgba(0,0,0,0.5)",
		justifyContent: "flex-end",
	},
	modalContent: {
		backgroundColor: "#FFFFFF",
		borderTopLeftRadius: 24,
		borderTopRightRadius: 24,
		padding: 24,
		paddingBottom: 40,
		maxHeight: "80%",
	},
	modalTitle: {
		fontSize: 20,
		fontWeight: "700",
		color: "#111827",
		marginBottom: 8,
	},
	modalBalance: {
		fontSize: 14,
		color: "#6B7280",
		marginBottom: 20,
	},
	modalInput: {
		backgroundColor: "#F1F5F9",
		borderRadius: 14,
		padding: 16,
		fontSize: 18,
		color: "#1E293B",
		marginBottom: 20,
	},
	// ── Bank selection in modal ──
	bankSection: {
		marginBottom: 20,
	},
	bankSectionTitle: {
		fontSize: 14,
		fontWeight: "600",
		color: "#374151",
		marginBottom: 10,
	},
	bankList: {
		maxHeight: 180,
	},
	bankOption: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#F9FAFB",
		borderRadius: 12,
		padding: 14,
		marginBottom: 8,
		borderWidth: 1.5,
		borderColor: "#E5E7EB",
	},
	bankOptionSelected: {
		borderColor: "#3B82F6",
		backgroundColor: "#EFF6FF",
	},
	bankRadio: {
		width: 20,
		height: 20,
		borderRadius: 10,
		borderWidth: 2,
		borderColor: "#D1D5DB",
		alignItems: "center",
		justifyContent: "center",
		marginRight: 12,
	},
	bankRadioFill: {
		width: 10,
		height: 10,
		borderRadius: 5,
		backgroundColor: "#3B82F6",
	},
	bankInfo: {
		flex: 1,
	},
	bankName: {
		fontSize: 14,
		fontWeight: "600",
		color: "#111827",
	},
	bankAcct: {
		fontSize: 12,
		color: "#6B7280",
		marginTop: 2,
	},
	defaultBadge: {
		backgroundColor: "#DBEAFE",
		paddingHorizontal: 8,
		paddingVertical: 3,
		borderRadius: 8,
	},
	defaultBadgeText: {
		fontSize: 10,
		fontWeight: "600",
		color: "#3B82F6",
	},
	addBankBtn: {
		backgroundColor: "#F1F5F9",
		borderRadius: 12,
		padding: 16,
		alignItems: "center",
		marginBottom: 20,
		borderWidth: 1,
		borderColor: "#E5E7EB",
		borderStyle: "dashed",
	},
	addBankBtnText: {
		fontSize: 14,
		fontWeight: "600",
		color: "#3B82F6",
	},
	modalActions: {
		flexDirection: "row",
		gap: 12,
	},
	modalCancel: {
		flex: 1,
		backgroundColor: "#F1F5F9",
		borderRadius: 14,
		paddingVertical: 14,
		alignItems: "center",
	},
	modalCancelText: {
		fontSize: 15,
		fontWeight: "600",
		color: "#374151",
	},
	modalConfirm: {
		flex: 1,
		backgroundColor: "#3B82F6",
		borderRadius: 14,
		paddingVertical: 14,
		alignItems: "center",
	},
	modalConfirmText: {
		fontSize: 15,
		fontWeight: "600",
		color: "#FFFFFF",
	},
});
