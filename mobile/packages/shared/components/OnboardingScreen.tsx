import React, { useRef, useState } from "react";
import {
	View,
	Text,
	StyleSheet,
	Dimensions,
	FlatList,
	TouchableOpacity,
	NativeSyntheticEvent,
	NativeScrollEvent,
	ViewToken,
} from "react-native";
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withSpring,
	withDelay,
	withTiming,
	withRepeat,
	withSequence,
	Easing,
	FadeIn,
	FadeInDown,
	FadeInUp,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export interface OnboardingSlide {
	id: string;
	emoji: string;
	secondaryEmojis?: string[];
	headline: string;
	description: string;
	backgroundColor: string;
}

interface OnboardingScreenProps {
	slides: OnboardingSlide[];
	onComplete: () => void;
	accentColor?: string;
}

// ---------- Animated illustration component ----------
function SlideIllustration({
	slide,
	isActive,
}: {
	slide: OnboardingSlide;
	isActive: boolean;
}) {
	const floatY = useSharedValue(0);
	const pulseScale = useSharedValue(1);

	React.useEffect(() => {
		if (isActive) {
			floatY.value = withRepeat(
				withSequence(
					withTiming(-12, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
					withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
				),
				-1,
				true,
			);
			pulseScale.value = withRepeat(
				withSequence(
					withTiming(1.05, {
						duration: 2000,
						easing: Easing.inOut(Easing.sin),
					}),
					withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
				),
				-1,
				true,
			);
		}
	}, [isActive]);

	const mainStyle = useAnimatedStyle(() => ({
		transform: [{ translateY: floatY.value }, { scale: pulseScale.value }],
	}));

	return (
		<View style={ilStyles.container}>
			{/* Background circle */}
			<View
				style={[
					ilStyles.bgCircle,
					{ backgroundColor: "rgba(255,255,255,0.1)" },
				]}
			/>
			<View
				style={[
					ilStyles.bgCircleInner,
					{ backgroundColor: "rgba(255,255,255,0.08)" },
				]}
			/>

			{/* Secondary emojis orbiting */}
			{slide.secondaryEmojis?.map((emoji, index) => {
				const angle = (index / slide.secondaryEmojis!.length) * Math.PI * 2;
				const radius = 90;
				const x = Math.cos(angle) * radius;
				const y = Math.sin(angle) * radius;
				return (
					<Animated.Text
						key={index}
						entering={FadeIn.delay(300 + index * 150).duration(500)}
						style={[
							ilStyles.secondaryEmoji,
							{
								transform: [{ translateX: x }, { translateY: y }],
							},
						]}>
						{emoji}
					</Animated.Text>
				);
			})}

			{/* Main emoji */}
			<Animated.View style={mainStyle}>
				<Text style={ilStyles.mainEmoji}>{slide.emoji}</Text>
			</Animated.View>
		</View>
	);
}

const ilStyles = StyleSheet.create({
	container: {
		width: 220,
		height: 220,
		justifyContent: "center",
		alignItems: "center",
	},
	bgCircle: {
		position: "absolute",
		width: 200,
		height: 200,
		borderRadius: 100,
	},
	bgCircleInner: {
		position: "absolute",
		width: 150,
		height: 150,
		borderRadius: 75,
	},
	mainEmoji: {
		fontSize: 80,
	},
	secondaryEmoji: {
		position: "absolute",
		fontSize: 32,
	},
});

// ---------- Dot indicator ----------
function DotIndicator({
	count,
	activeIndex,
	accentColor,
}: {
	count: number;
	activeIndex: number;
	accentColor: string;
}) {
	return (
		<View style={dotStyles.container}>
			{Array.from({ length: count }).map((_, i) => {
				const isActive = i === activeIndex;
				return (
					<View
						key={i}
						style={[
							dotStyles.dot,
							{
								backgroundColor: isActive ? accentColor : "rgba(0,0,0,0.15)",
								width: isActive ? 28 : 8,
							},
						]}
					/>
				);
			})}
		</View>
	);
}

const dotStyles = StyleSheet.create({
	container: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 8,
	},
	dot: {
		height: 8,
		borderRadius: 4,
	},
});

// ---------- Main onboarding screen ----------
export default function OnboardingScreen({
	slides,
	onComplete,
	accentColor = "#2F8F4E",
}: OnboardingScreenProps) {
	const insets = useSafeAreaInsets();
	const [activeIndex, setActiveIndex] = useState(0);
	const flatListRef = useRef<FlatList>(null);
	const isLastSlide = activeIndex === slides.length - 1;

	const onViewableItemsChanged = useRef(
		({ viewableItems }: { viewableItems: ViewToken[] }) => {
			if (viewableItems.length > 0 && viewableItems[0].index != null) {
				setActiveIndex(viewableItems[0].index);
			}
		},
	).current;

	const viewabilityConfig = useRef({
		viewAreaCoveragePercentThreshold: 50,
	}).current;

	const handleNext = () => {
		if (isLastSlide) {
			onComplete();
		} else {
			flatListRef.current?.scrollToIndex({
				index: activeIndex + 1,
				animated: true,
			});
		}
	};

	const handleSkip = () => {
		onComplete();
	};

	const renderSlide = ({
		item,
		index,
	}: {
		item: OnboardingSlide;
		index: number;
	}) => (
		<View style={[styles.slide, { width: SCREEN_WIDTH }]}>
			{/* Illustration area */}
			<View
				style={[
					styles.illustrationArea,
					{ backgroundColor: item.backgroundColor },
				]}>
				<SlideIllustration slide={item} isActive={index === activeIndex} />
			</View>

			{/* Content area */}
			<View style={styles.contentArea}>
				<Text style={styles.headline}>{item.headline}</Text>
				<Text style={styles.description}>{item.description}</Text>
			</View>
		</View>
	);

	return (
		<View
			style={[
				styles.container,
				{ paddingTop: insets.top, paddingBottom: insets.bottom },
			]}>
			{/* Skip button */}
			{!isLastSlide && (
				<TouchableOpacity
					style={[styles.skipButton, { top: insets.top + 8 }]}
					onPress={handleSkip}>
					<Text style={styles.skipText}>Skip</Text>
				</TouchableOpacity>
			)}

			{/* Slides */}
			<FlatList
				ref={flatListRef}
				data={slides}
				renderItem={renderSlide}
				keyExtractor={(item) => item.id}
				horizontal
				pagingEnabled
				showsHorizontalScrollIndicator={false}
				bounces={false}
				onViewableItemsChanged={onViewableItemsChanged}
				viewabilityConfig={viewabilityConfig}
			/>

			{/* Bottom section */}
			<View style={styles.bottomSection}>
				{/* Dot indicator */}
				<DotIndicator
					count={slides.length}
					activeIndex={activeIndex}
					accentColor={accentColor}
				/>

				{/* Action button */}
				<TouchableOpacity
					style={[styles.actionButton, { backgroundColor: accentColor }]}
					onPress={handleNext}
					activeOpacity={0.85}>
					<Text style={styles.actionButtonText}>
						{isLastSlide ? "Get Started" : "Continue"}
					</Text>
				</TouchableOpacity>

				{/* Swipe hint */}
				{!isLastSlide && (
					<Text style={styles.swipeHint}>Swipe to explore →</Text>
				)}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#FFFFFF",
	},
	skipButton: {
		position: "absolute",
		right: 20,
		zIndex: 10,
		paddingHorizontal: 16,
		paddingVertical: 8,
	},
	skipText: {
		fontSize: 16,
		color: "#6B7280",
		fontWeight: "600",
	},
	slide: {
		flex: 1,
	},
	illustrationArea: {
		flex: 1.1,
		justifyContent: "center",
		alignItems: "center",
		borderBottomLeftRadius: 32,
		borderBottomRightRadius: 32,
	},
	contentArea: {
		flex: 0.5,
		paddingHorizontal: 32,
		paddingTop: 32,
		alignItems: "center",
	},
	headline: {
		fontSize: 26,
		fontWeight: "800",
		color: "#111827",
		textAlign: "center",
		marginBottom: 12,
		letterSpacing: -0.5,
	},
	description: {
		fontSize: 16,
		color: "#6B7280",
		textAlign: "center",
		lineHeight: 24,
		maxWidth: 300,
	},
	bottomSection: {
		paddingHorizontal: 32,
		paddingBottom: 20,
		gap: 20,
		alignItems: "center",
	},
	actionButton: {
		width: "100%",
		paddingVertical: 16,
		borderRadius: 16,
		alignItems: "center",
		shadowColor: "#2F8F4E",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.3,
		shadowRadius: 8,
		elevation: 4,
	},
	actionButtonText: {
		fontSize: 18,
		fontWeight: "700",
		color: "#FFFFFF",
		letterSpacing: 0.3,
	},
	swipeHint: {
		fontSize: 13,
		color: "#9CA3AF",
		fontWeight: "500",
	},
});
