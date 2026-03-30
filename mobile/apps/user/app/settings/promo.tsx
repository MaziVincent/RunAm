import { useState } from "react";
import {
	View,
	Text,
	StyleSheet,
	FlatList,
	TouchableOpacity,
	TextInput,
	Alert,
	ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPromoCodes, redeemPromoCode } from "@runam/shared/api/payments";
import type { PromoCode, ApplyPromoResult } from "@runam/shared/types";

export default function PromoScreen() {
	const queryClient = useQueryClient();
	const [code, setCode] = useState("");

	const { data: promoCodes = [], isLoading } = useQuery<PromoCode[]>({
		queryKey: ["promo-codes"],
		queryFn: getPromoCodes,
	});

	const redeemMutation = useMutation({
		mutationFn: (promoCode: string) => redeemPromoCode(promoCode),
		onSuccess: (result) => {
			queryClient.invalidateQueries({ queryKey: ["promo-codes"] });
			setCode("");
			if (result.valid) {
				Alert.alert("🎉 Success!", result.message);
			} else {
				Alert.alert("Invalid Code", result.message);
			}
		},
		onError: (err: any) =>
			Alert.alert("Error", err?.message || "Failed to apply code."),
	});

	const handleRedeem = () => {
		if (!code.trim()) {
			Alert.alert("Error", "Please enter a promo code.");
			return;
		}
		redeemMutation.mutate(code.trim());
	};

	return (
		<SafeAreaView style={styles.container} edges={["bottom"]}>
			{/* Redeem input */}
			<View style={styles.redeemSection}>
				<Text style={styles.redeemTitle}>🎟️ Enter Promo Code</Text>
				<View style={styles.redeemRow}>
					<TextInput
						style={styles.redeemInput}
						placeholder="Enter code here"
						placeholderTextColor="#9CA3AF"
						value={code}
						onChangeText={setCode}
						autoCapitalize="characters"
						maxLength={20}
					/>
					<TouchableOpacity
						style={[
							styles.redeemBtn,
							redeemMutation.isPending && { opacity: 0.6 },
						]}
						onPress={handleRedeem}
						disabled={redeemMutation.isPending}>
						{redeemMutation.isPending ? (
							<ActivityIndicator color="#FFF" size="small" />
						) : (
							<Text style={styles.redeemBtnText}>Redeem</Text>
						)}
					</TouchableOpacity>
				</View>
			</View>

			{/* Active promos */}
			<Text style={styles.sectionTitle}>Your Promotions</Text>
			<FlatList
				data={promoCodes}
				keyExtractor={(item) => item.id}
				contentContainerStyle={styles.listContent}
				renderItem={({ item }) => (
					<View
						style={[styles.promoCard, !item.isActive && styles.promoExpired]}>
						<View style={styles.promoTop}>
							<View style={styles.promoCodeBadge}>
								<Text style={styles.promoCodeText}>{item.code}</Text>
							</View>
							{!item.isActive ? (
								<Text style={styles.expiredTag}>Expired</Text>
							) : (
								<Text style={styles.activeTag}>Active</Text>
							)}
						</View>
						<Text style={styles.promoDescription}>{item.description}</Text>
						<View style={styles.promoMeta}>
							<Text style={styles.promoDiscount}>
								{item.discountPercent
									? `${item.discountPercent}% off`
									: `₦${item.discountAmount} off`}
							</Text>
							{item.maxDiscount && (
								<Text style={styles.promoMax}>Max: ₦{item.maxDiscount}</Text>
							)}
							{item.expiresAt && (
								<Text style={styles.promoExpiry}>
									Expires: {new Date(item.expiresAt).toLocaleDateString()}
								</Text>
							)}
						</View>
					</View>
				)}
				ListEmptyComponent={
					!isLoading ? (
						<View style={styles.emptyState}>
							<Text style={styles.emptyIcon}>🎟️</Text>
							<Text style={styles.emptyTitle}>No promo codes</Text>
							<Text style={styles.emptySubtitle}>
								Enter a code above to get started
							</Text>
						</View>
					) : (
						<View style={{ paddingTop: 40, alignItems: "center" }}>
							<ActivityIndicator size="large" color="#2F8F4E" />
						</View>
					)
				}
			/>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: "#F9FAFB" },
	redeemSection: {
		backgroundColor: "#FFFFFF",
		padding: 20,
		borderBottomWidth: 1,
		borderBottomColor: "#F3F4F6",
	},
	redeemTitle: {
		fontSize: 16,
		fontWeight: "700",
		color: "#111827",
		marginBottom: 12,
	},
	redeemRow: { flexDirection: "row", gap: 10 },
	redeemInput: {
		flex: 1,
		backgroundColor: "#F9FAFB",
		borderWidth: 1,
		borderColor: "#E5E7EB",
		borderRadius: 12,
		paddingHorizontal: 16,
		paddingVertical: 14,
		fontSize: 16,
		fontWeight: "700",
		color: "#111827",
		letterSpacing: 2,
	},
	redeemBtn: {
		backgroundColor: "#2F8F4E",
		borderRadius: 12,
		paddingHorizontal: 24,
		justifyContent: "center",
	},
	redeemBtnText: { fontSize: 15, fontWeight: "700", color: "#FFFFFF" },
	sectionTitle: {
		fontSize: 16,
		fontWeight: "700",
		color: "#111827",
		paddingHorizontal: 20,
		paddingTop: 20,
		paddingBottom: 12,
	},
	listContent: { paddingHorizontal: 20, paddingBottom: 40 },
	promoCard: {
		backgroundColor: "#FFFFFF",
		borderRadius: 14,
		padding: 16,
		marginBottom: 12,
		borderWidth: 1,
		borderColor: "#F3F4F6",
		borderLeftWidth: 4,
		borderLeftColor: "#2F8F4E",
	},
	promoExpired: { opacity: 0.5, borderLeftColor: "#9CA3AF" },
	promoTop: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 8,
	},
	promoCodeBadge: {
		backgroundColor: "#F0FDF4",
		borderRadius: 8,
		paddingHorizontal: 12,
		paddingVertical: 4,
	},
	promoCodeText: {
		fontSize: 14,
		fontWeight: "800",
		color: "#2F8F4E",
		letterSpacing: 1,
	},
	expiredTag: { fontSize: 12, fontWeight: "600", color: "#9CA3AF" },
	activeTag: { fontSize: 12, fontWeight: "600", color: "#10B981" },
	promoDescription: { fontSize: 14, color: "#374151", marginBottom: 10 },
	promoMeta: { flexDirection: "row", gap: 12, flexWrap: "wrap" },
	promoDiscount: { fontSize: 13, fontWeight: "700", color: "#2F8F4E" },
	promoMax: { fontSize: 12, color: "#6B7280" },
	promoExpiry: { fontSize: 12, color: "#9CA3AF" },
	emptyState: { alignItems: "center", paddingTop: 60 },
	emptyIcon: { fontSize: 48, marginBottom: 12 },
	emptyTitle: { fontSize: 18, fontWeight: "600", color: "#374151" },
	emptySubtitle: { fontSize: 14, color: "#9CA3AF", marginTop: 4 },
});
