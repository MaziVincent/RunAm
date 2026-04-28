import { StyleSheet, Text, View } from "react-native";
import { colors, radii } from "../lib/design";

type StatusTone = "success" | "warning" | "danger" | "neutral" | "brand";

type StatusPillProps = {
	label: string;
	tone?: StatusTone;
};

const toneStyles: Record<
	StatusTone,
	{ backgroundColor: string; color: string }
> = {
	success: { backgroundColor: colors.brandSoft, color: colors.brandAccent },
	warning: { backgroundColor: colors.warningSoft, color: "#9A6700" },
	danger: { backgroundColor: colors.errorSoft, color: colors.error },
	neutral: { backgroundColor: colors.neutralSoft, color: colors.textSecondary },
	brand: { backgroundColor: colors.infoSoft, color: colors.brandAccent },
};

export default function StatusPill({ label, tone = "brand" }: StatusPillProps) {
	const toneStyle = toneStyles[tone];

	return (
		<View style={[styles.pill, { backgroundColor: toneStyle.backgroundColor }]}>
			<Text style={[styles.text, { color: toneStyle.color }]}>{label}</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	pill: {
		borderRadius: radii.pill,
		paddingHorizontal: 12,
		paddingVertical: 7,
	},
	text: {
		fontSize: 12,
		fontWeight: "800",
		textTransform: "uppercase",
		letterSpacing: 0.6,
	},
});
