import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import BackHeader from "../components/BackHeader";
import HeroCard from "../components/HeroCard";
import SectionCard from "../components/SectionCard";

const paymentOptions = [
	{
		title: "Wallet balance",
		description:
			"Use your existing wallet balance for the fastest checkout confirmation.",
		icon: "wallet-outline" as const,
		action: "Open wallet",
		route: "/(tabs)/wallet",
	},
	{
		title: "Card at checkout",
		description:
			"Card payment stays available during order placement in a secure browser checkout.",
		icon: "card-outline" as const,
		action: "Start an order",
		route: "/(tabs)/services",
	},
	{
		title: "Bank transfer funding",
		description:
			"Top up your wallet through the reserved bank account and reuse the balance later.",
		icon: "cash-outline" as const,
		action: "See transfer details",
		route: "/(tabs)/wallet",
	},
];

export default function PaymentMethodsScreen() {
	const router = useRouter();

	return (
		<SafeAreaView style={styles.container} edges={["top", "bottom"]}>
			<BackHeader title="Payment methods" onBack={() => router.back()} />

			<HeroCard
				kicker="Payments"
				title="Choose the payment path that already works today."
				subtitle="Saved cards are still disabled, but wallet payments, card checkout during ordering, and wallet funding by transfer are all live from the right entry points."
				style={styles.heroCard}
			/>

			<View style={styles.section}>
				{paymentOptions.map((option) => (
					<SectionCard key={option.title} style={styles.optionCard}>
						<View style={styles.optionRow}>
							<View style={styles.optionIconWrap}>
								<Ionicons name={option.icon} size={20} color="#19543B" />
							</View>
							<View style={styles.optionCopy}>
								<Text style={styles.optionTitle}>{option.title}</Text>
								<Text style={styles.optionDescription}>
									{option.description}
								</Text>
							</View>
						</View>
						<TouchableOpacity
							style={styles.primaryButton}
							onPress={() => router.push(option.route as any)}
							activeOpacity={0.85}>
							<Text style={styles.primaryButtonText}>{option.action}</Text>
						</TouchableOpacity>
					</SectionCard>
				))}
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#F3F5EF",
		paddingHorizontal: 20,
	},
	heroCard: {
		marginTop: 8,
	},
	section: {
		marginTop: 16,
		gap: 12,
	},
	optionCard: {
		gap: 14,
	},
	optionRow: {
		flexDirection: "row",
		alignItems: "flex-start",
		gap: 12,
	},
	optionIconWrap: {
		width: 42,
		height: 42,
		borderRadius: 14,
		backgroundColor: "#ECF5EF",
		alignItems: "center",
		justifyContent: "center",
	},
	optionCopy: {
		flex: 1,
	},
	optionTitle: {
		fontSize: 16,
		fontWeight: "800",
		color: "#142013",
	},
	optionDescription: {
		fontSize: 13,
		lineHeight: 20,
		color: "#667268",
		marginTop: 6,
	},
	primaryButton: {
		backgroundColor: "#19543B",
		borderRadius: 16,
		paddingVertical: 14,
		alignItems: "center",
	},
	primaryButtonText: {
		fontSize: 14,
		fontWeight: "800",
		color: "#FFFFFF",
	},
});
