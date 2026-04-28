import type { ReactNode } from "react";
import {
	StyleSheet,
	Text,
	View,
	type StyleProp,
	type ViewStyle,
} from "react-native";
import { colors, radii, typography } from "../lib/design";

type HeroCardProps = {
	kicker?: string;
	title: string;
	subtitle?: string;
	children?: ReactNode;
	style?: StyleProp<ViewStyle>;
	backgroundColor?: string;
	kickerColor?: string;
	titleColor?: string;
	subtitleColor?: string;
};

export default function HeroCard({
	kicker,
	title,
	subtitle,
	children,
	style,
	backgroundColor = colors.brand,
	kickerColor = colors.heroKicker,
	titleColor = colors.white,
	subtitleColor = colors.heroSubtitle,
}: HeroCardProps) {
	return (
		<View style={[styles.card, { backgroundColor }, style]}>
			{kicker ? (
				<Text style={[styles.kicker, { color: kickerColor }]}>{kicker}</Text>
			) : null}
			<Text style={[styles.title, { color: titleColor }]}>{title}</Text>
			{subtitle ? (
				<Text style={[styles.subtitle, { color: subtitleColor }]}>
					{subtitle}
				</Text>
			) : null}
			{children ? <View style={styles.children}>{children}</View> : null}
		</View>
	);
}

const styles = StyleSheet.create({
	card: {
		borderRadius: radii.hero,
		padding: 22,
	},
	kicker: {
		fontSize: typography.kicker,
		fontWeight: "700",
		letterSpacing: 1.6,
		textTransform: "uppercase",
		marginBottom: 8,
	},
	title: {
		fontSize: typography.hero,
		fontWeight: "800",
		lineHeight: 34,
		letterSpacing: -0.9,
	},
	subtitle: {
		fontSize: typography.body,
		lineHeight: 21,
		marginTop: 10,
	},
	children: {
		marginTop: 18,
	},
});
