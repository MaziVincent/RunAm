import { useState } from "react";
import {
	View,
	Text,
	StyleSheet,
	FlatList,
	TouchableOpacity,
	Alert,
	ActivityIndicator,
	Modal,
	TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@runam/shared/api/client";
import type { PaymentMethod } from "@runam/shared/types";

export default function PaymentMethodsScreen() {
	const queryClient = useQueryClient();
	const [showAdd, setShowAdd] = useState(false);
	const [cardNumber, setCardNumber] = useState("");
	const [expiry, setExpiry] = useState("");
	const [cvv, setCvv] = useState("");
	const [cardName, setCardName] = useState("");

	const { data: methods = [], isLoading } = useQuery<PaymentMethod[]>({
		queryKey: ["payment-methods"],
		queryFn: () => apiClient.get("/payments/methods"),
	});

	const addMutation = useMutation({
		mutationFn: (data: {
			cardNumber: string;
			expiry: string;
			cvv: string;
			name: string;
		}) => apiClient.post<PaymentMethod>("/payments/methods", data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
			setShowAdd(false);
			resetForm();
			Alert.alert("Success", "Card added successfully.");
		},
		onError: (err: any) =>
			Alert.alert("Error", err?.message || "Failed to add card."),
	});

	const deleteMutation = useMutation({
		mutationFn: (id: string) => apiClient.delete(`/payments/methods/${id}`),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
		},
	});

	const setDefaultMutation = useMutation({
		mutationFn: (id: string) =>
			apiClient.post(`/payments/methods/${id}/default`, {}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
		},
	});

	const resetForm = () => {
		setCardNumber("");
		setExpiry("");
		setCvv("");
		setCardName("");
	};

	const handleAdd = () => {
		if (!cardNumber.trim() || !expiry.trim() || !cvv.trim()) {
			Alert.alert("Error", "Please fill in all card details.");
			return;
		}
		addMutation.mutate({
			cardNumber: cardNumber.replace(/\s/g, ""),
			expiry: expiry.trim(),
			cvv: cvv.trim(),
			name: cardName.trim(),
		});
	};

	const handleDelete = (item: PaymentMethod) => {
		Alert.alert("Remove Card", `Remove card ending in ${item.last4}?`, [
			{ text: "Cancel", style: "cancel" },
			{
				text: "Remove",
				style: "destructive",
				onPress: () => deleteMutation.mutate(item.id),
			},
		]);
	};

	const formatCardNumber = (text: string) => {
		const cleaned = text.replace(/\D/g, "").slice(0, 16);
		const chunks = cleaned.match(/.{1,4}/g);
		return chunks ? chunks.join(" ") : "";
	};

	const formatExpiry = (text: string) => {
		const cleaned = text.replace(/\D/g, "").slice(0, 4);
		if (cleaned.length >= 3)
			return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
		return cleaned;
	};

	const getCardBrand = (last4: string) => {
		// Simplified - would normally come from backend
		return "💳";
	};

	return (
		<SafeAreaView style={styles.container} edges={["bottom"]}>
			<FlatList
				data={methods}
				keyExtractor={(item) => item.id}
				contentContainerStyle={styles.listContent}
				ListHeaderComponent={
					<View style={styles.headerInfo}>
						<Text style={styles.infoText}>
							Manage your saved payment methods for quick checkouts.
						</Text>
					</View>
				}
				renderItem={({ item }) => (
					<View
						style={[styles.cardRow, item.isDefault && styles.cardRowDefault]}>
						<View style={styles.cardIcon}>
							<Text style={styles.cardIconText}>
								{getCardBrand(item.last4 ?? "")}
							</Text>
						</View>
						<View style={styles.cardDetails}>
							<Text style={styles.cardType}>
								{item.type === "Card" ? "Debit/Credit Card" : item.type}
							</Text>
							<Text style={styles.cardLast4}>•••• •••• •••• {item.last4}</Text>
						</View>
						<View style={styles.cardActions}>
							{item.isDefault ? (
								<View style={styles.defaultBadge}>
									<Text style={styles.defaultBadgeText}>Default</Text>
								</View>
							) : (
								<TouchableOpacity
									style={styles.setDefaultBtn}
									onPress={() => setDefaultMutation.mutate(item.id)}>
									<Text style={styles.setDefaultText}>Set Default</Text>
								</TouchableOpacity>
							)}
							<TouchableOpacity onPress={() => handleDelete(item)}>
								<Text style={styles.deleteText}>🗑</Text>
							</TouchableOpacity>
						</View>
					</View>
				)}
				ListEmptyComponent={
					!isLoading ? (
						<View style={styles.emptyState}>
							<Text style={styles.emptyIcon}>💳</Text>
							<Text style={styles.emptyTitle}>No saved cards</Text>
							<Text style={styles.emptySubtitle}>
								Add a card for faster payments
							</Text>
						</View>
					) : (
						<View style={styles.centered}>
							<ActivityIndicator size="large" color="#3B82F6" />
						</View>
					)
				}
				ListFooterComponent={
					<TouchableOpacity
						style={styles.addCardBtn}
						onPress={() => setShowAdd(true)}>
						<Text style={styles.addCardBtnText}>+ Add New Card</Text>
					</TouchableOpacity>
				}
			/>

			{/* Add Card Modal */}
			<Modal visible={showAdd} animationType="slide" transparent>
				<View style={styles.modalOverlay}>
					<View style={styles.modalContent}>
						<View style={styles.modalHandle} />
						<Text style={styles.modalTitle}>Add Card</Text>

						<Text style={styles.label}>Cardholder Name</Text>
						<TextInput
							style={styles.input}
							placeholder="John Doe"
							placeholderTextColor="#9CA3AF"
							value={cardName}
							onChangeText={setCardName}
							autoCapitalize="words"
						/>

						<Text style={styles.label}>Card Number</Text>
						<TextInput
							style={styles.input}
							placeholder="1234 5678 9012 3456"
							placeholderTextColor="#9CA3AF"
							value={cardNumber}
							onChangeText={(t) => setCardNumber(formatCardNumber(t))}
							keyboardType="number-pad"
							maxLength={19}
						/>

						<View style={styles.row}>
							<View style={styles.half}>
								<Text style={styles.label}>Expiry</Text>
								<TextInput
									style={styles.input}
									placeholder="MM/YY"
									placeholderTextColor="#9CA3AF"
									value={expiry}
									onChangeText={(t) => setExpiry(formatExpiry(t))}
									keyboardType="number-pad"
									maxLength={5}
								/>
							</View>
							<View style={styles.half}>
								<Text style={styles.label}>CVV</Text>
								<TextInput
									style={styles.input}
									placeholder="123"
									placeholderTextColor="#9CA3AF"
									value={cvv}
									onChangeText={setCvv}
									keyboardType="number-pad"
									maxLength={4}
									secureTextEntry
								/>
							</View>
						</View>

						<TouchableOpacity
							style={[
								styles.confirmBtn,
								addMutation.isPending && { opacity: 0.6 },
							]}
							onPress={handleAdd}
							disabled={addMutation.isPending}>
							{addMutation.isPending ? (
								<ActivityIndicator color="#FFF" />
							) : (
								<Text style={styles.confirmBtnText}>Add Card</Text>
							)}
						</TouchableOpacity>
						<TouchableOpacity
							style={styles.cancelBtn}
							onPress={() => {
								setShowAdd(false);
								resetForm();
							}}>
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
	centered: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		paddingTop: 60,
	},
	listContent: { padding: 20 },
	headerInfo: { marginBottom: 20 },
	infoText: { fontSize: 14, color: "#6B7280", lineHeight: 20 },
	cardRow: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#FFFFFF",
		borderRadius: 14,
		padding: 16,
		marginBottom: 12,
		borderWidth: 1,
		borderColor: "#F3F4F6",
	},
	cardRowDefault: { borderColor: "#3B82F6", borderWidth: 2 },
	cardIcon: {
		width: 48,
		height: 48,
		borderRadius: 12,
		backgroundColor: "#F3F4F6",
		alignItems: "center",
		justifyContent: "center",
		marginRight: 14,
	},
	cardIconText: { fontSize: 24 },
	cardDetails: { flex: 1 },
	cardType: { fontSize: 14, fontWeight: "600", color: "#111827" },
	cardLast4: { fontSize: 13, color: "#6B7280", marginTop: 2 },
	cardExpiry: { fontSize: 11, color: "#9CA3AF", marginTop: 2 },
	cardActions: { alignItems: "flex-end", gap: 8 },
	defaultBadge: {
		backgroundColor: "#EFF6FF",
		borderRadius: 8,
		paddingHorizontal: 10,
		paddingVertical: 4,
	},
	defaultBadgeText: { fontSize: 11, fontWeight: "700", color: "#3B82F6" },
	setDefaultBtn: {
		backgroundColor: "#F3F4F6",
		borderRadius: 8,
		paddingHorizontal: 10,
		paddingVertical: 4,
	},
	setDefaultText: { fontSize: 11, fontWeight: "600", color: "#374151" },
	deleteText: { fontSize: 18 },
	emptyState: { alignItems: "center", paddingTop: 60 },
	emptyIcon: { fontSize: 48, marginBottom: 12 },
	emptyTitle: { fontSize: 18, fontWeight: "600", color: "#374151" },
	emptySubtitle: { fontSize: 14, color: "#9CA3AF", marginTop: 4 },
	addCardBtn: {
		backgroundColor: "#3B82F6",
		borderRadius: 14,
		paddingVertical: 16,
		alignItems: "center",
		marginTop: 12,
	},
	addCardBtnText: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },
	// Modal
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
	label: {
		fontSize: 14,
		fontWeight: "600",
		color: "#374151",
		marginBottom: 6,
		marginTop: 12,
	},
	input: {
		backgroundColor: "#F9FAFB",
		borderWidth: 1,
		borderColor: "#E5E7EB",
		borderRadius: 12,
		paddingHorizontal: 16,
		paddingVertical: 14,
		fontSize: 16,
		color: "#111827",
	},
	row: { flexDirection: "row", gap: 12 },
	half: { flex: 1 },
	confirmBtn: {
		backgroundColor: "#3B82F6",
		borderRadius: 14,
		paddingVertical: 16,
		alignItems: "center",
		marginTop: 24,
	},
	confirmBtnText: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },
	cancelBtn: {
		backgroundColor: "#F3F4F6",
		borderRadius: 14,
		paddingVertical: 16,
		alignItems: "center",
		marginTop: 10,
	},
	cancelBtnText: { fontSize: 16, fontWeight: "600", color: "#374151" },
});
