import React, { useEffect } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withTiming,
	withDelay,
	withSequence,
	withSpring,
	withRepeat,
	Easing,
	runOnJS,
	interpolate,
} from "react-native-reanimated";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface SplashScreenProps {
	onFinish: () => void;
	appName?: string;
	tagline?: string;
	accentColor?: string;
}

export default function SplashScreen({
	onFinish,
	appName = "RunAm",
	tagline = "Errands delivered, fast.",
	accentColor = "#2F8F4E",
}: SplashScreenProps) {
	// Animation values
	const roadProgress = useSharedValue(0);
	const riderX = useSharedValue(-100);
	const riderBounce = useSharedValue(0);
	const packageScale = useSharedValue(0);
	const packageRotate = useSharedValue(-15);
	const logoOpacity = useSharedValue(0);
	const logoScale = useSharedValue(0.3);
	const taglineOpacity = useSharedValue(0);
	const taglineY = useSharedValue(20);
	const dotOpacity1 = useSharedValue(0);
	const dotOpacity2 = useSharedValue(0);
	const dotOpacity3 = useSharedValue(0);
	const fadeOut = useSharedValue(1);
	const dustOpacity = useSharedValue(0);
	const wheelSpin = useSharedValue(0);

	useEffect(() => {
		// Road draws in
		roadProgress.value = withTiming(1, {
			duration: 600,
			easing: Easing.out(Easing.cubic),
		});

		// Rider zooms across
		riderX.value = withDelay(
			200,
			withTiming(SCREEN_WIDTH * 0.35, {
				duration: 800,
				easing: Easing.out(Easing.cubic),
			}),
		);

		// Rider bounce
		riderBounce.value = withDelay(
			200,
			withRepeat(
				withSequence(
					withTiming(-8, { duration: 200, easing: Easing.inOut(Easing.sin) }),
					withTiming(0, { duration: 200, easing: Easing.inOut(Easing.sin) }),
				),
				4,
				true,
			),
		);

		// Wheel spinning
		wheelSpin.value = withDelay(
			200,
			withRepeat(
				withTiming(360, { duration: 400, easing: Easing.linear }),
				5,
				false,
			),
		);

		// Dust trail
		dustOpacity.value = withDelay(
			300,
			withSequence(
				withTiming(0.6, { duration: 300 }),
				withDelay(600, withTiming(0, { duration: 300 })),
			),
		);

		// Package appears with bounce
		packageScale.value = withDelay(
			600,
			withSpring(1, { damping: 8, stiffness: 150 }),
		);
		packageRotate.value = withDelay(
			600,
			withSequence(
				withTiming(10, { duration: 150 }),
				withSpring(0, { damping: 8 }),
			),
		);

		// Logo fades in and scales up
		logoOpacity.value = withDelay(1000, withTiming(1, { duration: 500 }));
		logoScale.value = withDelay(
			1000,
			withSpring(1, { damping: 10, stiffness: 100 }),
		);

		// Tagline slides up
		taglineOpacity.value = withDelay(1300, withTiming(1, { duration: 400 }));
		taglineY.value = withDelay(1300, withSpring(0, { damping: 12 }));

		// Loading dots
		dotOpacity1.value = withDelay(
			1600,
			withRepeat(
				withSequence(
					withTiming(1, { duration: 300 }),
					withTiming(0.3, { duration: 300 }),
				),
				3,
				true,
			),
		);
		dotOpacity2.value = withDelay(
			1700,
			withRepeat(
				withSequence(
					withTiming(1, { duration: 300 }),
					withTiming(0.3, { duration: 300 }),
				),
				3,
				true,
			),
		);
		dotOpacity3.value = withDelay(
			1800,
			withRepeat(
				withSequence(
					withTiming(1, { duration: 300 }),
					withTiming(0.3, { duration: 300 }),
				),
				3,
				true,
			),
		);

		// Fade out everything
		fadeOut.value = withDelay(
			2800,
			withTiming(
				0,
				{ duration: 400, easing: Easing.in(Easing.cubic) },
				(finished) => {
					if (finished) {
						runOnJS(onFinish)();
					}
				},
			),
		);
	}, []);

	// Animated styles
	const roadStyle = useAnimatedStyle(() => ({
		transform: [{ scaleX: roadProgress.value }],
		opacity: roadProgress.value,
	}));

	const riderStyle = useAnimatedStyle(() => ({
		transform: [
			{ translateX: riderX.value },
			{ translateY: riderBounce.value },
		],
	}));

	const wheelStyle = useAnimatedStyle(() => ({
		transform: [{ rotate: `${wheelSpin.value}deg` }],
	}));

	const dustStyle = useAnimatedStyle(() => ({
		opacity: dustOpacity.value,
		transform: [{ translateX: riderX.value - 60 }],
	}));

	const packageStyle = useAnimatedStyle(() => ({
		transform: [
			{ scale: packageScale.value },
			{ rotate: `${packageRotate.value}deg` },
		],
	}));

	const logoStyle = useAnimatedStyle(() => ({
		opacity: logoOpacity.value,
		transform: [{ scale: logoScale.value }],
	}));

	const taglineStyle = useAnimatedStyle(() => ({
		opacity: taglineOpacity.value,
		transform: [{ translateY: taglineY.value }],
	}));

	const dot1Style = useAnimatedStyle(() => ({ opacity: dotOpacity1.value }));
	const dot2Style = useAnimatedStyle(() => ({ opacity: dotOpacity2.value }));
	const dot3Style = useAnimatedStyle(() => ({ opacity: dotOpacity3.value }));

	const containerStyle = useAnimatedStyle(() => ({
		opacity: fadeOut.value,
	}));

	return (
		<Animated.View
			style={[
				styles.container,
				{ backgroundColor: accentColor },
				containerStyle,
			]}>
			{/* Background decorative circles */}
			<View
				style={[
					styles.bgCircle,
					styles.bgCircle1,
					{ backgroundColor: "rgba(255,255,255,0.05)" },
				]}
			/>
			<View
				style={[
					styles.bgCircle,
					styles.bgCircle2,
					{ backgroundColor: "rgba(255,255,255,0.03)" },
				]}
			/>

			{/* Road */}
			<Animated.View style={[styles.roadContainer, roadStyle]}>
				<View style={styles.road} />
				<View style={styles.roadDashes}>
					{[...Array(8)].map((_, i) => (
						<View key={i} style={styles.roadDash} />
					))}
				</View>
			</Animated.View>

			{/* Dust trail */}
			<Animated.View style={[styles.dustContainer, dustStyle]}>
				<Text style={styles.dustText}>💨</Text>
			</Animated.View>

			{/* Rider on bike */}
			<Animated.View style={[styles.riderContainer, riderStyle]}>
				<View style={styles.riderBody}>
					{/* Package on back */}
					<Animated.View style={[styles.riderPackage, packageStyle]}>
						<Text style={styles.packageEmoji}>📦</Text>
					</Animated.View>
					{/* Rider */}
					<Text style={styles.riderEmoji}>🏍️</Text>
					{/* Wheels with rotation */}
					<Animated.View style={[styles.wheelIndicator, wheelStyle]}>
						<View style={styles.wheelDot} />
					</Animated.View>
				</View>
			</Animated.View>

			{/* App name */}
			<Animated.View style={[styles.logoContainer, logoStyle]}>
				<Text style={styles.logoText}>{appName}</Text>
			</Animated.View>

			{/* Tagline */}
			<Animated.View style={[styles.taglineContainer, taglineStyle]}>
				<Text style={styles.taglineText}>{tagline}</Text>
			</Animated.View>

			{/* Loading dots */}
			<View style={styles.dotsContainer}>
				<Animated.View style={[styles.dot, dot1Style]} />
				<Animated.View style={[styles.dot, dot2Style]} />
				<Animated.View style={[styles.dot, dot3Style]} />
			</View>
		</Animated.View>
	);
}

const styles = StyleSheet.create({
	container: {
		...StyleSheet.absoluteFillObject,
		justifyContent: "center",
		alignItems: "center",
		zIndex: 1000,
	},
	bgCircle: {
		position: "absolute",
		borderRadius: 9999,
	},
	bgCircle1: {
		width: SCREEN_WIDTH * 1.5,
		height: SCREEN_WIDTH * 1.5,
		top: -SCREEN_WIDTH * 0.5,
		right: -SCREEN_WIDTH * 0.3,
	},
	bgCircle2: {
		width: SCREEN_WIDTH * 1.2,
		height: SCREEN_WIDTH * 1.2,
		bottom: -SCREEN_WIDTH * 0.4,
		left: -SCREEN_WIDTH * 0.3,
	},
	roadContainer: {
		position: "absolute",
		bottom: SCREEN_HEIGHT * 0.35,
		width: SCREEN_WIDTH * 0.8,
		alignItems: "center",
	},
	road: {
		width: "100%",
		height: 4,
		backgroundColor: "rgba(255,255,255,0.2)",
		borderRadius: 2,
	},
	roadDashes: {
		flexDirection: "row",
		justifyContent: "space-between",
		width: "100%",
		position: "absolute",
		top: 1,
	},
	roadDash: {
		width: 16,
		height: 2,
		backgroundColor: "rgba(255,255,255,0.4)",
		borderRadius: 1,
	},
	dustContainer: {
		position: "absolute",
		bottom: SCREEN_HEIGHT * 0.35 - 15,
	},
	dustText: {
		fontSize: 20,
	},
	riderContainer: {
		position: "absolute",
		bottom: SCREEN_HEIGHT * 0.35 - 28,
	},
	riderBody: {
		alignItems: "center",
	},
	riderPackage: {
		position: "absolute",
		top: -20,
		right: -15,
		zIndex: 1,
	},
	packageEmoji: {
		fontSize: 22,
	},
	riderEmoji: {
		fontSize: 40,
	},
	wheelIndicator: {
		position: "absolute",
		bottom: -2,
		width: 8,
		height: 8,
		borderRadius: 4,
		borderWidth: 1,
		borderColor: "rgba(255,255,255,0.3)",
		justifyContent: "center",
		alignItems: "center",
	},
	wheelDot: {
		width: 2,
		height: 2,
		borderRadius: 1,
		backgroundColor: "rgba(255,255,255,0.5)",
	},
	logoContainer: {
		marginBottom: 8,
	},
	logoText: {
		fontSize: 48,
		fontWeight: "800",
		color: "#FFFFFF",
		letterSpacing: 2,
		textShadowColor: "rgba(0,0,0,0.15)",
		textShadowOffset: { width: 0, height: 2 },
		textShadowRadius: 8,
	},
	taglineContainer: {
		marginBottom: 40,
	},
	taglineText: {
		fontSize: 16,
		color: "rgba(255,255,255,0.85)",
		fontWeight: "500",
		letterSpacing: 0.5,
	},
	dotsContainer: {
		flexDirection: "row",
		gap: 8,
		position: "absolute",
		bottom: SCREEN_HEIGHT * 0.12,
	},
	dot: {
		width: 8,
		height: 8,
		borderRadius: 4,
		backgroundColor: "rgba(255,255,255,0.8)",
	},
});
