import { useEffect, useState } from "react";
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
import { resendOtp, verifyOtp } from "@runam/shared/api/auth";
import { ApiError } from "@runam/shared/api/client";
import { useAuthStore } from "@runam/shared/stores/auth-store";

export default function VerifyOtpScreen() {
	const [code, setCode] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [isResending, setIsResending] = useState(false);
	const [errorMessage, setErrorMessage] = useState("");
	const [resendCooldown, setResendCooldown] = useState(30);
	const router = useRouter();
	const { login } = useAuthStore();
	const params = useLocalSearchParams<{
		phoneNumber?: string;
		redirect?: string;
	}>();
	const phoneNumber =
		typeof params.phoneNumber === "string" ? params.phoneNumber : "";
	const redirectPath =
		typeof params.redirect === "string" ? params.redirect : "/(tabs)";

	useEffect(() => {
		if (resendCooldown <= 0) {
			return;
		}

		const timer = setTimeout(() => {
			setResendCooldown((value) => value - 1);
		}, 1000);

		return () => clearTimeout(timer);
	}, [resendCooldown]);

	const handleVerify = async () => {
		if (!phoneNumber) {
			Alert.alert(
				"Missing phone number",
				"Start from the sign-up screen first.",
			);
			return;
		}

		if (code.trim().length !== 6) {
			setErrorMessage("Enter the full 6-digit verification code.");
			Alert.alert("Invalid code", "Enter the 6-digit verification code.");
			return;
		}

		setIsLoading(true);
		setErrorMessage("");
		try {
			const response = await verifyOtp({ phoneNumber, code: code.trim() });
			await login(response);
			router.replace(redirectPath as any);
		} catch (error) {
			const message =
				error instanceof ApiError
					? error.message
					: "Verification failed. Please try again.";
			setErrorMessage(message);
			Alert.alert("Verification failed", message);
		} finally {
			setIsLoading(false);
		}
	};

	const handleResend = async () => {
		if (!phoneNumber) {
			Alert.alert(
				"Missing phone number",
				"Start from the sign-up screen first.",
			);
			return;
		}

		if (resendCooldown > 0) {
			Alert.alert(
				"Please wait",
				`You can request another code in ${resendCooldown} seconds.`,
			);
			return;
		}

		setIsResending(true);
		try {
			const response = await resendOtp(phoneNumber);
			setResendCooldown(30);
			Alert.alert("Code sent", response.message);
		} catch (error) {
			const message =
				error instanceof ApiError
					? error.message
					: "Could not resend the verification code.";
			Alert.alert("Resend failed", message);
		} finally {
			setIsResending(false);
		}
	};

	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<KeyboardAvoidingView
				behavior={Platform.OS === "ios" ? "padding" : "height"}
				style={styles.keyboardView}>
				<View style={styles.heroCard}>
					<Text style={styles.kicker}>Phone verification</Text>
					<Text style={styles.title}>
						Confirm this number before you continue.
					</Text>
					<Text style={styles.subtitle}>
						We sent a 6-digit code to {phoneNumber || "your phone number"}.
						Enter it once to finish account setup.
					</Text>
				</View>

				<View style={styles.formCard}>
					<Text style={styles.formTitle}>Enter code</Text>
					{errorMessage ? (
						<View style={styles.errorBanner}>
							<Text style={styles.errorTitle}>Verification did not work</Text>
							<Text style={styles.errorText}>{errorMessage}</Text>
						</View>
					) : null}

					<View style={styles.codeCard}>
						<Ionicons name="keypad-outline" size={22} color="#19543B" />
						<TextInput
							style={styles.codeInput}
							placeholder="123456"
							placeholderTextColor="#9CA3AF"
							keyboardType="number-pad"
							maxLength={6}
							value={code}
							onChangeText={(value) => {
								setCode(value.replace(/\D/g, ""));
								if (errorMessage) {
									setErrorMessage("");
								}
							}}
						/>
					</View>
					<Text style={styles.helperText}>
						You can request a new code in {resendCooldown}s if this one never
						arrives.
					</Text>

					<TouchableOpacity
						style={[
							styles.primaryButton,
							isLoading && styles.primaryButtonDisabled,
						]}
						onPress={handleVerify}
						disabled={isLoading}
						activeOpacity={0.85}>
						{isLoading ? (
							<ActivityIndicator color="#FFFFFF" />
						) : (
							<Text style={styles.primaryButtonText}>Verify and continue</Text>
						)}
					</TouchableOpacity>

					<TouchableOpacity
						style={styles.secondaryButton}
						onPress={handleResend}
						disabled={isResending || resendCooldown > 0}
						activeOpacity={0.85}>
						{isResending ? (
							<ActivityIndicator color="#19543B" />
						) : (
							<Text style={styles.secondaryButtonText}>
								{resendCooldown > 0
									? `Resend in ${resendCooldown}s`
									: "Resend code"}
							</Text>
						)}
					</TouchableOpacity>

					<View style={styles.footer}>
						<Text style={styles.footerText}>Already verified? </Text>
						<Link
							href={
								{
									pathname: "/(auth)/login",
									params: { redirect: redirectPath },
								} as any
							}
							asChild>
							<TouchableOpacity>
								<Text style={styles.linkText}>Log in</Text>
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
	codeCard: {
		backgroundColor: "#F7F8F4",
		borderWidth: 1,
		borderColor: "#E4E8DE",
		borderRadius: 18,
		paddingHorizontal: 16,
		paddingVertical: 12,
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 12,
	},
	codeInput: {
		width: "100%",
		fontSize: 30,
		fontWeight: "800",
		letterSpacing: 10,
		color: "#142013",
		textAlign: "center",
		marginTop: 8,
	},
	helperText: {
		fontSize: 12,
		lineHeight: 18,
		color: "#6B7280",
		textAlign: "center",
		marginBottom: 16,
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
	secondaryButton: {
		marginTop: 12,
		borderRadius: 18,
		paddingVertical: 15,
		alignItems: "center",
		borderWidth: 1,
		borderColor: "#D1D5DB",
		backgroundColor: "#FFFFFF",
	},
	secondaryButtonText: {
		fontSize: 15,
		fontWeight: "800",
		color: "#19543B",
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
