import { useMemo, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	FlatList,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getPromoCodes, redeemPromoCode } from "@runam/shared/api/payments";
import type { PromoCode } from "@runam/shared/types";

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
			Alert.alert(
				result.valid ? "Promo applied" : "Invalid code",
				result.message,
			);
		},
		onError: (err: any) => {
			Alert.alert("Error", err?.message || "Failed to apply code.");
		},
	});

	const activePromos = useMemo(
		() => promoCodes.filter((item) => item.isActive),
		[promoCodes],
	);
	const expiredPromos = promoCodes.length - activePromos.length;

	const handleRedeem = () => {
		const normalizedCode = code.trim();
		if (!normalizedCode) {
			Alert.alert("Error", "Please enter a promo code.");
			return;
		}

		redeemMutation.mutate(normalizedCode);
	};

	return (
		<SafeAreaView style={styles.container} edges={["top", "bottom"]}>
			<FlatList
				data={promoCodes}
				keyExtractor={(item) => item.id}
				contentContainerStyle={styles.listContent}
				showsVerticalScrollIndicator={false}
				ListHeaderComponent={
					<>
						<View style={styles.heroCard}>
							<View style={styles.heroIconWrap}>
								<Ionicons name="pricetags-outline" size={28} color="#19543B" />
							</View>
							<Text style={styles.kicker}>Promotions</Text>
							<Text style={styles.heroTitle}>
								Save your best codes here and apply them before checkout.
							</Text>
							<Text style={styles.heroSubtitle}>
								Redeem a code once, then keep track of which offers are still
								active and which ones have already expired.
							</Text>
						</View>

						<View style={styles.summaryRow}>
							<View style={styles.summaryCard}>
								<Text style={styles.summaryValue}>{activePromos.length}</Text>
								<Text style={styles.summaryLabel}>Active codes</Text>
							</View>
							<View style={styles.summaryCard}>
								<Text style={styles.summaryValue}>{expiredPromos}</Text>
								<Text style={styles.summaryLabel}>Expired codes</Text>
							</View>
						</View>

						<View style={styles.redeemCard}>
							<Text style={styles.redeemTitle}>Redeem a promo code</Text>
							<Text style={styles.redeemSubtitle}>
								Codes are applied to your account after verification.
							</Text>
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
										redeemMutation.isPending && styles.redeemBtnDisabled,
									]}
									onPress={handleRedeem}
									disabled={redeemMutation.isPending}
									activeOpacity={0.85}>
									{redeemMutation.isPending ? (
										<ActivityIndicator color="#FFFFFF" size="small" />
									) : (
										<Text style={styles.redeemBtnText}>Redeem</Text>
									)}
								</TouchableOpacity>
							</View>
						</View>

						<Text style={styles.sectionTitle}>Your promotions</Text>
					</>
				}
				renderItem={({ item }) => (
					<View
						style={[styles.promoCard, !item.isActive && styles.promoExpired]}>
						<View style={styles.promoTop}>
							<View
								style={[
									styles.promoCodeBadge,
									!item.isActive && styles.promoCodeBadgeExpired,
								]}>
								<Text style={styles.promoCodeText}>{item.code}</Text>
							</View>
							<View
								style={[
									styles.statusPill,
									item.isActive ? styles.activePill : styles.expiredPill,
								]}>
								<Text
									style={[
										styles.statusPillText,
										item.isActive ? styles.activeTag : styles.expiredTag,
									]}>
									{item.isActive ? "Active" : "Expired"}
								</Text>
							</View>
						</View>
						<Text style={styles.promoDescription}>{item.description}</Text>
						<View style={styles.promoMeta}>
							<Text style={styles.promoDiscount}>
								{item.discountPercent
									? `${item.discountPercent}% off`
									: `₦${item.discountAmount} off`}
							</Text>
							{item.maxDiscount ? (
								<Text style={styles.promoMax}>Max: ₦{item.maxDiscount}</Text>
							) : null}
							{item.expiresAt ? (
								<Text style={styles.promoExpiry}>
									Expires: {new Date(item.expiresAt).toLocaleDateString()}
								</Text>
							) : null}
						</View>
					</View>
				)}
				ListEmptyComponent={
					!isLoading ? (
						<View style={styles.emptyState}>
							<View style={styles.emptyIconWrap}>
								<Ionicons name="gift-outline" size={28} color="#19543B" />
							</View>
							<Text style={styles.emptyTitle}>No promo codes</Text>
							<Text style={styles.emptySubtitle}>
								Enter a code above to get started.
							</Text>
						</View>
					) : (
						<View style={styles.loadingState}>
							<ActivityIndicator size="large" color="#19543B" />
						</View>
					)
				}
			/>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: "#F3F5EF" },
	listContent: { padding: 20, paddingBottom: 40 },
	heroCard: {
		backgroundColor: "#103E2B",
		borderRadius: 30,
		padding: 22,
	},
	heroIconWrap: {
		width: 64,
		height: 64,
		borderRadius: 20,
		backgroundColor: "#DDF3E7",
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 16,
	},
	kicker: {
		fontSize: 12,
		fontWeight: "700",
		letterSpacing: 1.5,
		textTransform: "uppercase",
		color: "#A6E4C3",
	},
	heroTitle: {
		fontSize: 28,
		fontWeight: "800",
		lineHeight: 33,
		letterSpacing: -0.8,
		color: "#FFFFFF",
		marginTop: 10,
	},
	heroSubtitle: {
		fontSize: 14,
		lineHeight: 21,
		color: "#D6EFE1",
		marginTop: 10,
	},
	summaryRow: {
		flexDirection: "row",
		gap: 12,
		marginTop: 16,
	},
	summaryCard: {
		flex: 1,
		backgroundColor: "#FFFFFF",
		borderRadius: 22,
		padding: 18,
		borderWidth: 1,
		borderColor: "#E4E8DE",
	},
	summaryValue: { fontSize: 28, fontWeight: "800", color: "#142013" },
	summaryLabel: { fontSize: 13, color: "#667268", marginTop: 4 },
	redeemCard: {
		backgroundColor: "#FFFFFF",
		borderRadius: 24,
		padding: 18,
		marginTop: 16,
		borderWidth: 1,
		borderColor: "#E4E8DE",
	},
	redeemTitle: {
		fontSize: 18,
		fontWeight: "800",
		color: "#142013",
	},
	redeemSubtitle: {
		fontSize: 13,
		lineHeight: 19,
		color: "#667268",
		marginTop: 6,
		marginBottom: 12,
	},
	redeemRow: { flexDirection: "row", gap: 10 },
	redeemInput: {
		flex: 1,
		backgroundColor: "#F7F8F4",
		borderWidth: 1,
		borderColor: "#E4E8DE",
		borderRadius: 12,
		paddingHorizontal: 16,
		paddingVertical: 14,
		fontSize: 16,
		fontWeight: "700",
		color: "#142013",
		letterSpacing: 2,
	},
	redeemBtn: {
		backgroundColor: "#19543B",
		borderRadius: 12,
		paddingHorizontal: 24,
		justifyContent: "center",
	},
	redeemBtnDisabled: { opacity: 0.6 },
	redeemBtnText: { fontSize: 15, fontWeight: "800", color: "#FFFFFF" },
	sectionTitle: {
		fontSize: 16,
		fontWeight: "800",
		color: "#142013",
		paddingTop: 20,
		paddingBottom: 12,
	},
	promoCard: {
		backgroundColor: "#FFFFFF",
		borderRadius: 20,
		padding: 18,
		marginBottom: 12,
		borderWidth: 1,
		borderColor: "#E4E8DE",
	},
	promoExpired: { opacity: 0.7 },
	promoTop: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 8,
	},
	promoCodeBadge: {
		backgroundColor: "#ECF5EF",
		borderRadius: 999,
		paddingHorizontal: 12,
		paddingVertical: 6,
	},
	promoCodeBadgeExpired: { backgroundColor: "#EEF1EA" },
	promoCodeText: {
		fontSize: 14,
		fontWeight: "800",
		color: "#19543B",
		letterSpacing: 1,
	},
	statusPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
	activePill: { backgroundColor: "#DDF3E7" },
	expiredPill: { backgroundColor: "#EEF1EA" },
	statusPillText: {
		fontSize: 11,
		fontWeight: "800",
		textTransform: "uppercase",
		letterSpacing: 0.6,
	},
	expiredTag: { color: "#7A8579" },
	activeTag: { color: "#19543B" },
	promoDescription: {
		fontSize: 14,
		lineHeight: 20,
		color: "#374151",
		marginBottom: 10,
	},
	promoMeta: { flexDirection: "row", gap: 12, flexWrap: "wrap" },
	promoDiscount: { fontSize: 13, fontWeight: "800", color: "#19543B" },
	promoMax: { fontSize: 12, color: "#6B7280" },
	promoExpiry: { fontSize: 12, color: "#9CA3AF" },
	emptyState: {
		alignItems: "center",
		paddingTop: 36,
		paddingHorizontal: 24,
		paddingBottom: 20,
		backgroundColor: "#FFFFFF",
		borderRadius: 22,
		borderWidth: 1,
		borderColor: "#E4E8DE",
	},
	emptyIconWrap: {
		width: 60,
		height: 60,
		borderRadius: 20,
		backgroundColor: "#ECF5EF",
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 12,
	},
	emptyTitle: { fontSize: 18, fontWeight: "800", color: "#142013" },
	emptySubtitle: {
		fontSize: 14,
		lineHeight: 20,
		color: "#7A8579",
		marginTop: 4,
		textAlign: "center",
	},
	loadingState: { paddingTop: 40, alignItems: "center" },
});
