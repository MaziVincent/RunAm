import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import BackHeader from "./components/BackHeader";
import HeroCard from "./components/HeroCard";
import SectionCard from "./components/SectionCard";

const supportActions = [
	{
		title: "Track an order",
		description:
			"Open live tracking, delivery updates, and completed orders first.",
		icon: "receipt-outline" as const,
		route: "/(tabs)/activity",
		action: "Open orders",
	},
	{
		title: "Wallet and payments",
		description:
			"Check balance, transfer details, or payment status without leaving the app.",
		icon: "wallet-outline" as const,
		route: "/(tabs)/wallet",
		action: "Open wallet",
	},
	{
		title: "Saved addresses",
		description:
			"Update delivery locations before your next checkout or repeat order.",
		icon: "location-outline" as const,
		route: "/settings/addresses",
		action: "Manage addresses",
	},
	{
		title: "Notifications",
		description:
			"Review grouped alerts and jump straight into the exact flow that needs attention.",
		icon: "notifications-outline" as const,
		route: "/notifications",
		action: "Open inbox",
	},
];

export default function SupportScreen() {
	const router = useRouter();

	return (
		<SafeAreaView style={styles.container} edges={["top", "bottom"]}>
			<BackHeader title="Support" onBack={() => router.back()} />

			<HeroCard
				kicker="Support"
				title="Start with the flow that already resolves the issue."
				subtitle="RunAm support now works like a help hub: it routes you to tracking, wallet, address, and notification surfaces that already contain the useful state for most issues."
				style={styles.heroCard}>
				<View style={styles.heroBadge}>
					<Ionicons name="headset-outline" size={28} color="#19543B" />
				</View>
			</HeroCard>

			<View style={styles.section}>
				{supportActions.map((option) => (
					<SectionCard key={option.title} style={styles.optionCard}>
						<View style={styles.optionTopRow}>
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
							style={styles.secondaryButton}
							onPress={() => router.push(option.route as any)}
							activeOpacity={0.85}>
							<Text style={styles.secondaryButtonText}>{option.action}</Text>
							<Ionicons name="arrow-forward" size={16} color="#19543B" />
						</TouchableOpacity>
					</SectionCard>
				))}
			</View>

			<SectionCard style={styles.footerCard}>
				<Text style={styles.footerTitle}>When live chat arrives</Text>
				<Text style={styles.footerText}>
					This screen will attach support conversations to the right order or
					payment context. Until then, starting from the flow above keeps the
					issue grounded in the data you already have.
				</Text>
			</SectionCard>
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
	heroBadge: {
		width: 64,
		height: 64,
		borderRadius: 20,
		backgroundColor: "#DDF3E7",
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 16,
	},
	section: {
		marginTop: 16,
		gap: 12,
	},
	optionCard: {
		gap: 14,
	},
	optionTopRow: {
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
	footerCard: {
		marginTop: 16,
	},
	footerTitle: {
		fontSize: 18,
		fontWeight: "800",
		color: "#142013",
	},
	footerText: {
		fontSize: 14,
		lineHeight: 21,
		color: "#667268",
		marginTop: 8,
	},
});
