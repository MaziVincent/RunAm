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
import { verifyOtp, resendOtp } from "@runam/shared/api/auth";
import { ApiError } from "@runam/shared/api/client";
import { useAuthStore } from "@runam/shared/stores/auth-store";

export default function VerifyOtpScreen() {
	const [code, setCode] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [isResending, setIsResending] = useState(false);
	const [errorMessage, setErrorMessage] = useState("");
	const router = useRouter();
	const { login } = useAuthStore();
	const params = useLocalSearchParams<{ phoneNumber?: string; redirect?: string }>();
	const phoneNumber = typeof params.phoneNumber === "string" ? params.phoneNumber : "";
	const redirectPath =
		typeof params.redirect === "string" ? params.redirect : "/(tabs)";

	const handleVerify = async () => {
		if (!phoneNumber) {
			Alert.alert("Missing phone number", "Start from the sign-up screen first.");
			return;
		}

		if (code.trim().length !== 6) {
			Alert.alert("Invalid code", "Enter the 6-digit verification code.");
			return;
		}

		setIsLoading(true);
		setErrorMessage("");
		try {
			const response = await verifyOtp({
				phoneNumber,
				code: code.trim(),
			});
			await login(response);
			router.replace(redirectPath as any);
		} catch (error) {
			const message =
				error instanceof ApiError
					? error.message
					: "Verification failed. Please try again.";
			setErrorMessage(message);
			Alert.alert("Verification Failed", message);
		} finally {
			setIsLoading(false);
		}
	};

	const handleResend = async () => {
		if (!phoneNumber) {
			Alert.alert("Missing phone number", "Start from the sign-up screen first.");
			return;
		}

		setIsResending(true);
		try {
			const response = await resendOtp(phoneNumber);
			Alert.alert("Code Sent", response.message);
		} catch (error) {
			const message =
				error instanceof ApiError
					? error.message
					: "Could not resend the verification code.";
			Alert.alert("Resend Failed", message);
		} finally {
			setIsResending(false);
		}
	};

	return (
		<SafeAreaView style={styles.container}>
			<KeyboardAvoidingView
				behavior={Platform.OS === "ios" ? "padding" : "height"}
				style={styles.keyboardView}>
				<View style={styles.header}>
					<Text style={styles.logo}>RunAm</Text>
					<Text style={styles.title}>Verify your phone</Text>
					<Text style={styles.subtitle}>
						Enter the 6-digit code sent to {phoneNumber || "your number"}.
					</Text>
				</View>

				<View style={styles.form}>
					{errorMessage ? (
						<View style={styles.errorBanner}>
							<Text style={styles.errorBannerTitle}>Verification did not work</Text>
							<Text style={styles.errorBannerText}>{errorMessage}</Text>
						</View>
					) : null}

					<Text style={styles.label}>Verification Code</Text>
					<TextInput
						style={styles.codeInput}
						placeholder="123456"
						placeholderTextColor="#9CA3AF"
						keyboardType="number-pad"
						maxLength={6}
						value={code}
						onChangeText={(value) => setCode(value.replace(/\D/g, ""))}
					/>

					<TouchableOpacity
						style={[styles.button, isLoading && styles.buttonDisabled]}
						onPress={handleVerify}
						disabled={isLoading}
						activeOpacity={0.8}>
						{isLoading ? (
							<ActivityIndicator color="#FFFFFF" />
						) : (
							<Text style={styles.buttonText}>Verify & Continue</Text>
						)}
					</TouchableOpacity>

					<TouchableOpacity
						style={styles.secondaryButton}
						onPress={handleResend}
						disabled={isResending}
						activeOpacity={0.7}>
						{isResending ? (
							<ActivityIndicator color="#2F8F4E" />
						) : (
							<Text style={styles.secondaryButtonText}>Resend Code</Text>
						)}
					</TouchableOpacity>

					<View style={styles.footer}>
						<Text style={styles.footerText}>Already verified? </Text>
						<Link
							href={{
								pathname: "/(auth)/login",
								params: { redirect: redirectPath },
							} as any}
							asChild>
							<TouchableOpacity>
								<Text style={styles.linkText}>Log In</Text>
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
		marginBottom: 40,
	},
	logo: {
		fontSize: 40,
		fontWeight: "800",
		color: "#2F8F4E",
		letterSpacing: -1,
	},
	title: {
		fontSize: 24,
		fontWeight: "800",
		color: "#111827",
		marginTop: 18,
	},
	subtitle: {
		fontSize: 15,
		lineHeight: 22,
		color: "#6B7280",
		marginTop: 10,
		textAlign: "center",
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
	label: {
		fontSize: 14,
		fontWeight: "600",
		color: "#374151",
		marginBottom: 6,
	},
	codeInput: {
		backgroundColor: "#F9FAFB",
		borderWidth: 1,
		borderColor: "#E5E7EB",
		borderRadius: 14,
		paddingHorizontal: 16,
		paddingVertical: 16,
		fontSize: 28,
		fontWeight: "700",
		letterSpacing: 8,
		color: "#111827",
		textAlign: "center",
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
	secondaryButton: {
		borderRadius: 12,
		paddingVertical: 15,
		alignItems: "center",
		marginTop: 12,
		borderWidth: 1,
		borderColor: "#D1D5DB",
	},
	secondaryButtonText: {
		fontSize: 15,
		fontWeight: "600",
		color: "#2F8F4E",
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