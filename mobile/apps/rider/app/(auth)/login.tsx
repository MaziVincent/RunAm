import { useState } from "react";
import {
	View,
	Text,
	TextInput,
	TouchableOpacity,
	StyleSheet,
	KeyboardAvoidingView,
	Platform,
	ActivityIndicator,
	Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "@runam/shared/stores/auth-store";
import { login as loginApi } from "@runam/shared/api/auth";
import type { AuthResponse, LoginRequest } from "@runam/shared/types";

export default function RiderLoginScreen() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const { login } = useAuthStore();

	const handleLogin = async () => {
		if (!email.trim() || !password.trim()) {
			Alert.alert("Error", "Please fill in all fields");
			return;
		}

		setIsLoading(true);
		try {
			const body: LoginRequest = { email: email.trim(), password };
			const response = await loginApi(body);
			await login(response);
		} catch (error: any) {
			Alert.alert(
				"Login Failed",
				error?.message || "Invalid email or password. Please try again.",
			);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<SafeAreaView style={styles.container}>
			<KeyboardAvoidingView
				behavior={Platform.OS === "ios" ? "padding" : "height"}
				style={styles.keyboardView}>
				<View style={styles.header}>
					<Text style={styles.logo}>RunAm</Text>
					<View style={styles.riderBadge}>
						<Text style={styles.riderBadgeText}>RIDER</Text>
					</View>
					<Text style={styles.subtitle}>Sign in to start earning</Text>
				</View>

				<View style={styles.form}>
					<Text style={styles.label}>Email</Text>
					<TextInput
						style={styles.input}
						placeholder="you@example.com"
						placeholderTextColor="#9CA3AF"
						value={email}
						onChangeText={setEmail}
						keyboardType="email-address"
						autoCapitalize="none"
						autoCorrect={false}
					/>

					<Text style={styles.label}>Password</Text>
					<TextInput
						style={styles.input}
						placeholder="Enter your password"
						placeholderTextColor="#9CA3AF"
						value={password}
						onChangeText={setPassword}
						secureTextEntry
					/>

					<TouchableOpacity
						style={[styles.button, isLoading && styles.buttonDisabled]}
						onPress={handleLogin}
						disabled={isLoading}
						activeOpacity={0.8}>
						{isLoading ? (
							<ActivityIndicator color="#FFFFFF" />
						) : (
							<Text style={styles.buttonText}>Log In</Text>
						)}
					</TouchableOpacity>
				</View>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#FFFFFF",
	},
	keyboardView: {
		flex: 1,
		justifyContent: "center",
		paddingHorizontal: 24,
	},
	header: {
		alignItems: "center",
		marginBottom: 48,
	},
	logo: {
		fontSize: 40,
		fontWeight: "800",
		color: "#2F8F4E",
		letterSpacing: -1,
	},
	riderBadge: {
		marginTop: 8,
		backgroundColor: "#111827",
		paddingHorizontal: 14,
		paddingVertical: 4,
		borderRadius: 6,
	},
	riderBadgeText: {
		color: "#FFFFFF",
		fontSize: 12,
		fontWeight: "800",
		letterSpacing: 2,
	},
	subtitle: {
		fontSize: 16,
		color: "#6B7280",
		marginTop: 12,
	},
	form: {
		width: "100%",
	},
	label: {
		fontSize: 14,
		fontWeight: "600",
		color: "#374151",
		marginBottom: 6,
	},
	input: {
		backgroundColor: "#F9FAFB",
		borderWidth: 1,
		borderColor: "#E5E7EB",
		borderRadius: 12,
		paddingHorizontal: 16,
		paddingVertical: 14,
		fontSize: 16,
		color: "#111827",
		marginBottom: 16,
	},
	button: {
		backgroundColor: "#2F8F4E",
		borderRadius: 12,
		paddingVertical: 16,
		alignItems: "center",
		marginTop: 8,
	},
	buttonDisabled: {
		opacity: 0.6,
	},
	buttonText: {
		color: "#FFFFFF",
		fontSize: 16,
		fontWeight: "700",
	},
});
