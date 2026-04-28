import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radii } from "../lib/design";

type RiderCardProps = {
	riderName?: string | null;
	subtitle?: string | null;
	onChatPress?: () => void;
	onCallPress?: () => void;
};

export default function RiderCard({
	riderName,
	subtitle,
	onChatPress,
	onCallPress,
}: RiderCardProps) {
	const initials = (riderName ?? "RA")
		.split(" ")
		.map((part) => part.charAt(0))
		.slice(0, 2)
		.join("")
		.toUpperCase();

	return (
		<View style={styles.card}>
			<View style={styles.avatar}>
				<Text style={styles.avatarText}>{initials}</Text>
			</View>
			<View style={styles.copy}>
				<Text style={styles.eyebrow}>Your rider</Text>
				<Text style={styles.name} numberOfLines={1}>
					{riderName ?? "Rider being matched"}
				</Text>
				{subtitle ? (
					<Text style={styles.subtitle} numberOfLines={1}>
						{subtitle}
					</Text>
				) : null}
			</View>
			{onChatPress ? (
				<TouchableOpacity
					style={styles.actionButton}
					onPress={onChatPress}
					activeOpacity={0.85}>
					<Ionicons
						name="chatbubble-ellipses"
						size={18}
						color={colors.brandAccent}
					/>
				</TouchableOpacity>
			) : null}
			{onCallPress ? (
				<TouchableOpacity
					style={[styles.actionButton, styles.actionPrimary]}
					onPress={onCallPress}
					activeOpacity={0.85}>
					<Ionicons name="call" size={18} color={colors.white} />
				</TouchableOpacity>
			) : null}
		</View>
	);
}

const styles = StyleSheet.create({
	card: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		backgroundColor: colors.surface,
		borderRadius: radii.panel,
		borderWidth: 1,
		borderColor: colors.border,
		padding: 14,
	},
	avatar: {
		width: 48,
		height: 48,
		borderRadius: 24,
		backgroundColor: colors.brandSoft,
		alignItems: "center",
		justifyContent: "center",
	},
	avatarText: {
		fontSize: 16,
		fontWeight: "800",
		color: colors.brand,
	},
	copy: {
		flex: 1,
	},
	eyebrow: {
		fontSize: 11,
		fontWeight: "800",
		letterSpacing: 1.2,
		textTransform: "uppercase",
		color: colors.textMuted,
		marginBottom: 2,
	},
	name: {
		fontSize: 15,
		fontWeight: "800",
		color: colors.textPrimary,
	},
	subtitle: {
		fontSize: 12,
		color: colors.textSecondary,
		marginTop: 2,
	},
	actionButton: {
		width: 40,
		height: 40,
		borderRadius: 20,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: colors.brandSoft,
	},
	actionPrimary: {
		backgroundColor: colors.brandAccent,
	},
});
