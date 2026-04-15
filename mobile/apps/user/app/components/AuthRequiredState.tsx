import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

interface AuthRequiredStateProps {
	title: string;
	description: string;
	redirectTo?: string;
	showBack?: boolean;
}

export default function AuthRequiredState({
	title,
	description,
	redirectTo,
	showBack = false,
}: AuthRequiredStateProps) {
	const router = useRouter();

	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<View style={styles.card}>
				<Text style={styles.icon}>🔐</Text>
				<Text style={styles.title}>{title}</Text>
				<Text style={styles.description}>{description}</Text>

				<View style={styles.actions}>
					<TouchableOpacity
						style={styles.primaryButton}
						onPress={() =>
							router.push({
								pathname: "/(auth)/login",
								params: redirectTo ? { redirect: redirectTo } : undefined,
							} as never)
						}
						activeOpacity={0.85}>
						<Text style={styles.primaryButtonText}>Log In</Text>
					</TouchableOpacity>

					<TouchableOpacity
						style={styles.secondaryButton}
						onPress={() =>
							router.push({
								pathname: "/(auth)/register",
								params: redirectTo ? { redirect: redirectTo } : undefined,
							} as never)
						}
						activeOpacity={0.85}>
						<Text style={styles.secondaryButtonText}>Create Account</Text>
					</TouchableOpacity>

					{showBack && (
						<TouchableOpacity
							style={styles.ghostButton}
							onPress={() => router.back()}
							activeOpacity={0.75}>
							<Text style={styles.ghostButtonText}>Go Back</Text>
						</TouchableOpacity>
					)}
				</View>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#F9FAFB",
		justifyContent: "center",
		paddingHorizontal: 20,
	},
	card: {
		backgroundColor: "#FFFFFF",
		borderRadius: 24,
		paddingHorizontal: 24,
		paddingVertical: 28,
		borderWidth: 1,
		borderColor: "#ECF0F3",
		shadowColor: "#000000",
		shadowOpacity: 0.06,
		shadowRadius: 18,
		shadowOffset: { width: 0, height: 10 },
		elevation: 3,
	},
	icon: {
		fontSize: 34,
		textAlign: "center",
		marginBottom: 14,
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
	actions: {
		marginTop: 24,
		gap: 12,
	},
	primaryButton: {
		backgroundColor: "#2F8F4E",
		paddingVertical: 15,
		borderRadius: 14,
		alignItems: "center",
	},
	primaryButtonText: {
		color: "#FFFFFF",
		fontSize: 16,
		fontWeight: "700",
	},
	secondaryButton: {
		backgroundColor: "#F0FDF4",
		paddingVertical: 15,
		borderRadius: 14,
		alignItems: "center",
		borderWidth: 1,
		borderColor: "#CFEAD7",
	},
	secondaryButtonText: {
		color: "#166534",
		fontSize: 16,
		fontWeight: "700",
	},
	ghostButton: {
		paddingVertical: 12,
		alignItems: "center",
	},
	ghostButtonText: {
		color: "#6B7280",
		fontSize: 15,
		fontWeight: "600",
	},
});