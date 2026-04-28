import { useState } from "react";
import {
	ActivityIndicator,
	Alert,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { register as registerApi } from "@runam/shared/api/auth";
import { ApiError } from "@runam/shared/api/client";
import type { RegisterRequest } from "@runam/shared/types";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^\+?[0-9\s()-]{10,20}$/;

function isStrongPassword(value: string) {
	return value.length >= 8 && /[A-Za-z]/.test(value) && /\d/.test(value);
}

export default function RegisterScreen() {
	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [email, setEmail] = useState("");
	const [phoneNumber, setPhoneNumber] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [errorMessage, setErrorMessage] = useState("");
	const router = useRouter();
	const params = useLocalSearchParams<{ redirect?: string }>();
	const loginHref =
		typeof params.redirect === "string"
			? {
					pathname: "/(auth)/login" as const,
					params: { redirect: params.redirect },
				}
			: "/(auth)/login";

	const handleRegister = async () => {
		if (
			!firstName.trim() ||
			!lastName.trim() ||
			!email.trim() ||
			!phoneNumber.trim() ||
			!password.trim()
		) {
			setErrorMessage("Complete every field before creating your account.");
			Alert.alert("Missing details", "Please fill in all fields.");
			return;
		}

		if (firstName.trim().length < 2 || lastName.trim().length < 2) {
			setErrorMessage("Enter your full first and last name.");
			Alert.alert("Invalid name", "Enter your full first and last name.");
			return;
		}

		if (!emailPattern.test(email.trim().toLowerCase())) {
			setErrorMessage("Enter a valid email address before continuing.");
			Alert.alert("Invalid email", "Enter a valid email address.");
			return;
		}

		if (!phonePattern.test(phoneNumber.trim())) {
			setErrorMessage(
				"Enter a valid phone number with country code if available.",
			);
			Alert.alert("Invalid phone number", "Enter a valid phone number.");
			return;
		}

		if (!isStrongPassword(password)) {
			setErrorMessage(
				"Use at least 8 characters and include both letters and numbers.",
			);
			Alert.alert(
				"Weak password",
				"Use at least 8 characters and include both letters and numbers.",
			);
			return;
		}

		setIsLoading(true);
		setErrorMessage("");
		try {
			const body: RegisterRequest = {
				firstName: firstName.trim(),
				lastName: lastName.trim(),
				email: email.trim().toLowerCase(),
				phoneNumber: phoneNumber.trim(),
				password,
			};
			const response = await registerApi(body);
			const redirectPath =
				typeof params.redirect === "string" ? params.redirect : "/(tabs)";
			router.replace({
				pathname: "/(auth)/verify-otp",
				params: {
					phoneNumber: response.phoneNumber,
					redirect: redirectPath,
				},
			} as any);
		} catch (error) {
			const message =
				error instanceof ApiError && error.errors
					? Object.values(error.errors).flat().join("\n")
					: error instanceof ApiError
						? error.message
						: "Registration failed. Please try again.";
			setErrorMessage(message);
			Alert.alert("Registration failed", message);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<KeyboardAvoidingView
				behavior={Platform.OS === "ios" ? "padding" : "height"}
				style={styles.keyboardView}>
				<ScrollView
					contentContainerStyle={styles.scrollContent}
					showsVerticalScrollIndicator={false}
					keyboardShouldPersistTaps="handled">
					<View style={styles.heroCard}>
						<Text style={styles.kicker}>Create account</Text>
						<Text style={styles.title}>
							Set up your delivery identity once.
						</Text>
						<Text style={styles.subtitle}>
							Your account unlocks saved addresses, wallet funding, order
							tracking, and notifications across the app.
						</Text>
					</View>

					<View style={styles.formCard}>
						<Text style={styles.formTitle}>Sign up</Text>
						{errorMessage ? (
							<View style={styles.errorBanner}>
								<Text style={styles.errorTitle}>Could not create account</Text>
								<Text style={styles.errorText}>{errorMessage}</Text>
							</View>
						) : null}

						<View style={styles.row}>
							<View style={styles.halfField}>
								<Text style={styles.label}>First name</Text>
								<TextInput
									style={styles.input}
									placeholder="John"
									placeholderTextColor="#9CA3AF"
									value={firstName}
									onChangeText={(value) => {
										setFirstName(value);
										if (errorMessage) {
											setErrorMessage("");
										}
									}}
									autoCapitalize="words"
								/>
							</View>
							<View style={styles.halfField}>
								<Text style={styles.label}>Last name</Text>
								<TextInput
									style={styles.input}
									placeholder="Doe"
									placeholderTextColor="#9CA3AF"
									value={lastName}
									onChangeText={(value) => {
										setLastName(value);
										if (errorMessage) {
											setErrorMessage("");
										}
									}}
									autoCapitalize="words"
								/>
							</View>
						</View>

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

						<Text style={styles.label}>Phone number</Text>
						<TextInput
							style={styles.input}
							placeholder="+234 800 000 0000"
							placeholderTextColor="#9CA3AF"
							value={phoneNumber}
							onChangeText={(value) => {
								setPhoneNumber(value);
								if (errorMessage) {
									setErrorMessage("");
								}
							}}
							keyboardType="phone-pad"
						/>

						<Text style={styles.label}>Password</Text>
						<View style={styles.passwordField}>
							<TextInput
								style={styles.passwordInput}
								placeholder="Create a password"
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
						<Text style={styles.helperText}>
							Use at least 8 characters with letters and numbers.
						</Text>

						<TouchableOpacity
							style={[
								styles.primaryButton,
								isLoading && styles.primaryButtonDisabled,
							]}
							onPress={handleRegister}
							disabled={isLoading}
							activeOpacity={0.85}>
							{isLoading ? (
								<ActivityIndicator color="#FFFFFF" />
							) : (
								<Text style={styles.primaryButtonText}>Create account</Text>
							)}
						</TouchableOpacity>

						<View style={styles.footer}>
							<Text style={styles.footerText}>Already have an account? </Text>
							<Link href={loginHref as any} asChild>
								<TouchableOpacity>
									<Text style={styles.linkText}>Log in</Text>
								</TouchableOpacity>
							</Link>
						</View>
					</View>
				</ScrollView>
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
	},
	scrollContent: {
		flexGrow: 1,
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
	row: {
		flexDirection: "row",
		gap: 12,
	},
	halfField: {
		flex: 1,
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
		marginBottom: 10,
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
	helperText: {
		fontSize: 12,
		lineHeight: 18,
		color: "#6B7280",
		marginBottom: 14,
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
