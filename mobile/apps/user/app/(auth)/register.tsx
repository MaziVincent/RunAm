import { useState } from "react";
import {
	View,
	Text,
	TextInput,
	TouchableOpacity,
	StyleSheet,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	ActivityIndicator,
	Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, useRouter } from "expo-router";
import { useAuthStore } from "@runam/shared/stores/auth-store";
import apiClient from "@runam/shared/api/client";
import type { AuthResponse, RegisterRequest } from "@runam/shared/types";

export default function RegisterScreen() {
	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [email, setEmail] = useState("");
	const [phoneNumber, setPhoneNumber] = useState("");
	const [password, setPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const { login } = useAuthStore();
	const router = useRouter();

	const handleRegister = async () => {
		if (
			!firstName.trim() ||
			!lastName.trim() ||
			!email.trim() ||
			!phoneNumber.trim() ||
			!password.trim()
		) {
			Alert.alert("Error", "Please fill in all fields");
			return;
		}

		setIsLoading(true);
		try {
			const body: RegisterRequest = {
				firstName: firstName.trim(),
				lastName: lastName.trim(),
				email: email.trim(),
				phoneNumber: phoneNumber.trim(),
				password,
			};
			const response = await apiClient.post<AuthResponse>(
				"/auth/register",
				body,
			);
			await login(response);
		} catch (error: any) {
			const errorMessages = error?.errors
				? Object.values(error.errors).flat().join("\n")
				: error?.message || "Registration failed. Please try again.";
			Alert.alert("Registration Failed", errorMessages);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<SafeAreaView style={styles.container}>
			<KeyboardAvoidingView
				behavior={Platform.OS === "ios" ? "padding" : "height"}
				style={styles.keyboardView}>
				<ScrollView
					contentContainerStyle={styles.scrollContent}
					showsVerticalScrollIndicator={false}
					keyboardShouldPersistTaps="handled">
					<View style={styles.header}>
						<Text style={styles.logo}>RunAm</Text>
						<Text style={styles.subtitle}>Create your account</Text>
					</View>

					<View style={styles.form}>
						<View style={styles.row}>
							<View style={styles.halfInput}>
								<Text style={styles.label}>First Name</Text>
								<TextInput
									style={styles.input}
									placeholder="John"
									placeholderTextColor="#9CA3AF"
									value={firstName}
									onChangeText={setFirstName}
									autoCapitalize="words"
								/>
							</View>
							<View style={styles.halfInput}>
								<Text style={styles.label}>Last Name</Text>
								<TextInput
									style={styles.input}
									placeholder="Doe"
									placeholderTextColor="#9CA3AF"
									value={lastName}
									onChangeText={setLastName}
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
							onChangeText={setEmail}
							keyboardType="email-address"
							autoCapitalize="none"
							autoCorrect={false}
						/>

						<Text style={styles.label}>Phone Number</Text>
						<TextInput
							style={styles.input}
							placeholder="+234 800 000 0000"
							placeholderTextColor="#9CA3AF"
							value={phoneNumber}
							onChangeText={setPhoneNumber}
							keyboardType="phone-pad"
						/>

						<Text style={styles.label}>Password</Text>
						<TextInput
							style={styles.input}
							placeholder="Create a password"
							placeholderTextColor="#9CA3AF"
							value={password}
							onChangeText={setPassword}
							secureTextEntry
						/>

						<TouchableOpacity
							style={[styles.button, isLoading && styles.buttonDisabled]}
							onPress={handleRegister}
							disabled={isLoading}
							activeOpacity={0.8}>
							{isLoading ? (
								<ActivityIndicator color="#FFFFFF" />
							) : (
								<Text style={styles.buttonText}>Create Account</Text>
							)}
						</TouchableOpacity>

						<View style={styles.footer}>
							<Text style={styles.footerText}>Already have an account? </Text>
							<Link href="/(auth)/login" asChild>
								<TouchableOpacity>
									<Text style={styles.linkText}>Log In</Text>
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
		backgroundColor: "#FFFFFF",
	},
	keyboardView: {
		flex: 1,
	},
	scrollContent: {
		flexGrow: 1,
		justifyContent: "center",
		paddingHorizontal: 24,
		paddingVertical: 32,
	},
	header: {
		alignItems: "center",
		marginBottom: 36,
	},
	logo: {
		fontSize: 40,
		fontWeight: "800",
		color: "#3B82F6",
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
	row: {
		flexDirection: "row",
		gap: 12,
	},
	halfInput: {
		flex: 1,
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
		backgroundColor: "#3B82F6",
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
		color: "#3B82F6",
		fontWeight: "600",
	},
});
