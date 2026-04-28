import { useEffect, useRef, useState } from "react";
import {
	Dimensions,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
	type NativeScrollEvent,
	type NativeSyntheticEvent,
} from "react-native";
import { ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radii } from "../lib/design";

export type PromoSlide = {
	id: string;
	eyebrow: string;
	title: string;
	subtitle?: string;
	icon: keyof typeof Ionicons.glyphMap;
	accent: string;
	onPress?: () => void;
};

type PromoCarouselProps = {
	slides: PromoSlide[];
};

const { width: WINDOW_WIDTH } = Dimensions.get("window");
const SLIDE_WIDTH = WINDOW_WIDTH - 40;

export default function PromoCarousel({ slides }: PromoCarouselProps) {
	const scrollRef = useRef<ScrollView | null>(null);
	const [activeIndex, setActiveIndex] = useState(0);

	useEffect(() => {
		if (slides.length <= 1) return;
		const interval = setInterval(() => {
			setActiveIndex((prev) => {
				const next = (prev + 1) % slides.length;
				scrollRef.current?.scrollTo({ x: next * SLIDE_WIDTH, animated: true });
				return next;
			});
		}, 5000);
		return () => clearInterval(interval);
	}, [slides.length]);

	const handleMomentum = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
		const index = Math.round(event.nativeEvent.contentOffset.x / SLIDE_WIDTH);
		setActiveIndex(index);
	};

	if (slides.length === 0) return null;

	return (
		<View style={styles.wrap}>
			<ScrollView
				ref={scrollRef}
				horizontal
				pagingEnabled
				snapToInterval={SLIDE_WIDTH}
				decelerationRate="fast"
				showsHorizontalScrollIndicator={false}
				onMomentumScrollEnd={handleMomentum}>
				{slides.map((slide) => (
					<TouchableOpacity
						key={slide.id}
						style={[
							styles.slide,
							{ backgroundColor: slide.accent, width: SLIDE_WIDTH },
						]}
						activeOpacity={slide.onPress ? 0.9 : 1}
						onPress={slide.onPress}>
						<View style={styles.iconWrap}>
							<Ionicons name={slide.icon} size={28} color={colors.brand} />
						</View>
						<View style={styles.copy}>
							<Text style={styles.eyebrow}>{slide.eyebrow}</Text>
							<Text style={styles.title} numberOfLines={2}>
								{slide.title}
							</Text>
							{slide.subtitle ? (
								<Text style={styles.subtitle} numberOfLines={2}>
									{slide.subtitle}
								</Text>
							) : null}
						</View>
					</TouchableOpacity>
				))}
			</ScrollView>
			{slides.length > 1 ? (
				<View style={styles.dots}>
					{slides.map((slide, index) => (
						<View
							key={slide.id}
							style={[
								styles.dot,
								index === activeIndex ? styles.dotActive : null,
							]}
						/>
					))}
				</View>
			) : null}
		</View>
	);
}

const styles = StyleSheet.create({
	wrap: {
		marginBottom: 16,
	},
	slide: {
		flexDirection: "row",
		alignItems: "center",
		gap: 14,
		padding: 18,
		borderRadius: radii.panel,
	},
	iconWrap: {
		width: 56,
		height: 56,
		borderRadius: 18,
		backgroundColor: "rgba(255,255,255,0.7)",
		alignItems: "center",
		justifyContent: "center",
	},
	copy: {
		flex: 1,
	},
	eyebrow: {
		fontSize: 11,
		fontWeight: "800",
		letterSpacing: 1.4,
		textTransform: "uppercase",
		color: colors.brand,
		marginBottom: 4,
	},
	title: {
		fontSize: 17,
		fontWeight: "800",
		color: colors.textPrimary,
		letterSpacing: -0.3,
	},
	subtitle: {
		fontSize: 13,
		lineHeight: 18,
		color: colors.textSecondary,
		marginTop: 4,
	},
	dots: {
		flexDirection: "row",
		justifyContent: "center",
		gap: 6,
		marginTop: 10,
	},
	dot: {
		width: 6,
		height: 6,
		borderRadius: 3,
		backgroundColor: colors.border,
	},
	dotActive: {
		width: 18,
		backgroundColor: colors.brandAccent,
	},
});
