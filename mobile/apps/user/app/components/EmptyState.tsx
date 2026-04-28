import type { ReactNode } from "react";
import {
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
	type StyleProp,
	type ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radii } from "../lib/design";

type EmptyStateProps = {
	icon: keyof typeof Ionicons.glyphMap;
	title: string;
	description: string;
	actionLabel?: string;
	onAction?: () => void;
	style?: StyleProp<ViewStyle>;
	children?: ReactNode;
};

export default function EmptyState({
	icon,
	title,
	description,
	actionLabel,
	onAction,
	style,
	children,
}: EmptyStateProps) {
	return (
		<View style={[styles.container, style]}>
			<View style={styles.iconWrap}>
				<Ionicons name={icon} size={30} color="#9CA3AF" />
			</View>
			<Text style={styles.title}>{title}</Text>
			<Text style={styles.description}>{description}</Text>
			{actionLabel && onAction ? (
				<TouchableOpacity
					style={styles.button}
					onPress={onAction}
					activeOpacity={0.85}>
					<Text style={styles.buttonText}>{actionLabel}</Text>
				</TouchableOpacity>
			) : null}
			{children}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		alignItems: "center",
		justifyContent: "center",
		padding: 32,
	},
	iconWrap: {
		width: 72,
		height: 72,
		borderRadius: 22,
		backgroundColor: colors.surface,
		borderWidth: 1,
		borderColor: colors.border,
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 14,
	},
	title: {
		fontSize: 18,
		fontWeight: "800",
		color: colors.textPrimary,
		textAlign: "center",
	},
	description: {
		fontSize: 14,
		lineHeight: 20,
		color: colors.textSecondary,
		textAlign: "center",
		marginTop: 6,
		marginBottom: 18,
	},
	button: {
		backgroundColor: colors.brandAccent,
		borderRadius: radii.lg,
		paddingHorizontal: 20,
		paddingVertical: 15,
		alignItems: "center",
		justifyContent: "center",
	},
	buttonText: {
		fontSize: 15,
		fontWeight: "800",
		color: colors.white,
	},
});
