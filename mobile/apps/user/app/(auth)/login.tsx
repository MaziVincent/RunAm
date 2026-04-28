import { useState } from "react";
import {
	ActivityIndicator,
	Alert,
	KeyboardAvoidingView,
	Platform,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@runam/shared/stores/auth-store";
import { login as loginApi } from "@runam/shared/api/auth";
import { ApiError } from "@runam/shared/api/client";
import type { LoginRequest } from "@runam/shared/types";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
			setErrorMessage("Enter your email and password to continue.");
			Alert.alert("Missing details", "Please fill in both fields.");
			return;
		}

		if (!emailPattern.test(email.trim().toLowerCase())) {
			setErrorMessage("Enter a valid email address before continuing.");
			Alert.alert("Invalid email", "Enter a valid email address.");
			return;
		}

		setIsLoading(true);
		setErrorMessage("");
		try {
			const body: LoginRequest = {
				email: email.trim().toLowerCase(),
				password,
			};
			const response = await loginApi(body);
			await login(response);
			const redirectPath =
				typeof params.redirect === "string" ? params.redirect : "/(tabs)";
			router.replace(redirectPath as any);
		} catch (error) {
			const message =
				error instanceof ApiError
					? error.message
					: "Invalid email or password. Please try again.";
			setErrorMessage(message);
			Alert.alert("Login failed", message);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<KeyboardAvoidingView
				behavior={Platform.OS === "ios" ? "padding" : "height"}
				style={styles.keyboardView}>
				<View style={styles.heroCard}>
					<Text style={styles.kicker}>RunAm account</Text>
					<Text style={styles.title}>Pick up where your orders left off.</Text>
					<Text style={styles.subtitle}>
						Log in to access saved addresses, active deliveries, wallet
						payments, and order history.
					</Text>
					<View style={styles.heroMetaRow}>
						<View style={styles.heroMetaChip}>
							<Ionicons name="receipt-outline" size={14} color="#19543B" />
							<Text style={styles.heroMetaText}>Orders</Text>
						</View>
						<View style={styles.heroMetaChip}>
							<Ionicons name="wallet-outline" size={14} color="#19543B" />
							<Text style={styles.heroMetaText}>Wallet</Text>
						</View>
						<View style={styles.heroMetaChip}>
							<Ionicons name="location-outline" size={14} color="#19543B" />
							<Text style={styles.heroMetaText}>Addresses</Text>
						</View>
					</View>
				</View>

				<View style={styles.formCard}>
					<Text style={styles.formTitle}>Log in</Text>
					{errorMessage ? (
						<View style={styles.errorBanner}>
							<Text style={styles.errorTitle}>Could not sign you in</Text>
							<Text style={styles.errorText}>{errorMessage}</Text>
						</View>
					) : null}

					<Text style={styles.label}>Email</Text>
					<TextInput
						style={styles.input}
						placeholder="you@example.com"
						placeholderTextColor="#9CA3AF"
						value={email}
						onChangeText={(value) => {
							setEmail(value);
							if (errorMessage) {
								setErrorMessage("");
							}
						}}
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
							onChangeText={(value) => {
								setPassword(value);
								if (errorMessage) {
									setErrorMessage("");
								}
							}}
							secureTextEntry={!showPassword}
						/>
						<TouchableOpacity
							style={styles.eyeButton}
							onPress={() => setShowPassword((value) => !value)}>
							<Ionicons
								name={showPassword ? "eye-off-outline" : "eye-outline"}
								size={20}
								color="#6B7280"
							/>
						</TouchableOpacity>
					</View>

					<TouchableOpacity
						style={[
							styles.primaryButton,
							isLoading && styles.primaryButtonDisabled,
						]}
						onPress={handleLogin}
						disabled={isLoading}
						activeOpacity={0.85}>
						{isLoading ? (
							<ActivityIndicator color="#FFFFFF" />
						) : (
							<Text style={styles.primaryButtonText}>Log in</Text>
						)}
					</TouchableOpacity>

					<View style={styles.footer}>
						<Text style={styles.footerText}>New to RunAm? </Text>
						<Link href={registerHref as any} asChild>
							<TouchableOpacity>
								<Text style={styles.linkText}>Create account</Text>
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
		backgroundColor: "#F3F5EF",
	},
	keyboardView: {
		flex: 1,
		justifyContent: "center",
		paddingHorizontal: 20,
		paddingVertical: 24,
	},
	heroCard: {
		backgroundColor: "#103E2B",
		borderRadius: 30,
		padding: 22,
		marginBottom: 16,
	},
	kicker: {
		fontSize: 12,
		fontWeight: "700",
		letterSpacing: 1.6,
		textTransform: "uppercase",
		color: "#A6E4C3",
		marginBottom: 8,
	},
	title: {
		fontSize: 28,
		fontWeight: "800",
		lineHeight: 33,
		letterSpacing: -0.8,
		color: "#FFFFFF",
	},
	subtitle: {
		fontSize: 14,
		lineHeight: 21,
		color: "#D6EFE1",
		marginTop: 10,
	},
	heroMetaRow: {
		flexDirection: "row",
		gap: 8,
		flexWrap: "wrap",
		marginTop: 16,
	},
	heroMetaChip: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		backgroundColor: "#FFFFFF",
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 999,
	},
	heroMetaText: {
		fontSize: 12,
		fontWeight: "700",
		color: "#19543B",
	},
	formCard: {
		backgroundColor: "#FFFFFF",
		borderRadius: 24,
		padding: 20,
		borderWidth: 1,
		borderColor: "#E4E8DE",
	},
	formTitle: {
		fontSize: 22,
		fontWeight: "800",
		color: "#142013",
		marginBottom: 16,
	},
	errorBanner: {
		backgroundColor: "#FDE7E6",
		borderRadius: 16,
		padding: 14,
		marginBottom: 16,
	},
	errorTitle: {
		fontSize: 14,
		fontWeight: "800",
		color: "#B42318",
	},
	errorText: {
		fontSize: 13,
		lineHeight: 18,
		color: "#B42318",
		marginTop: 4,
	},
	label: {
		fontSize: 13,
		fontWeight: "700",
		color: "#374151",
		marginBottom: 6,
		textTransform: "uppercase",
		letterSpacing: 0.6,
	},
	input: {
		backgroundColor: "#F7F8F4",
		borderWidth: 1,
		borderColor: "#E4E8DE",
		borderRadius: 16,
		paddingHorizontal: 14,
		paddingVertical: 14,
		fontSize: 16,
		color: "#142013",
		marginBottom: 14,
	},
	passwordField: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#F7F8F4",
		borderWidth: 1,
		borderColor: "#E4E8DE",
		borderRadius: 16,
		marginBottom: 16,
	},
	passwordInput: {
		flex: 1,
		paddingHorizontal: 14,
		paddingVertical: 14,
		fontSize: 16,
		color: "#142013",
	},
	eyeButton: {
		paddingHorizontal: 14,
	},
	primaryButton: {
		backgroundColor: "#19543B",
		borderRadius: 18,
		paddingVertical: 16,
		alignItems: "center",
	},
	primaryButtonDisabled: {
		opacity: 0.5,
	},
	primaryButtonText: {
		fontSize: 16,
		fontWeight: "800",
		color: "#FFFFFF",
	},
	footer: {
		flexDirection: "row",
		justifyContent: "center",
		marginTop: 20,
	},
	footerText: {
		fontSize: 14,
		color: "#6B7280",
	},
	linkText: {
		fontSize: 14,
		fontWeight: "800",
		color: "#19543B",
	},
});
