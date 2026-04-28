import { useCallback, useState } from "react";
import {
	ActivityIndicator,
	RefreshControl,
	ScrollView,
	Share,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@runam/shared/stores/auth-store";
import {
	getWallet,
	getWalletTransactions,
	createWallet,
} from "@runam/shared/api/wallet";
import type { Wallet, WalletTransaction } from "@runam/shared/types";
import AuthRequiredState from "../components/AuthRequiredState";
import EmptyState from "../components/EmptyState";
import HeroCard from "../components/HeroCard";
import SectionCard from "../components/SectionCard";

export default function WalletScreen() {
	const { isAuthenticated } = useAuthStore();
	const queryClient = useQueryClient();
	const [refreshing, setRefreshing] = useState(false);
	const [nin, setNin] = useState("");

	const { data: wallet, refetch: refetchWallet } = useQuery<Wallet | null>({
		queryKey: ["wallet"],
		queryFn: getWallet,
		enabled: isAuthenticated,
	});

	const { data: transactionsData, refetch: refetchTransactions } = useQuery({
		queryKey: ["wallet", "transactions"],
		queryFn: () => getWalletTransactions({ pageSize: 50 }),
		enabled: isAuthenticated,
	});

	const transactions = transactionsData?.items ?? [];

	const createWalletMutation = useMutation({
		mutationFn: (normalizedNin: string) => createWallet({ nin: normalizedNin }),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ["wallet"] });
			setNin("");
		},
	});

	const onRefresh = useCallback(async () => {
		setRefreshing(true);
		await Promise.all([refetchWallet(), refetchTransactions()]);
		setRefreshing(false);
	}, [refetchTransactions, refetchWallet]);

	const handleCreateWallet = () => {
		const normalizedNin = nin.replace(/\D/g, "");
		if (normalizedNin.length !== 11) {
			return;
		}

		createWalletMutation.mutate(normalizedNin);
	};

	const transactionIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
		TopUp: "arrow-down-circle-outline",
		Payment: "card-outline",
		Refund: "return-up-back-outline",
		Withdrawal: "business-outline",
	};

	const transactionColors: Record<string, string> = {
		TopUp: "#10B981",
		Payment: "#C93C37",
		Refund: "#19543B",
		Withdrawal: "#F59E0B",
	};

	const handleShareFundingDetails = async () => {
		if (!wallet?.accountNumber) {
			return;
		}

		await Share.share({
			message: `Fund your RunAm wallet\nBank: ${wallet.bankName || "Pending"}\nAccount number: ${wallet.accountNumber}\nAccount name: ${wallet.accountName || "RunAm wallet"}`,
		});
	};

	if (!isAuthenticated) {
		return (
			<AuthRequiredState
				title="Sign in to use your wallet"
				description="Wallet setup, transfer funding details, and transaction history live here once you log in."
				redirectTo="/(tabs)/wallet"
			/>
		);
	}

	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<ScrollView
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={onRefresh}
						tintColor="#19543B"
					/>
				}>
				<HeroCard
					kicker="Wallet"
					title="Keep funding simple and visible."
					subtitle="Wallet is now a dedicated flow. Funding details, setup, and transaction history sit on one screen instead of modal branches."
					style={styles.heroCard}>
					<View style={styles.balanceCard}>
						<Text style={styles.balanceLabel}>Available balance</Text>
						<Text style={styles.balanceAmount}>
							{wallet?.currency || "NGN"}{" "}
							{(wallet?.balance ?? 0).toLocaleString()}
						</Text>
						<View style={styles.balanceMetaRow}>
							<View style={styles.balanceMetaChip}>
								<Ionicons
									name="shield-checkmark-outline"
									size={14}
									color="#19543B"
								/>
								<Text style={styles.balanceMetaText}>
									{wallet?.isActive ? "Wallet active" : "Setup required"}
								</Text>
							</View>
							<View style={styles.balanceMetaChip}>
								<Ionicons name="card-outline" size={14} color="#19543B" />
								<Text style={styles.balanceMetaText}>Use at checkout</Text>
							</View>
						</View>
					</View>
				</HeroCard>

				{wallet?.isActive ? (
					<SectionCard title="Fund by transfer" style={styles.section}>
						<Text style={styles.sectionCopy}>
							Send a transfer to the reserved account below. Your wallet balance
							updates after the payment provider confirms the transfer.
						</Text>
						<View style={styles.accountCard}>
							<View style={styles.accountRow}>
								<Text style={styles.accountLabel}>Bank</Text>
								<Text style={styles.accountValue}>
									{wallet.bankName || "Reserved bank pending"}
								</Text>
							</View>
							<View style={styles.accountRow}>
								<Text style={styles.accountLabel}>Account number</Text>
								<Text style={styles.accountValue}>
									{wallet.accountNumber || "Pending"}
								</Text>
							</View>
							<View style={styles.accountRow}>
								<Text style={styles.accountLabel}>Account name</Text>
								<Text style={styles.accountValue}>
									{wallet.accountName || "RunAm wallet"}
								</Text>
							</View>
						</View>
						<View style={styles.accountActionRow}>
							<TouchableOpacity
								style={styles.secondaryButton}
								onPress={() => void handleShareFundingDetails()}
								activeOpacity={0.85}>
								<Ionicons
									name="share-social-outline"
									size={16}
									color="#19543B"
								/>
								<Text style={styles.secondaryButtonText}>Share details</Text>
							</TouchableOpacity>
							<View style={styles.secondaryInfoPill}>
								<Text style={styles.secondaryInfoText}>
									Transfers can take a short while to settle
								</Text>
							</View>
						</View>
						<View style={styles.noteCard}>
							<Ionicons
								name="information-circle-outline"
								size={18}
								color="#19543B"
							/>
							<Text style={styles.noteText}>
								Wallet is most useful inside checkout. If you pay by wallet,
								your balance is validated before the order is submitted.
							</Text>
						</View>
					</SectionCard>
				) : (
					<SectionCard title="Set up your wallet" style={styles.section}>
						<Text style={styles.sectionCopy}>
							Enter your 11-digit NIN once to create the wallet and unlock
							wallet payments during checkout.
						</Text>
						<View style={styles.guidanceCard}>
							<Text style={styles.guidanceTitle}>Before you submit</Text>
							<Text style={styles.guidanceText}>
								Use the exact 11-digit NIN tied to your identity record. RunAm
								only uses it during wallet creation and you will not need to
								re-enter it after setup.
							</Text>
						</View>
						<View style={styles.setupCard}>
							<Text style={styles.inputLabel}>NIN</Text>
							<TextInput
								style={styles.input}
								value={nin}
								onChangeText={(value) => setNin(value.replace(/\D/g, ""))}
								placeholder="Enter your 11-digit NIN"
								placeholderTextColor="#9CA3AF"
								keyboardType="number-pad"
								maxLength={11}
							/>
							<TouchableOpacity
								style={[
									styles.primaryButton,
									(createWalletMutation.isPending ||
										nin.replace(/\D/g, "").length !== 11) &&
										styles.primaryButtonDisabled,
								]}
								onPress={handleCreateWallet}
								disabled={
									createWalletMutation.isPending ||
									nin.replace(/\D/g, "").length !== 11
								}
								activeOpacity={0.85}>
								{createWalletMutation.isPending ? (
									<ActivityIndicator color="#FFFFFF" />
								) : (
									<Text style={styles.primaryButtonText}>Create wallet</Text>
								)}
							</TouchableOpacity>
						</View>
					</SectionCard>
				)}

				<SectionCard title="Transaction history" style={styles.section}>
					{transactions.length > 0 ? (
						transactions.map((item: WalletTransaction) => {
							const isCredit = item.type === "TopUp" || item.type === "Refund";
							const transactionLabel =
								item.type === "TopUp"
									? "Wallet funded"
									: item.type === "Payment"
										? "Checkout payment"
										: item.type === "Refund"
											? "Refund received"
											: "Withdrawal";
							return (
								<View key={item.id} style={styles.txRow}>
									<View
										style={[
											styles.txIconContainer,
											{
												backgroundColor:
													(transactionColors[item.type] || "#6B7280") + "15",
											},
										]}>
										<Ionicons
											name={transactionIcons[item.type] || "wallet-outline"}
											size={20}
											color={transactionColors[item.type] || "#6B7280"}
										/>
									</View>
									<View style={styles.txDetails}>
										<Text style={styles.txDescription}>{item.description}</Text>
										<Text style={styles.txLabel}>{transactionLabel}</Text>
										<Text style={styles.txDate}>
											{new Date(item.createdAt).toLocaleDateString()}
										</Text>
									</View>
									<Text
										style={[
											styles.txAmount,
											{ color: isCredit ? "#10B981" : "#C93C37" },
										]}>
										{isCredit ? "+" : "-"}
										{item.currency} {Math.abs(item.amount).toLocaleString()}
									</Text>
								</View>
							);
						})
					) : (
						<EmptyState
							icon="receipt-outline"
							title="No transactions yet"
							description="Your wallet activity will appear here after the first top-up, payment, or refund."
							style={styles.emptyCard}
						/>
					)}
				</SectionCard>
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: "#F3F5EF" },
	content: { padding: 20, paddingBottom: 36 },
	heroCard: {
		marginBottom: 16,
	},
	balanceCard: {
		backgroundColor: "#FFFFFF",
		borderRadius: 24,
		padding: 18,
		marginTop: 18,
	},
	balanceLabel: {
		fontSize: 12,
		fontWeight: "700",
		letterSpacing: 1,
		textTransform: "uppercase",
		color: "#748175",
		marginBottom: 6,
	},
	balanceAmount: {
		fontSize: 30,
		fontWeight: "800",
		letterSpacing: -0.8,
		color: "#142013",
	},
	balanceMetaRow: {
		flexDirection: "row",
		gap: 8,
		marginTop: 14,
		flexWrap: "wrap",
	},
	balanceMetaChip: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		backgroundColor: "#EDF2EA",
		borderRadius: 999,
		paddingHorizontal: 12,
		paddingVertical: 8,
	},
	balanceMetaText: {
		fontSize: 12,
		fontWeight: "700",
		color: "#19543B",
	},
	section: { marginBottom: 24 },
	sectionCopy: {
		fontSize: 13,
		lineHeight: 19,
		color: "#667268",
		marginBottom: 12,
	},
	accountCard: {
		backgroundColor: "#F7F8F4",
		borderRadius: 22,
		borderWidth: 1,
		borderColor: "#E4E8DE",
		padding: 18,
		gap: 12,
	},
	accountRow: {
		gap: 4,
	},
	accountLabel: {
		fontSize: 12,
		fontWeight: "700",
		letterSpacing: 1,
		textTransform: "uppercase",
		color: "#7A8579",
	},
	accountValue: {
		fontSize: 16,
		fontWeight: "800",
		color: "#142013",
	},
	accountActionRow: {
		marginTop: 12,
		gap: 10,
	},
	secondaryButton: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 8,
		paddingVertical: 13,
		borderRadius: 16,
		backgroundColor: "#EDF2EA",
	},
	secondaryButtonText: {
		fontSize: 14,
		fontWeight: "800",
		color: "#19543B",
	},
	secondaryInfoPill: {
		paddingHorizontal: 12,
		paddingVertical: 10,
		borderRadius: 14,
		backgroundColor: "#F7F8F4",
		borderWidth: 1,
		borderColor: "#E4E8DE",
	},
	secondaryInfoText: {
		fontSize: 12,
		color: "#667268",
		fontWeight: "600",
	},
	noteCard: {
		backgroundColor: "#E9F0E8",
		borderRadius: 18,
		padding: 14,
		marginTop: 12,
		flexDirection: "row",
		gap: 10,
		alignItems: "flex-start",
	},
	noteText: {
		flex: 1,
		fontSize: 13,
		lineHeight: 18,
		color: "#3D5140",
	},
	setupCard: {
		backgroundColor: "#F7F8F4",
		borderRadius: 22,
		borderWidth: 1,
		borderColor: "#E4E8DE",
		padding: 18,
	},
	guidanceCard: {
		backgroundColor: "#FFFFFF",
		borderRadius: 18,
		padding: 14,
		borderWidth: 1,
		borderColor: "#E4E8DE",
		marginBottom: 12,
	},
	guidanceTitle: {
		fontSize: 14,
		fontWeight: "800",
		color: "#142013",
	},
	guidanceText: {
		fontSize: 12,
		lineHeight: 18,
		color: "#667268",
		marginTop: 6,
	},
	inputLabel: {
		fontSize: 12,
		fontWeight: "700",
		letterSpacing: 1,
		textTransform: "uppercase",
		color: "#748175",
		marginBottom: 8,
	},
	input: {
		backgroundColor: "#F7F8F4",
		borderWidth: 1,
		borderColor: "#E4E8DE",
		borderRadius: 16,
		paddingHorizontal: 14,
		paddingVertical: 14,
		fontSize: 16,
		color: "#142013",
	},
	primaryButton: {
		marginTop: 14,
		backgroundColor: "#19543B",
		borderRadius: 18,
		paddingVertical: 15,
		alignItems: "center",
	},
	primaryButtonDisabled: {
		opacity: 0.45,
	},
	primaryButtonText: {
		fontSize: 15,
		fontWeight: "800",
		color: "#FFFFFF",
	},
	txRow: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#FFFFFF",
		borderRadius: 18,
		padding: 14,
		marginBottom: 10,
		borderWidth: 1,
		borderColor: "#E4E8DE",
	},
	txIconContainer: {
		width: 44,
		height: 44,
		borderRadius: 22,
		alignItems: "center",
		justifyContent: "center",
		marginRight: 12,
	},
	txDetails: { flex: 1 },
	txDescription: { fontSize: 14, fontWeight: "700", color: "#374151" },
	txLabel: {
		fontSize: 12,
		color: "#19543B",
		fontWeight: "700",
		marginTop: 3,
	},
	txDate: { fontSize: 12, color: "#9CA3AF", marginTop: 2 },
	txAmount: { fontSize: 15, fontWeight: "800" },
	emptyCard: {
		padding: 0,
	},
});
