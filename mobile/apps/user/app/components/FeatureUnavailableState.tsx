import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

interface FeatureUnavailableStateProps {
	title: string;
	description: string;
	primaryActionLabel?: string;
	onPrimaryAction?: () => void;
}

export default function FeatureUnavailableState({
	title,
	description,
	primaryActionLabel = "Back to Profile",
	onPrimaryAction,
}: FeatureUnavailableStateProps) {
	const router = useRouter();

	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<View style={styles.card}>
				<Text style={styles.eyebrow}>Coming Soon</Text>
				<Text style={styles.title}>{title}</Text>
				<Text style={styles.description}>{description}</Text>

				<TouchableOpacity
					style={styles.primaryButton}
					onPress={onPrimaryAction ?? (() => router.replace("/(tabs)/profile"))}
					activeOpacity={0.85}>
					<Text style={styles.primaryButtonText}>{primaryActionLabel}</Text>
				</TouchableOpacity>

				<TouchableOpacity
					style={styles.secondaryButton}
					onPress={() => router.back()}
					activeOpacity={0.75}>
					<Text style={styles.secondaryButtonText}>Go Back</Text>
				</TouchableOpacity>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#F8FAFC",
		justifyContent: "center",
		paddingHorizontal: 20,
	},
	card: {
		backgroundColor: "#FFFFFF",
		borderRadius: 24,
		padding: 24,
		borderWidth: 1,
		borderColor: "#E2E8F0",
	},
	eyebrow: {
		fontSize: 12,
		fontWeight: "700",
		letterSpacing: 1,
		textTransform: "uppercase",
		color: "#2F8F4E",
		marginBottom: 8,
		textAlign: "center",
	},
	title: {
		fontSize: 24,
		fontWeight: "800",
		color: "#111827",
		textAlign: "center",
	},
	description: {
		fontSize: 15,
		lineHeight: 22,
		color: "#6B7280",
		textAlign: "center",
		marginTop: 10,
	},
	primaryButton: {
		backgroundColor: "#2F8F4E",
		borderRadius: 14,
		paddingVertical: 15,
		alignItems: "center",
		marginTop: 24,
	},
	primaryButtonText: {
		fontSize: 16,
		fontWeight: "700",
		color: "#FFFFFF",
	},
	secondaryButton: {
		paddingVertical: 12,
		alignItems: "center",
		marginTop: 8,
	},
	secondaryButtonText: {
		fontSize: 15,
		fontWeight: "600",
		color: "#6B7280",
	},
});
