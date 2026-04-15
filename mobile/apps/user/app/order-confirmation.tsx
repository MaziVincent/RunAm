import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";

export default function OrderConfirmationScreen() {
	const router = useRouter();
	const params = useLocalSearchParams<{
		errandId: string;
		vendorName: string;
		total: string;
	}>();

	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<View style={styles.content}>
				<Text style={styles.icon}>🎉</Text>
				<Text style={styles.title}>Order Placed!</Text>
				<Text style={styles.subtitle}>
					Your order from {params.vendorName || "the vendor"} has been sent
					successfully.
				</Text>

				{params.total && (
					<View style={styles.totalCard}>
						<Text style={styles.totalLabel}>Total</Text>
						<Text style={styles.totalValue}>
							₦{Number(params.total).toLocaleString()}
						</Text>
					</View>
				)}

				<Text style={styles.infoText}>
					The vendor will confirm your order shortly. You'll receive a
					notification once it's being prepared.
				</Text>

				<View style={styles.actions}>
					<TouchableOpacity
						style={styles.primaryBtn}
						activeOpacity={0.8}
						onPress={() =>
							params.errandId
								? router.replace({
										pathname: "/errand/tracking",
										params: { id: params.errandId },
									})
								: router.replace("/(tabs)")
						}>
						<Text style={styles.primaryBtnText}>Track Order</Text>
					</TouchableOpacity>

					<TouchableOpacity
						style={styles.secondaryBtn}
						activeOpacity={0.7}
						onPress={() => router.replace("/(tabs)")}>
						<Text style={styles.secondaryBtnText}>Back to Home</Text>
					</TouchableOpacity>
				</View>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#FFFFFF",
	},
	content: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		padding: 32,
	},
	icon: {
		fontSize: 72,
		marginBottom: 24,
	},
	title: {
		fontSize: 26,
		fontWeight: "800",
		color: "#111827",
		marginBottom: 8,
	},
	subtitle: {
		fontSize: 16,
		color: "#6B7280",
		textAlign: "center",
		lineHeight: 24,
		marginBottom: 24,
	},
	totalCard: {
		backgroundColor: "#F0FDF4",
		borderRadius: 16,
		paddingHorizontal: 32,
		paddingVertical: 16,
		alignItems: "center",
		marginBottom: 24,
		borderWidth: 1,
		borderColor: "#BBF7D0",
	},
	totalLabel: {
		fontSize: 13,
		fontWeight: "600",
		color: "#16A34A",
		textTransform: "uppercase",
		letterSpacing: 0.5,
	},
	totalValue: {
		fontSize: 28,
		fontWeight: "800",
		color: "#15803D",
		marginTop: 4,
	},
	infoText: {
		fontSize: 14,
		color: "#9CA3AF",
		textAlign: "center",
		lineHeight: 20,
		marginBottom: 32,
	},
	actions: {
		width: "100%",
		gap: 12,
	},
	primaryBtn: {
		backgroundColor: "#2F8F4E",
		borderRadius: 16,
		paddingVertical: 16,
		alignItems: "center",
	},
	primaryBtnText: {
		fontSize: 16,
		fontWeight: "700",
		color: "#FFFFFF",
	},
	secondaryBtn: {
		backgroundColor: "#F3F4F6",
		borderRadius: 16,
		paddingVertical: 16,
		alignItems: "center",
	},
	secondaryBtnText: {
		fontSize: 16,
		fontWeight: "700",
		color: "#374151",
	},
});
