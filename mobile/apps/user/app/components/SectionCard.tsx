import type { ReactNode } from "react";
import {
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
	type StyleProp,
	type ViewStyle,
} from "react-native";
import { colors, radii } from "../lib/design";

type SectionCardProps = {
	title?: string;
	actionLabel?: string;
	onActionPress?: () => void;
	headerRight?: ReactNode;
	children: ReactNode;
	style?: StyleProp<ViewStyle>;
	headerSpacing?: number;
};

export default function SectionCard({
	title,
	actionLabel,
	onActionPress,
	headerRight,
	children,
	style,
	headerSpacing = 12,
}: SectionCardProps) {
	return (
		<View style={[styles.card, style]}>
			{title || actionLabel || headerRight ? (
				<View style={[styles.header, { marginBottom: headerSpacing }]}>
					{title ? <Text style={styles.title}>{title}</Text> : <View />}
					{headerRight ? (
						headerRight
					) : actionLabel && onActionPress ? (
						<TouchableOpacity onPress={onActionPress} activeOpacity={0.82}>
							<Text style={styles.link}>{actionLabel}</Text>
						</TouchableOpacity>
					) : null}
				</View>
			) : null}
			{children}
		</View>
	);
}

const styles = StyleSheet.create({
	card: {
		backgroundColor: colors.surface,
		borderRadius: radii.panel,
		padding: 18,
		borderWidth: 1,
		borderColor: colors.border,
	},
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		gap: 12,
	},
	title: {
		fontSize: 18,
		fontWeight: "800",
		color: colors.textPrimary,
		flex: 1,
	},
	link: {
		fontSize: 13,
		fontWeight: "800",
		color: colors.brandAccent,
		textTransform: "uppercase",
		letterSpacing: 0.6,
	},
});
