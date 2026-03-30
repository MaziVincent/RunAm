import { useState, useCallback } from "react";
import {
	View,
	Text,
	StyleSheet,
	FlatList,
	TouchableOpacity,
	RefreshControl,
	ActivityIndicator,
	Alert,
	Modal,
	TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
	getWallet,
	getWalletTransactions,
	topUpWallet,
} from "@runam/shared/api/wallet";
import type {
	Wallet,
	WalletTransaction,
	TopUpResponse,
} from "@runam/shared/types";

const QUICK_AMOUNTS = [1000, 2000, 5000, 10000, 20000];

export default function WalletScreen() {
	const router = useRouter();
	const queryClient = useQueryClient();
	const [refreshing, setRefreshing] = useState(false);
	const [showTopUp, setShowTopUp] = useState(false);
	const [topUpAmount, setTopUpAmount] = useState("");
	const [topUpMethod, setTopUpMethod] = useState<"Card" | "BankTransfer">(
		"Card",
	);

	const { data: wallet, refetch: refetchWallet } = useQuery<Wallet>({
		queryKey: ["wallet"],
		queryFn: getWallet,
	});

	const { data: transactionsData, refetch: refetchTransactions } = useQuery({
		queryKey: ["wallet", "transactions"],
		queryFn: () => getWalletTransactions({ pageSize: 50 }),
	});

	const transactions = transactionsData?.items;

	const topUpMutation = useMutation({
		mutationFn: (amount: number) =>
			topUpWallet({
				amount,
				paymentMethod: topUpMethod,
			}),
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: ["wallet"] });
			setShowTopUp(false);
			setTopUpAmount("");
			if ((data as any).authorizationUrl) {
				Alert.alert("Redirecting", "Complete payment in your browser.", [
					{ text: "OK" },
				]);
			} else {
				Alert.alert("Success", `Wallet topped up successfully!`);
			}
		},
		onError: (err: any) => {
			Alert.alert("Error", err?.message || "Top-up failed. Please try again.");
		},
	});

	const onRefresh = useCallback(async () => {
		setRefreshing(true);
		await Promise.all([refetchWallet(), refetchTransactions()]);
		setRefreshing(false);
	}, [refetchWallet, refetchTransactions]);

	const handleTopUp = () => {
		const amount = parseFloat(topUpAmount);
		if (!amount || amount < 100) {
			Alert.alert("Invalid Amount", "Minimum top-up is 100.");
			return;
		}
		topUpMutation.mutate(amount);
	};

	const transactionIcons: Record<string, string> = {
		TopUp: "💰",
		Payment: "💸",
		Refund: "↩️",
		Withdrawal: "🏦",
	};

	const transactionColors: Record<string, string> = {
		TopUp: "#10B981",
		Payment: "#EF4444",
		Refund: "#2F8F4E",
		Withdrawal: "#F59E0B",
	};

	const renderTransaction = ({ item }: { item: WalletTransaction }) => {
		const isCredit = item.type === "TopUp" || item.type === "Refund";
		return (
			<View style={styles.txRow}>
				<View
					style={[
						styles.txIconContainer,
						{
							backgroundColor:
								(transactionColors[item.type] || "#6B7280") + "15",
						},
					]}>
					<Text style={styles.txIcon}>
						{transactionIcons[item.type] || "💳"}
					</Text>
				</View>
				<View style={styles.txDetails}>
					<Text style={styles.txDescription}>{item.description}</Text>
					<Text style={styles.txDate}>
						{new Date(item.createdAt).toLocaleDateString()}
					</Text>
				</View>
				<Text
					style={[
						styles.txAmount,
						{ color: isCredit ? "#10B981" : "#EF4444" },
					]}>
					{isCredit ? "+" : "-"}
					{item.currency} {Math.abs(item.amount).toLocaleString()}
				</Text>
			</View>
		);
	};

	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<FlatList
				data={transactions || []}
				keyExtractor={(item) => item.id}
				renderItem={renderTransaction}
				contentContainerStyle={styles.listContent}
				showsVerticalScrollIndicator={false}
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={onRefresh}
						tintColor="#2F8F4E"
					/>
				}
				ListHeaderComponent={
					<View>
						{/* Balance Card */}
						<View style={styles.balanceCard}>
							<Text style={styles.balanceLabel}>Available Balance</Text>
							<Text style={styles.balanceAmount}>
								{wallet?.currency || "NGN"}{" "}
								{(wallet?.balance ?? 0).toLocaleString()}
							</Text>
							<View style={styles.balanceActions}>
								<TouchableOpacity
									style={styles.topUpButton}
									onPress={() => setShowTopUp(true)}
									activeOpacity={0.8}>
									<Text style={styles.topUpText}>💰 Top Up</Text>
								</TouchableOpacity>
								<TouchableOpacity
									style={styles.methodsButton}
									onPress={() =>
										router.push("/settings/payment-methods" as never)
									}
									activeOpacity={0.8}>
									<Text style={styles.methodsText}>💳 Cards</Text>
								</TouchableOpacity>
							</View>
						</View>

						{/* Transactions Header */}
						<Text style={styles.sectionTitle}>Transaction History</Text>
					</View>
				}
				ListEmptyComponent={
					<View style={styles.emptyState}>
						<Text style={styles.emptyIcon}>💳</Text>
						<Text style={styles.emptyText}>No transactions yet</Text>
					</View>
				}
			/>

			{/* Top Up Modal */}
			<Modal visible={showTopUp} animationType="slide" transparent>
				<View style={styles.modalOverlay}>
					<View style={styles.modalContent}>
						<View style={styles.modalHandle} />
						<Text style={styles.modalTitle}>Top Up Wallet</Text>

						{/* Quick amounts */}
						<View style={styles.quickAmountRow}>
							{QUICK_AMOUNTS.map((amt) => (
								<TouchableOpacity
									key={amt}
									style={[
										styles.quickAmountBtn,
										topUpAmount === String(amt) && styles.quickAmountBtnActive,
									]}
									onPress={() => setTopUpAmount(String(amt))}>
									<Text
										style={[
											styles.quickAmountText,
											topUpAmount === String(amt) &&
												styles.quickAmountTextActive,
										]}>
										{amt >= 1000 ? `${amt / 1000}K` : amt}
									</Text>
								</TouchableOpacity>
							))}
						</View>

						{/* Custom amount */}
						<Text style={styles.inputLabel}>
							Amount ({wallet?.currency || "NGN"})
						</Text>
						<TextInput
							style={styles.amountInput}
							value={topUpAmount}
							onChangeText={setTopUpAmount}
							placeholder="Enter amount"
							placeholderTextColor="#9CA3AF"
							keyboardType="number-pad"
						/>

						{/* Payment method */}
						<Text style={styles.inputLabel}>Payment Method</Text>
						<View style={styles.methodRow}>
							{(["Card", "BankTransfer"] as const).map((m) => (
								<TouchableOpacity
									key={m}
									style={[
										styles.methodChip,
										topUpMethod === m && styles.methodChipActive,
									]}
									onPress={() => setTopUpMethod(m)}>
									<Text
										style={[
											styles.methodChipText,
											topUpMethod === m && styles.methodChipTextActive,
										]}>
										{m === "Card" ? "💳 Card" : "🏦 Bank Transfer"}
									</Text>
								</TouchableOpacity>
							))}
						</View>

						{/* Actions */}
						<TouchableOpacity
							style={[
								styles.confirmBtn,
								topUpMutation.isPending && { opacity: 0.6 },
							]}
							onPress={handleTopUp}
							disabled={topUpMutation.isPending}>
							{topUpMutation.isPending ? (
								<ActivityIndicator color="#FFF" />
							) : (
								<Text style={styles.confirmBtnText}>
									Top Up {wallet?.currency || "NGN"}{" "}
									{parseFloat(topUpAmount || "0").toLocaleString()}
								</Text>
							)}
						</TouchableOpacity>
						<TouchableOpacity
							style={styles.cancelBtn}
							onPress={() => setShowTopUp(false)}>
							<Text style={styles.cancelBtnText}>Cancel</Text>
						</TouchableOpacity>
					</View>
				</View>
			</Modal>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: "#F9FAFB" },
	listContent: { padding: 20, paddingBottom: 40 },
	balanceCard: {
		backgroundColor: "#2F8F4E",
		borderRadius: 20,
		padding: 28,
		alignItems: "center",
		marginBottom: 28,
	},
	balanceLabel: {
		fontSize: 14,
		color: "#BFDBFE",
		fontWeight: "500",
		marginBottom: 8,
	},
	balanceAmount: {
		fontSize: 36,
		fontWeight: "800",
		color: "#FFFFFF",
		marginBottom: 20,
	},
	balanceActions: { flexDirection: "row", gap: 12 },
	topUpButton: {
		backgroundColor: "#FFFFFF",
		borderRadius: 12,
		paddingHorizontal: 24,
		paddingVertical: 12,
	},
	topUpText: { fontSize: 15, fontWeight: "700", color: "#2F8F4E" },
	methodsButton: {
		backgroundColor: "rgba(255,255,255,0.2)",
		borderRadius: 12,
		paddingHorizontal: 24,
		paddingVertical: 12,
	},
	methodsText: { fontSize: 15, fontWeight: "700", color: "#FFFFFF" },
	sectionTitle: {
		fontSize: 18,
		fontWeight: "700",
		color: "#111827",
		marginBottom: 16,
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
		width: 44,
		height: 44,
		borderRadius: 22,
		alignItems: "center",
		justifyContent: "center",
		marginRight: 12,
	},
	txIcon: { fontSize: 20 },
	txDetails: { flex: 1 },
	txDescription: { fontSize: 14, fontWeight: "600", color: "#374151" },
	txDate: { fontSize: 12, color: "#9CA3AF", marginTop: 2 },
	txAmount: { fontSize: 15, fontWeight: "700" },
	emptyState: { alignItems: "center", paddingTop: 40 },
	emptyIcon: { fontSize: 48, marginBottom: 12 },
	emptyText: { fontSize: 16, fontWeight: "600", color: "#9CA3AF" },
	// Modal styles
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
	},
	modalHandle: {
		width: 40,
		height: 4,
		backgroundColor: "#D1D5DB",
		borderRadius: 2,
		alignSelf: "center",
		marginBottom: 16,
	},
	modalTitle: {
		fontSize: 22,
		fontWeight: "800",
		color: "#111827",
		marginBottom: 20,
		textAlign: "center",
	},
	quickAmountRow: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 10,
		marginBottom: 20,
	},
	quickAmountBtn: {
		backgroundColor: "#F3F4F6",
		borderRadius: 10,
		paddingHorizontal: 18,
		paddingVertical: 10,
		borderWidth: 2,
		borderColor: "transparent",
	},
	quickAmountBtnActive: { borderColor: "#2F8F4E", backgroundColor: "#F0FDF4" },
	quickAmountText: { fontSize: 14, fontWeight: "600", color: "#374151" },
	quickAmountTextActive: { color: "#2F8F4E" },
	inputLabel: {
		fontSize: 14,
		fontWeight: "600",
		color: "#374151",
		marginBottom: 8,
	},
	amountInput: {
		backgroundColor: "#F9FAFB",
		borderWidth: 1,
		borderColor: "#E5E7EB",
		borderRadius: 12,
		paddingHorizontal: 16,
		paddingVertical: 14,
		fontSize: 18,
		fontWeight: "700",
		color: "#111827",
		marginBottom: 20,
	},
	methodRow: { flexDirection: "row", gap: 10, marginBottom: 24 },
	methodChip: {
		flex: 1,
		backgroundColor: "#F3F4F6",
		borderRadius: 12,
		paddingVertical: 14,
		alignItems: "center",
		borderWidth: 2,
		borderColor: "transparent",
	},
	methodChipActive: { borderColor: "#2F8F4E", backgroundColor: "#F0FDF4" },
	methodChipText: { fontSize: 14, fontWeight: "600", color: "#374151" },
	methodChipTextActive: { color: "#2F8F4E" },
	confirmBtn: {
		backgroundColor: "#2F8F4E",
		borderRadius: 14,
		paddingVertical: 16,
		alignItems: "center",
		marginBottom: 10,
	},
	confirmBtnText: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },
	cancelBtn: {
		backgroundColor: "#F3F4F6",
		borderRadius: 14,
		paddingVertical: 16,
		alignItems: "center",
	},
	cancelBtnText: { fontSize: 16, fontWeight: "600", color: "#374151" },
});
