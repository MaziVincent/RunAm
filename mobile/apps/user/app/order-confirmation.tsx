import { useEffect, useMemo, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	Linking,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { getErrandPaymentStatus } from "@runam/shared/api/payments";

function formatCurrency(value: string): string {
	return `₦${Number(value || 0).toLocaleString()}`;
}

export default function OrderConfirmationScreen() {
	const router = useRouter();
	const params = useLocalSearchParams<{
		errandId: string;
		vendorName: string;
		total: string;
		checkoutUrl?: string;
		paymentPending?: string;
	}>();
	const [isOpeningCheckout, setIsOpeningCheckout] = useState(false);
	const checkoutUrl =
		typeof params.checkoutUrl === "string" ? params.checkoutUrl : undefined;
	const initialPending = params.paymentPending === "true";

	const {
		data: payment,
		isFetching,
		refetch,
	} = useQuery({
		queryKey: ["payments", "errand-status", params.errandId],
		queryFn: () => getErrandPaymentStatus(params.errandId),
		enabled: Boolean(params.errandId),
		refetchInterval: checkoutUrl ? 10000 : false,
	});

	const paymentCompleted = payment?.status === 1;
	const paymentFailed = payment?.status === 2;
	const paymentPending = useMemo(() => {
		if (paymentCompleted) {
			return false;
		}
		if (payment?.status === 0) {
			return true;
		}
		return initialPending;
	}, [initialPending, payment?.status, paymentCompleted]);

	useEffect(() => {
		if (!checkoutUrl || !initialPending) {
			return;
		}

		let cancelled = false;

		const openCheckout = async () => {
			setIsOpeningCheckout(true);
			try {
				await Linking.openURL(checkoutUrl);
			} catch {
				if (!cancelled) {
					Alert.alert(
						"Open payment",
						"We couldn't open the payment page automatically. Use the button below to continue.",
					);
				}
			} finally {
				if (!cancelled) {
					setIsOpeningCheckout(false);
				}
			}
		};

		void openCheckout();

		return () => {
			cancelled = true;
		};
	}, [checkoutUrl, initialPending]);

	const handleOpenCheckout = async () => {
		if (!checkoutUrl) {
			return;
		}

		setIsOpeningCheckout(true);
		try {
			await Linking.openURL(checkoutUrl);
		} catch {
			Alert.alert(
				"Open payment",
				"We couldn't open the payment page. Please try again.",
			);
		} finally {
			setIsOpeningCheckout(false);
		}
	};

	const heading = paymentPending
		? "Finish payment to confirm this order."
		: "Your order has been placed.";
	const body = paymentPending
		? `Your order from ${params.vendorName || "the vendor"} is waiting for payment confirmation.`
		: `Your order from ${params.vendorName || "the vendor"} is now in the RunAm flow.`;

	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<ScrollView
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}>
				<View style={styles.heroCard}>
					<View
						style={[
							styles.heroIconWrap,
							paymentPending ? styles.heroIconPending : styles.heroIconSuccess,
						]}>
						<Ionicons
							name={paymentPending ? "time-outline" : "checkmark-done-outline"}
							size={30}
							color={paymentPending ? "#9A6700" : "#19543B"}
						/>
					</View>
					<Text style={styles.kicker}>Order confirmation</Text>
					<Text style={styles.title}>{heading}</Text>
					<Text style={styles.subtitle}>{body}</Text>
				</View>

				<View style={styles.totalCard}>
					<Text style={styles.totalLabel}>Order total</Text>
					<Text style={styles.totalValue}>
						{formatCurrency(params.total || "0")}
					</Text>
					<Text style={styles.totalMeta}>{params.vendorName || "Vendor"}</Text>
				</View>

				<View style={styles.infoCard}>
					<Text style={styles.sectionTitle}>
						{paymentPending ? "What happens next" : "Next step"}
					</Text>
					<Text style={styles.infoText}>
						{paymentPending
							? "Complete the secure browser checkout, then return here to refresh payment status or move into tracking once payment is confirmed."
							: "Track the order live once the vendor confirms it. Status updates will appear in Orders and Notifications."}
					</Text>
				</View>

				{paymentPending ? (
					<View style={styles.statusCard}>
						<View style={styles.statusHeader}>
							<Text style={styles.sectionTitle}>Payment status</Text>
							{isFetching ? (
								<ActivityIndicator size="small" color="#19543B" />
							) : null}
						</View>
						<View style={styles.statusPillRow}>
							<View
								style={[
									styles.statusPill,
									paymentCompleted
										? styles.statusPaid
										: paymentFailed
											? styles.statusFailed
											: styles.statusPending,
								]}>
								<Text
									style={[
										styles.statusPillText,
										paymentCompleted
											? styles.statusPaidText
											: paymentFailed
												? styles.statusFailedText
												: styles.statusPendingText,
									]}>
									{paymentCompleted
										? "Paid"
										: paymentFailed
											? "Failed"
											: "Pending"}
								</Text>
							</View>
						</View>
					</View>
				) : null}

				<View style={styles.actionList}>
					{paymentPending && checkoutUrl ? (
						<TouchableOpacity
							style={styles.primaryButton}
							onPress={handleOpenCheckout}
							activeOpacity={0.85}>
							<Text style={styles.primaryButtonText}>
								{isOpeningCheckout ? "Opening checkout..." : "Complete payment"}
							</Text>
						</TouchableOpacity>
					) : null}

					{paymentPending ? (
						<TouchableOpacity
							style={styles.secondaryButton}
							onPress={() => void refetch()}
							activeOpacity={0.85}>
							<Text style={styles.secondaryButtonText}>
								Refresh payment status
							</Text>
						</TouchableOpacity>
					) : (
						<TouchableOpacity
							style={styles.primaryButton}
							onPress={() =>
								params.errandId
									? router.replace({
											pathname: "/errand/tracking",
											params: { id: params.errandId },
										})
									: router.replace("/(tabs)" as any)
							}
							activeOpacity={0.85}>
							<Text style={styles.primaryButtonText}>Track order</Text>
						</TouchableOpacity>
					)}

					<TouchableOpacity
						style={paymentPending ? styles.ghostButton : styles.secondaryButton}
						onPress={() => router.replace("/(tabs)" as any)}
						activeOpacity={0.85}>
						<Text
							style={
								paymentPending
									? styles.ghostButtonText
									: styles.secondaryButtonText
							}>
							Back to home
						</Text>
					</TouchableOpacity>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: "#F3F5EF" },
	content: { padding: 20, paddingBottom: 32 },
	heroCard: {
		backgroundColor: "#103E2B",
		borderRadius: 30,
		padding: 22,
		alignItems: "center",
	},
	heroIconWrap: {
		width: 72,
		height: 72,
		borderRadius: 24,
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 18,
	},
	heroIconPending: { backgroundColor: "#FFF0CC" },
	heroIconSuccess: { backgroundColor: "#DDF3E7" },
	kicker: {
		fontSize: 12,
		fontWeight: "700",
		letterSpacing: 1.6,
		textTransform: "uppercase",
		color: "#A6E4C3",
		marginBottom: 8,
	},
	title: {
		fontSize: 28,
		fontWeight: "800",
		lineHeight: 33,
		letterSpacing: -0.8,
		color: "#FFFFFF",
		textAlign: "center",
	},
	subtitle: {
		fontSize: 14,
		lineHeight: 21,
		color: "#D6EFE1",
		marginTop: 10,
		textAlign: "center",
	},
	totalCard: {
		backgroundColor: "#FFFFFF",
		borderRadius: 24,
		padding: 20,
		marginTop: 16,
		alignItems: "center",
		borderWidth: 1,
		borderColor: "#E4E8DE",
	},
	totalLabel: {
		fontSize: 12,
		fontWeight: "700",
		textTransform: "uppercase",
		letterSpacing: 1,
		color: "#7A8579",
	},
	totalValue: {
		fontSize: 30,
		fontWeight: "800",
		color: "#142013",
		marginTop: 6,
	},
	totalMeta: {
		fontSize: 13,
		color: "#667268",
		marginTop: 6,
	},
	infoCard: {
		backgroundColor: "#FFFFFF",
		borderRadius: 24,
		padding: 18,
		marginTop: 14,
		borderWidth: 1,
		borderColor: "#E4E8DE",
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: "800",
		color: "#142013",
	},
	infoText: {
		fontSize: 14,
		lineHeight: 20,
		color: "#667268",
		marginTop: 8,
	},
	statusCard: {
		backgroundColor: "#FFFFFF",
		borderRadius: 24,
		padding: 18,
		marginTop: 14,
		borderWidth: 1,
		borderColor: "#E4E8DE",
	},
	statusHeader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: 12,
	},
	statusPillRow: { marginTop: 12 },
	statusPill: {
		alignSelf: "flex-start",
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 999,
	},
	statusPending: { backgroundColor: "#FFF0CC" },
	statusPaid: { backgroundColor: "#DDF3E7" },
	statusFailed: { backgroundColor: "#FDE7E6" },
	statusPillText: {
		fontSize: 12,
		fontWeight: "800",
		textTransform: "uppercase",
		letterSpacing: 0.6,
	},
	statusPendingText: { color: "#9A6700" },
	statusPaidText: { color: "#19543B" },
	statusFailedText: { color: "#C93C37" },
	actionList: { marginTop: 18, gap: 12 },
	primaryButton: {
		backgroundColor: "#19543B",
		borderRadius: 18,
		paddingVertical: 16,
		alignItems: "center",
	},
	primaryButtonText: { fontSize: 16, fontWeight: "800", color: "#FFFFFF" },
	secondaryButton: {
		backgroundColor: "#FFFFFF",
		borderRadius: 18,
		paddingVertical: 16,
		alignItems: "center",
		borderWidth: 1,
		borderColor: "#D1D5DB",
	},
	secondaryButtonText: { fontSize: 15, fontWeight: "800", color: "#19543B" },
	ghostButton: {
		backgroundColor: "transparent",
		borderRadius: 18,
		paddingVertical: 16,
		alignItems: "center",
		borderWidth: 1,
		borderColor: "#D1D5DB",
	},
	ghostButtonText: { fontSize: 15, fontWeight: "800", color: "#374151" },
});
