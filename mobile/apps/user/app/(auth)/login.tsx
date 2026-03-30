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
import { Link } from "expo-router";
import { useAuthStore } from "@runam/shared/stores/auth-store";
import apiClient from "@runam/shared/api/client";
import type { AuthResponse, LoginRequest } from "@runam/shared/types";

export default function LoginScreen() {
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
			const response = await apiClient.post<AuthResponse>("/auth/login", body);
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
					<Text style={styles.subtitle}>Your errands, delivered.</Text>
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

					<View style={styles.footer}>
						<Text style={styles.footerText}>Don't have an account? </Text>
						<Link href="/(auth)/register" asChild>
							<TouchableOpacity>
								<Text style={styles.linkText}>Sign Up</Text>
							</TouchableOpacity>
						</Link>
					</View>
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
	subtitle: {
		fontSize: 16,
		color: "#6B7280",
		marginTop: 8,
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
	footer: {
		flexDirection: "row",
		justifyContent: "center",
		marginTop: 24,
	},
	footerText: {
		fontSize: 14,
		color: "#6B7280",
	},
	linkText: {
		fontSize: 14,
		color: "#2F8F4E",
		fontWeight: "600",
	},
});
