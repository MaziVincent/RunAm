import { useRef, useState } from "react";
import {
	Dimensions,
	FlatList,
	NativeScrollEvent,
	NativeSyntheticEvent,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useOnboardingStore } from "@runam/shared/stores/onboarding-store";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type OnboardingCard = {
	title: string;
	icon: keyof typeof Ionicons.glyphMap;
};

type OnboardingSlide = {
	id: string;
	kicker: string;
	title: string;
	description: string;
	backgroundColor: string;
	accentColor: string;
	cards: OnboardingCard[];
};

const slides: OnboardingSlide[] = [
	{
		id: "delivery",
		kicker: "Deliveries",
		title: "Send fast, shop nearby, and stay on top of every move.",
		description:
			"RunAm now separates logistics from marketplace shopping so the first choice is clearer and every next step is easier.",
		backgroundColor: "#103E2B",
		accentColor: "#DDF3E7",
		cards: [
			{ title: "Send a package", icon: "send-outline" as const },
			{ title: "Explore shops", icon: "storefront-outline" as const },
			{ title: "Track live", icon: "navigate-outline" as const },
		],
	},
	{
		id: "orders",
		kicker: "Clarity",
		title: "Orders, wallet, and notifications now behave like one system.",
		description:
			"Payments, live tracking, and alerts all route into the screen that actually matters instead of leaving you at dead ends.",
		backgroundColor: "#19543B",
		accentColor: "#E9F5EE",
		cards: [
			{ title: "Wallet in account", icon: "wallet-outline" as const },
			{ title: "Actionable alerts", icon: "notifications-outline" as const },
			{ title: "Live order hub", icon: "receipt-outline" as const },
		],
	},
	{
		id: "ready",
		kicker: "Get started",
		title: "Create your account once and keep every delivery flow connected.",
		description:
			"Save addresses, move faster through checkout, and return to your account whenever you need orders, support, or wallet funding.",
		backgroundColor: "#F3F5EF",
		accentColor: "#19543B",
		cards: [
			{ title: "Saved addresses", icon: "location-outline" as const },
			{ title: "Cleaner checkout", icon: "card-outline" as const },
			{ title: "Account hub", icon: "person-outline" as const },
		],
	},
];

export default function UserOnboarding() {
	const flatListRef = useRef<FlatList<OnboardingSlide>>(null);
	const router = useRouter();
	const { completeOnboarding } = useOnboardingStore();
	const [activeIndex, setActiveIndex] = useState(0);

	const isLastSlide = activeIndex === slides.length - 1;

	const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
		const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
		setActiveIndex(index);
	};

	const finishOnboarding = async () => {
		await completeOnboarding();
		router.replace("/(auth)/register" as any);
	};

	const handleNext = async () => {
		if (isLastSlide) {
			await finishOnboarding();
			return;
		}

		flatListRef.current?.scrollToIndex({
			index: activeIndex + 1,
			animated: true,
		});
	};

	return (
		<SafeAreaView style={styles.container} edges={["top", "bottom"]}>
			<View style={styles.topBar}>
				<Text style={styles.brand}>RunAm</Text>
				{!isLastSlide ? (
					<TouchableOpacity
						onPress={() => void finishOnboarding()}
						activeOpacity={0.8}>
						<Text style={styles.skipText}>Skip</Text>
					</TouchableOpacity>
				) : (
					<View style={styles.skipSpacer} />
				)}
			</View>

			<FlatList<OnboardingSlide>
				ref={flatListRef}
				data={slides}
				horizontal
				pagingEnabled
				showsHorizontalScrollIndicator={false}
				keyExtractor={(item) => item.id}
				onMomentumScrollEnd={handleScrollEnd}
				renderItem={({ item, index }) => (
					<View style={[styles.slide, { width: SCREEN_WIDTH }]}>
						<View
							style={[
								styles.visualPanel,
								{ backgroundColor: item.backgroundColor },
								index === slides.length - 1 && styles.visualPanelLight,
							]}>
							<View
								style={[
									styles.visualOrbLarge,
									{
										backgroundColor:
											index === slides.length - 1
												? "#DDF3E7"
												: "rgba(255,255,255,0.12)",
									},
								]}
							/>
							<View
								style={[
									styles.visualOrbSmall,
									{
										backgroundColor:
											index === slides.length - 1
												? "#EDF2EA"
												: "rgba(255,255,255,0.08)",
									},
								]}
							/>
							<View style={styles.cardStack}>
								{item.cards.map((card, cardIndex) => (
									<View
										key={card.title}
										style={[
											styles.visualCard,
											cardIndex === 1 && styles.visualCardRaised,
											index === slides.length - 1 && styles.visualCardLight,
										]}>
										<Ionicons
											name={card.icon}
											size={22}
											color={item.accentColor}
										/>
										<Text
											style={[
												styles.visualCardText,
												index === slides.length - 1 &&
													styles.visualCardTextDark,
											]}>
											{card.title}
										</Text>
									</View>
								))}
							</View>
						</View>

						<View style={styles.copyPanel}>
							<Text style={styles.kicker}>{item.kicker}</Text>
							<Text style={styles.title}>{item.title}</Text>
							<Text style={styles.description}>{item.description}</Text>
						</View>
					</View>
				)}
			/>

			<View style={styles.bottomBar}>
				<View style={styles.dotsRow}>
					{slides.map((slide, index) => (
						<View
							key={slide.id}
							style={[styles.dot, activeIndex === index && styles.dotActive]}
						/>
					))}
				</View>
				<TouchableOpacity
					style={styles.primaryButton}
					onPress={() => void handleNext()}
					activeOpacity={0.85}>
					<Text style={styles.primaryButtonText}>
						{isLastSlide ? "Create account" : "Continue"}
					</Text>
				</TouchableOpacity>
				<Text style={styles.bottomHint}>
					{isLastSlide
						? "You can log in instead if you already have an account."
						: "Swipe horizontally to explore the flow."}
				</Text>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#F3F5EF",
	},
	topBar: {
		paddingHorizontal: 20,
		paddingTop: 8,
		paddingBottom: 10,
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	brand: {
		fontSize: 24,
		fontWeight: "800",
		color: "#142013",
		letterSpacing: -0.6,
	},
	skipText: {
		fontSize: 14,
		fontWeight: "800",
		color: "#19543B",
		textTransform: "uppercase",
		letterSpacing: 0.6,
	},
	skipSpacer: {
		width: 48,
	},
	slide: {
		paddingHorizontal: 20,
	},
	visualPanel: {
		height: 360,
		borderRadius: 34,
		padding: 24,
		overflow: "hidden",
		justifyContent: "center",
	},
	visualPanelLight: {
		borderWidth: 1,
		borderColor: "#E4E8DE",
	},
	visualOrbLarge: {
		position: "absolute",
		width: 240,
		height: 240,
		borderRadius: 120,
		top: -40,
		right: -20,
	},
	visualOrbSmall: {
		position: "absolute",
		width: 160,
		height: 160,
		borderRadius: 80,
		bottom: -30,
		left: -20,
	},
	cardStack: {
		gap: 14,
	},
	visualCard: {
		backgroundColor: "rgba(255,255,255,0.12)",
		borderRadius: 22,
		padding: 16,
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
	},
	visualCardRaised: {
		marginLeft: 22,
		marginRight: 10,
	},
	visualCardLight: {
		backgroundColor: "#FFFFFF",
		borderWidth: 1,
		borderColor: "#E4E8DE",
	},
	visualCardText: {
		fontSize: 16,
		fontWeight: "800",
		color: "#FFFFFF",
	},
	visualCardTextDark: {
		color: "#142013",
	},
	copyPanel: {
		paddingTop: 28,
		paddingHorizontal: 8,
	},
	kicker: {
		fontSize: 12,
		fontWeight: "700",
		letterSpacing: 1.6,
		textTransform: "uppercase",
		color: "#7A8579",
		marginBottom: 8,
	},
	title: {
		fontSize: 31,
		fontWeight: "800",
		lineHeight: 36,
		letterSpacing: -1,
		color: "#142013",
	},
	description: {
		fontSize: 15,
		lineHeight: 22,
		color: "#5F6D61",
		marginTop: 12,
	},
	bottomBar: {
		paddingHorizontal: 20,
		paddingTop: 18,
		paddingBottom: 20,
		alignItems: "center",
		gap: 18,
	},
	dotsRow: {
		flexDirection: "row",
		gap: 8,
	},
	dot: {
		width: 8,
		height: 8,
		borderRadius: 4,
		backgroundColor: "#C7D0C2",
	},
	dotActive: {
		width: 28,
		backgroundColor: "#19543B",
	},
	primaryButton: {
		width: "100%",
		backgroundColor: "#19543B",
		borderRadius: 20,
		paddingVertical: 17,
		alignItems: "center",
	},
	primaryButtonText: {
		fontSize: 16,
		fontWeight: "800",
		color: "#FFFFFF",
	},
	bottomHint: {
		fontSize: 13,
		color: "#7A8579",
		textAlign: "center",
	},
});
