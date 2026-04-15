import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
	Easing,
	runOnJS,
	useAnimatedStyle,
	useSharedValue,
	withDelay,
	withRepeat,
	withSequence,
	withSpring,
	withTiming,
} from "react-native-reanimated";

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
	const badgeScale = useSharedValue(0.78);
	const badgeOpacity = useSharedValue(0);
	const ringScale = useSharedValue(0.86);
	const ringOpacity = useSharedValue(0);
	const titleOpacity = useSharedValue(0);
	const titleY = useSharedValue(18);
	const routeProgress = useSharedValue(0);
	const chipOffset = useSharedValue(24);
	const chipOpacity = useSharedValue(0);
	const pulse = useSharedValue(1);
	const fadeOut = useSharedValue(1);

	useEffect(() => {
		badgeOpacity.value = withTiming(1, { duration: 260 });
		badgeScale.value = withSpring(1, { damping: 11, stiffness: 120 });
		ringOpacity.value = withDelay(80, withTiming(1, { duration: 300 }));
		ringScale.value = withDelay(80, withTiming(1, { duration: 520 }));
		titleOpacity.value = withDelay(180, withTiming(1, { duration: 280 }));
		titleY.value = withDelay(
			180,
			withSpring(0, { damping: 14, stiffness: 120 }),
		);
		routeProgress.value = withDelay(
			260,
			withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) }),
		);
		chipOpacity.value = withDelay(420, withTiming(1, { duration: 280 }));
		chipOffset.value = withDelay(
			420,
			withSpring(0, { damping: 16, stiffness: 120 }),
		);
		pulse.value = withDelay(
			700,
			withRepeat(
				withSequence(
					withTiming(1.04, {
						duration: 700,
						easing: Easing.inOut(Easing.sin),
					}),
					withTiming(1, {
						duration: 700,
						easing: Easing.inOut(Easing.sin),
					}),
				),
				2,
				true,
			),
		);

		fadeOut.value = withDelay(
			2400,
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
	}, [badgeOpacity, badgeScale, chipOffset, chipOpacity, fadeOut, onFinish, pulse, ringOpacity, ringScale, routeProgress, titleOpacity, titleY]);

	const badgeStyle = useAnimatedStyle(() => ({
		opacity: badgeOpacity.value,
		transform: [{ scale: badgeScale.value * pulse.value }],
	}));

	const ringStyle = useAnimatedStyle(() => ({
		opacity: ringOpacity.value,
		transform: [{ scale: ringScale.value }],
	}));

	const titleStyle = useAnimatedStyle(() => ({
		opacity: titleOpacity.value,
		transform: [{ translateY: titleY.value }],
	}));

	const routeStyle = useAnimatedStyle(() => ({
		opacity: routeProgress.value,
		transform: [{ scaleX: routeProgress.value }],
	}));

	const chipRowStyle = useAnimatedStyle(() => ({
		opacity: chipOpacity.value,
		transform: [{ translateY: chipOffset.value }],
	}));

	const routeDotStyle = useAnimatedStyle(() => ({
		transform: [{ translateX: routeProgress.value * 120 }],
	}));

	const containerStyle = useAnimatedStyle(() => ({
		opacity: fadeOut.value,
	}));

	return (
		<Animated.View
			style={[styles.container, { backgroundColor: accentColor }, containerStyle]}>
			<View style={styles.glowTop} />
			<View style={styles.glowBottom} />

			<Animated.View style={[styles.ring, ringStyle]} />
			<Animated.View style={[styles.badge, badgeStyle]}>
				<Text style={styles.badgeText}>R</Text>
			</Animated.View>

			<Animated.View style={titleStyle}>
				<Text style={styles.title}>{appName}</Text>
				<Text style={styles.subtitle}>{tagline}</Text>
			</Animated.View>

			<Animated.View style={[styles.routeTrack, routeStyle]}>
				<Animated.View style={[styles.routeDot, routeDotStyle]} />
			</Animated.View>

			<Animated.View style={[styles.chipRow, chipRowStyle]}>
				<View style={styles.chip}>
					<Text style={styles.chipEmoji}>🛍️</Text>
					<Text style={styles.chipText}>Browse</Text>
				</View>
				<View style={styles.chip}>
					<Text style={styles.chipEmoji}>📦</Text>
					<Text style={styles.chipText}>Send</Text>
				</View>
				<View style={styles.chip}>
					<Text style={styles.chipEmoji}>📍</Text>
					<Text style={styles.chipText}>Track</Text>
				</View>
			</Animated.View>
		</Animated.View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		paddingHorizontal: 24,
		overflow: "hidden",
	},
	glowTop: {
		position: "absolute",
		top: -120,
		width: 280,
		height: 280,
		borderRadius: 140,
		backgroundColor: "rgba(255,255,255,0.08)",
	},
	glowBottom: {
		position: "absolute",
		bottom: -140,
		width: 320,
		height: 320,
		borderRadius: 160,
		backgroundColor: "rgba(255,255,255,0.05)",
	},
	ring: {
		position: "absolute",
		width: 170,
		height: 170,
		borderRadius: 85,
		borderWidth: 1,
		borderColor: "rgba(255,255,255,0.22)",
	},
	badge: {
		width: 104,
		height: 104,
		borderRadius: 32,
		backgroundColor: "#FFFFFF",
		alignItems: "center",
		justifyContent: "center",
		shadowColor: "#000000",
		shadowOpacity: 0.12,
		shadowRadius: 18,
		shadowOffset: { width: 0, height: 10 },
		elevation: 5,
	},
	badgeText: {
		fontSize: 42,
		fontWeight: "900",
		color: "#2F8F4E",
		letterSpacing: -2,
	},
	title: {
		fontSize: 34,
		fontWeight: "900",
		color: "#FFFFFF",
		textAlign: "center",
		marginTop: 26,
		letterSpacing: -1,
	},
	subtitle: {
		fontSize: 15,
		lineHeight: 22,
		color: "rgba(255,255,255,0.82)",
		textAlign: "center",
		marginTop: 8,
	},
	routeTrack: {
		width: 140,
		height: 4,
		borderRadius: 999,
		backgroundColor: "rgba(255,255,255,0.28)",
		marginTop: 28,
		justifyContent: "center",
	},
	routeDot: {
		width: 18,
		height: 18,
		borderRadius: 9,
		backgroundColor: "#FFFFFF",
		shadowColor: "#FFFFFF",
		shadowOpacity: 0.45,
		shadowRadius: 8,
		shadowOffset: { width: 0, height: 0 },
	},
	chipRow: {
		flexDirection: "row",
		gap: 12,
		marginTop: 28,
	},
	chip: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		paddingHorizontal: 14,
		paddingVertical: 10,
		borderRadius: 999,
		backgroundColor: "rgba(255,255,255,0.14)",
		borderWidth: 1,
		borderColor: "rgba(255,255,255,0.15)",
	},
	chipEmoji: {
		fontSize: 16,
	},
	chipText: {
		fontSize: 13,
		fontWeight: "700",
		color: "#FFFFFF",
	},
});
