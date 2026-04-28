import type { ReactNode } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radii } from "../lib/design";

type BackHeaderProps = {
	title: string;
	onBack: () => void;
	rightSlot?: ReactNode;
};

export default function BackHeader({
	title,
	onBack,
	rightSlot,
}: BackHeaderProps) {
	return (
		<View style={styles.header}>
			<TouchableOpacity
				style={styles.button}
				onPress={onBack}
				activeOpacity={0.82}>
				<Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
			</TouchableOpacity>
			<Text style={styles.title}>{title}</Text>
			{rightSlot ? rightSlot : <View style={styles.placeholder} />}
		</View>
	);
}

const styles = StyleSheet.create({
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 20,
		paddingVertical: 10,
	},
	button: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: colors.surface,
		alignItems: "center",
		justifyContent: "center",
		borderWidth: 1,
		borderColor: colors.border,
	},
	title: {
		fontSize: 18,
		fontWeight: "800",
		color: colors.textPrimary,
	},
	placeholder: {
		width: 40,
		height: 40,
		borderRadius: radii.pill,
	},
});
