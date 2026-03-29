import { useState, useCallback } from "react";
import {
	View,
	Text,
	StyleSheet,
	FlatList,
	RefreshControl,
	TouchableOpacity,
	Alert,
	Modal,
	TextInput,
	ActivityIndicator,
	KeyboardAvoidingView,
	Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
	getRiderBankAccounts,
	addRiderBankAccount,
	deleteRiderBankAccount,
	setDefaultBankAccount,
} from "@runam/shared/api/rider";
import type { BankAccount, AddBankAccountRequest } from "@runam/shared/types";

export default function BankAccountsScreen() {
	const [refreshing, setRefreshing] = useState(false);
	const [showAddModal, setShowAddModal] = useState(false);
	const [bankName, setBankName] = useState("");
	const [bankCode, setBankCode] = useState("");
	const [accountNumber, setAccountNumber] = useState("");
	const [accountName, setAccountName] = useState("");
	const router = useRouter();
	const queryClient = useQueryClient();

	const {
		data: accounts,
		refetch,
		isLoading,
	} = useQuery<BankAccount[]>({
		queryKey: ["rider", "bank-accounts"],
		queryFn: () => getRiderBankAccounts(),
	});

	const addMutation = useMutation({
		mutationFn: (req: AddBankAccountRequest) => addRiderBankAccount(req),
		onSuccess: () => {
			setShowAddModal(false);
			setBankName("");
			setBankCode("");
			setAccountNumber("");
			setAccountName("");
			queryClient.invalidateQueries({ queryKey: ["rider", "bank-accounts"] });
			Alert.alert("Success", "Bank account added");
		},
		onError: (err: Error) => Alert.alert("Error", err.message),
	});

	const setDefaultMutation = useMutation({
		mutationFn: (id: string) => setDefaultBankAccount(id),
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: ["rider", "bank-accounts"] }),
	});

	const deleteMutation = useMutation({
		mutationFn: (id: string) => deleteRiderBankAccount(id),
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: ["rider", "bank-accounts"] }),
	});

	const onRefresh = useCallback(async () => {
		setRefreshing(true);
		await refetch();
		setRefreshing(false);
	}, [refetch]);

	const handleAdd = () => {
		if (
			!bankName.trim() ||
			!bankCode.trim() ||
			!accountNumber.trim() ||
			!accountName.trim()
		) {
			Alert.alert("Error", "Fill in all fields");
			return;
		}
		if (accountNumber.length < 10) {
			Alert.alert("Error", "Enter a valid account number");
			return;
		}
		addMutation.mutate({
			bankName: bankName.trim(),
			bankCode: bankCode.trim(),
			accountNumber: accountNumber.trim(),
			accountName: accountName.trim(),
		});
	};

	const handleDelete = (account: BankAccount) => {
		Alert.alert(
			"Delete Account",
			`Remove ${account.bankName} ****${account.accountNumber.slice(-4)}?`,
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Delete",
					style: "destructive",
					onPress: () => deleteMutation.mutate(account.id),
				},
			],
		);
	};

	const renderAccount = ({ item }: { item: BankAccount }) => (
		<View style={[styles.card, item.isDefault && styles.cardDefault]}>
			<View style={styles.cardHeader}>
				<View style={styles.bankIcon}>
					<Text style={styles.bankIconText}>🏦</Text>
				</View>
				<View style={styles.cardInfo}>
					<Text style={styles.cardBankName}>{item.bankName}</Text>
					<Text style={styles.cardAcctName}>{item.accountName}</Text>
					<Text style={styles.cardAcctNo}>
						****{item.accountNumber.slice(-4)}
					</Text>
				</View>
				{item.isDefault && (
					<View style={styles.defaultBadge}>
						<Text style={styles.defaultBadgeText}>Default</Text>
					</View>
				)}
			</View>

			<View style={styles.cardActions}>
				{!item.isDefault && (
					<TouchableOpacity
						style={styles.setDefaultBtn}
						onPress={() => setDefaultMutation.mutate(item.id)}>
						<Text style={styles.setDefaultText}>Set as Default</Text>
					</TouchableOpacity>
				)}
				<TouchableOpacity
					style={styles.deleteBtn}
					onPress={() => handleDelete(item)}>
					<Text style={styles.deleteText}>Remove</Text>
				</TouchableOpacity>
			</View>
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
			{/* Header */}
			<View style={styles.header}>
				<TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
					<Text style={styles.backText}>‹ Back</Text>
				</TouchableOpacity>
				<Text style={styles.title}>Bank Accounts</Text>
				<TouchableOpacity
					onPress={() => setShowAddModal(true)}
					style={styles.addBtn}>
					<Text style={styles.addBtnText}>+ Add</Text>
				</TouchableOpacity>
			</View>

			<FlatList
				data={accounts || []}
				keyExtractor={(item) => item.id}
				renderItem={renderAccount}
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
						<Text style={styles.emptyIcon}>🏦</Text>
						<Text style={styles.emptyTitle}>No bank accounts</Text>
						<Text style={styles.emptySubtitle}>
							Add a bank account to withdraw your earnings
						</Text>
						<TouchableOpacity
							style={styles.emptyAddBtn}
							onPress={() => setShowAddModal(true)}>
							<Text style={styles.emptyAddBtnText}>+ Add Bank Account</Text>
						</TouchableOpacity>
					</View>
				}
			/>

			{/* Add Bank Account Modal */}
			<Modal
				visible={showAddModal}
				transparent
				animationType="slide"
				onRequestClose={() => setShowAddModal(false)}>
				<KeyboardAvoidingView
					style={styles.modalOverlay}
					behavior={Platform.OS === "ios" ? "padding" : undefined}>
					<View style={styles.modalContent}>
						<Text style={styles.modalTitle}>Add Bank Account</Text>

						<Text style={styles.inputLabel}>Bank Name</Text>
						<TextInput
							style={styles.input}
							value={bankName}
							onChangeText={setBankName}
							placeholder="e.g. First Bank, GTBank"
							placeholderTextColor="#94A3B8"
						/>

						<Text style={styles.inputLabel}>Bank Code</Text>
						<TextInput
							style={styles.input}
							value={bankCode}
							onChangeText={setBankCode}
							placeholder="e.g. 011, 058"
							placeholderTextColor="#94A3B8"
							keyboardType="numeric"
						/>

						<Text style={styles.inputLabel}>Account Number</Text>
						<TextInput
							style={styles.input}
							value={accountNumber}
							onChangeText={(t) => setAccountNumber(t.replace(/\D/g, ""))}
							placeholder="0123456789"
							placeholderTextColor="#94A3B8"
							keyboardType="numeric"
							maxLength={10}
						/>

						<Text style={styles.inputLabel}>Account Name</Text>
						<TextInput
							style={styles.input}
							value={accountName}
							onChangeText={setAccountName}
							placeholder="John Doe"
							placeholderTextColor="#94A3B8"
							autoCapitalize="words"
						/>

						<View style={styles.modalActions}>
							<TouchableOpacity
								style={styles.cancelBtn}
								onPress={() => setShowAddModal(false)}>
								<Text style={styles.cancelText}>Cancel</Text>
							</TouchableOpacity>
							<TouchableOpacity
								style={[
									styles.confirmBtn,
									addMutation.isPending && { opacity: 0.6 },
								]}
								onPress={handleAdd}
								disabled={addMutation.isPending}>
								<Text style={styles.confirmText}>
									{addMutation.isPending ? "Adding..." : "Add Account"}
								</Text>
							</TouchableOpacity>
						</View>
					</View>
				</KeyboardAvoidingView>
			</Modal>
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
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 20,
		paddingVertical: 12,
		borderBottomWidth: 1,
		borderBottomColor: "#F3F4F6",
		backgroundColor: "#FFFFFF",
	},
	backBtn: { width: 60 },
	backText: { fontSize: 17, color: "#3B82F6", fontWeight: "600" },
	title: { fontSize: 18, fontWeight: "700", color: "#111827" },
	addBtn: { width: 60, alignItems: "flex-end" },
	addBtnText: { fontSize: 15, color: "#3B82F6", fontWeight: "700" },
	listContent: { padding: 20, paddingBottom: 40 },

	card: {
		backgroundColor: "#FFFFFF",
		borderRadius: 16,
		padding: 18,
		marginBottom: 12,
		borderWidth: 1.5,
		borderColor: "#E5E7EB",
	},
	cardDefault: {
		borderColor: "#3B82F6",
	},
	cardHeader: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 14,
	},
	bankIcon: {
		width: 44,
		height: 44,
		borderRadius: 12,
		backgroundColor: "#EFF6FF",
		alignItems: "center",
		justifyContent: "center",
		marginRight: 14,
	},
	bankIconText: { fontSize: 22 },
	cardInfo: { flex: 1 },
	cardBankName: { fontSize: 16, fontWeight: "700", color: "#111827" },
	cardAcctName: { fontSize: 13, color: "#6B7280", marginTop: 2 },
	cardAcctNo: { fontSize: 13, color: "#9CA3AF", marginTop: 1 },
	defaultBadge: {
		backgroundColor: "#DBEAFE",
		paddingHorizontal: 10,
		paddingVertical: 4,
		borderRadius: 10,
	},
	defaultBadgeText: { fontSize: 11, fontWeight: "700", color: "#3B82F6" },

	cardActions: {
		flexDirection: "row",
		gap: 10,
		borderTopWidth: 1,
		borderTopColor: "#F3F4F6",
		paddingTop: 12,
	},
	setDefaultBtn: {
		flex: 1,
		backgroundColor: "#EFF6FF",
		borderRadius: 10,
		paddingVertical: 10,
		alignItems: "center",
	},
	setDefaultText: { fontSize: 13, fontWeight: "600", color: "#3B82F6" },
	deleteBtn: {
		paddingHorizontal: 16,
		paddingVertical: 10,
		borderRadius: 10,
		backgroundColor: "#FEF2F2",
	},
	deleteText: { fontSize: 13, fontWeight: "600", color: "#EF4444" },

	emptyState: { alignItems: "center", paddingTop: 60 },
	emptyIcon: { fontSize: 56, marginBottom: 16 },
	emptyTitle: { fontSize: 18, fontWeight: "600", color: "#374151" },
	emptySubtitle: {
		fontSize: 14,
		color: "#9CA3AF",
		marginTop: 4,
		textAlign: "center",
		paddingHorizontal: 40,
	},
	emptyAddBtn: {
		marginTop: 24,
		backgroundColor: "#3B82F6",
		borderRadius: 14,
		paddingHorizontal: 28,
		paddingVertical: 14,
	},
	emptyAddBtnText: { fontSize: 15, fontWeight: "700", color: "#FFFFFF" },

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
	},
	modalTitle: {
		fontSize: 20,
		fontWeight: "700",
		color: "#111827",
		marginBottom: 20,
	},
	inputLabel: {
		fontSize: 13,
		fontWeight: "600",
		color: "#374151",
		marginBottom: 6,
	},
	input: {
		backgroundColor: "#F1F5F9",
		borderRadius: 12,
		padding: 14,
		fontSize: 16,
		color: "#1E293B",
		marginBottom: 16,
	},
	modalActions: { flexDirection: "row", gap: 12, marginTop: 4 },
	cancelBtn: {
		flex: 1,
		backgroundColor: "#F1F5F9",
		borderRadius: 14,
		paddingVertical: 14,
		alignItems: "center",
	},
	cancelText: { fontSize: 15, fontWeight: "600", color: "#374151" },
	confirmBtn: {
		flex: 1,
		backgroundColor: "#3B82F6",
		borderRadius: 14,
		paddingVertical: 14,
		alignItems: "center",
	},
	confirmText: { fontSize: 15, fontWeight: "600", color: "#FFFFFF" },
});
