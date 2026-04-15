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
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { useAuthStore } from "@runam/shared/stores/auth-store";
import { login as loginApi } from "@runam/shared/api/auth";
import { ApiError } from "@runam/shared/api/client";
import type { LoginRequest } from "@runam/shared/types";

export default function LoginScreen() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [errorMessage, setErrorMessage] = useState("");
	const { login } = useAuthStore();
	const router = useRouter();
	const params = useLocalSearchParams<{ redirect?: string }>();
	const registerHref =
		typeof params.redirect === "string"
			? {
					pathname: "/(auth)/register" as const,
					params: { redirect: params.redirect },
				}
			: "/(auth)/register";

	const handleLogin = async () => {
		if (!email.trim() || !password.trim()) {
			Alert.alert("Error", "Please fill in all fields");
			return;
		}

		setIsLoading(true);
		setErrorMessage("");
		try {
			const body: LoginRequest = { email: email.trim(), password };
			const response = await loginApi(body);
			await login(response);
			const redirectPath =
				typeof params.redirect === "string" ? params.redirect : "/(tabs)";
			router.replace(redirectPath as any);
		} catch (error) {
			console.error("Login failed", error);
			const message =
				error instanceof ApiError
					? error.message
					: "Invalid email or password. Please try again.";
			setErrorMessage(message);
			Alert.alert(
				"Login Failed",
				message,
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
					{errorMessage ? (
						<View style={styles.errorBanner}>
							<Text style={styles.errorBannerTitle}>Could not log in</Text>
							<Text style={styles.errorBannerText}>{errorMessage}</Text>
							{__DEV__ && (
								<Text style={styles.debugText}>
									Check the Metro terminal for request logs and make sure the backend is running.
								</Text>
							)}
						</View>
					) : null}

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
					<View style={styles.passwordField}>
						<TextInput
							style={styles.passwordInput}
							placeholder="Enter your password"
							placeholderTextColor="#9CA3AF"
							value={password}
							onChangeText={setPassword}
							secureTextEntry={!showPassword}
						/>
						<TouchableOpacity
							style={styles.eyeButton}
							onPress={() => setShowPassword((value) => !value)}>
							<Text style={styles.eyeText}>{showPassword ? "🙈" : "👁"}</Text>
						</TouchableOpacity>
					</View>

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
						<Link href={registerHref as any} asChild>
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
	errorBanner: {
		backgroundColor: "#FEF2F2",
		borderRadius: 12,
		padding: 14,
		marginBottom: 18,
		borderWidth: 1,
		borderColor: "#FECACA",
	},
	errorBannerTitle: {
		fontSize: 14,
		fontWeight: "700",
		color: "#991B1B",
		marginBottom: 4,
	},
	errorBannerText: {
		fontSize: 13,
		lineHeight: 18,
		color: "#B91C1C",
	},
	debugText: {
		fontSize: 12,
		lineHeight: 17,
		color: "#7F1D1D",
		marginTop: 8,
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
	passwordField: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#F9FAFB",
		borderWidth: 1,
		borderColor: "#E5E7EB",
		borderRadius: 12,
		marginBottom: 16,
	},
	passwordInput: {
		flex: 1,
		paddingHorizontal: 16,
		paddingVertical: 14,
		fontSize: 16,
		color: "#111827",
	},
	eyeButton: {
		paddingHorizontal: 14,
	},
	eyeText: {
		fontSize: 18,
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
