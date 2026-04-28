import type { ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { colors } from "../lib/design";

type StickyBottomBarProps = {
	children: ReactNode;
	style?: StyleProp<ViewStyle>;
};

export default function StickyBottomBar({
	children,
	style,
}: StickyBottomBarProps) {
	return <View style={[styles.container, style]}>{children}</View>;
}

const styles = StyleSheet.create({
	container: {
		position: "absolute",
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: "rgba(255,255,255,0.98)",
		borderTopWidth: 1,
		borderTopColor: colors.border,
		paddingHorizontal: 20,
		paddingTop: 14,
		paddingBottom: 24,
	},
});
