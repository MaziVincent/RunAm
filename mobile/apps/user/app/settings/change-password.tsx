import { useState } from "react";
import {
	View,
	Text,
	StyleSheet,
	TextInput,
	TouchableOpacity,
	Alert,
	ActivityIndicator,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { changePassword } from "@runam/shared/api/auth";

export default function ChangePasswordScreen() {
	const router = useRouter();
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [showCurrent, setShowCurrent] = useState(false);
	const [showNew, setShowNew] = useState(false);

	const mutation = useMutation({
		mutationFn: () =>
			changePassword({
				currentPassword: currentPassword.trim(),
				newPassword: newPassword.trim(),
			}),
		onSuccess: () => {
			Alert.alert("Success", "Password changed successfully.", [
				{ text: "OK", onPress: () => router.back() },
			]);
		},
		onError: (err: any) => {
			Alert.alert(
				"Error",
				err?.message || "Failed to change password. Please try again.",
			);
		},
	});

	const handleSubmit = () => {
		if (!currentPassword.trim()) {
			Alert.alert("Error", "Please enter your current password.");
			return;
		}
		if (newPassword.length < 8) {
			Alert.alert("Error", "New password must be at least 8 characters.");
			return;
		}
		if (newPassword !== confirmPassword) {
			Alert.alert("Error", "New passwords do not match.");
			return;
		}
		if (currentPassword === newPassword) {
			Alert.alert(
				"Error",
				"New password must be different from current password.",
			);
			return;
		}
		mutation.mutate();
	};

	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<KeyboardAvoidingView
				style={{ flex: 1 }}
				behavior={Platform.OS === "ios" ? "padding" : undefined}>
				<ScrollView contentContainerStyle={styles.content}>
					<View style={styles.header}>
						<TouchableOpacity onPress={() => router.back()}>
							<Text style={styles.backBtn}>← Back</Text>
						</TouchableOpacity>
						<Text style={styles.title}>Change Password</Text>
						<Text style={styles.subtitle}>
							Enter your current password and choose a new one.
						</Text>
					</View>

					{/* Current password */}
					<View style={styles.fieldGroup}>
						<Text style={styles.label}>Current Password</Text>
						<View style={styles.inputRow}>
							<TextInput
								style={styles.input}
								placeholder="Enter current password"
								placeholderTextColor="#9CA3AF"
								value={currentPassword}
								onChangeText={setCurrentPassword}
								secureTextEntry={!showCurrent}
								autoCapitalize="none"
							/>
							<TouchableOpacity
								style={styles.eyeBtn}
								onPress={() => setShowCurrent(!showCurrent)}>
								<Text style={styles.eyeText}>{showCurrent ? "🙈" : "👁"}</Text>
							</TouchableOpacity>
						</View>
					</View>

					{/* New password */}
					<View style={styles.fieldGroup}>
						<Text style={styles.label}>New Password</Text>
						<View style={styles.inputRow}>
							<TextInput
								style={styles.input}
								placeholder="At least 8 characters"
								placeholderTextColor="#9CA3AF"
								value={newPassword}
								onChangeText={setNewPassword}
								secureTextEntry={!showNew}
								autoCapitalize="none"
							/>
							<TouchableOpacity
								style={styles.eyeBtn}
								onPress={() => setShowNew(!showNew)}>
								<Text style={styles.eyeText}>{showNew ? "🙈" : "👁"}</Text>
							</TouchableOpacity>
						</View>
						{newPassword.length > 0 && newPassword.length < 8 && (
							<Text style={styles.hint}>Must be at least 8 characters</Text>
						)}
					</View>

					{/* Confirm password */}
					<View style={styles.fieldGroup}>
						<Text style={styles.label}>Confirm New Password</Text>
						<TextInput
							style={[
								styles.inputFull,
								confirmPassword.length > 0 &&
									confirmPassword !== newPassword &&
									styles.inputError,
							]}
							placeholder="Re-enter new password"
							placeholderTextColor="#9CA3AF"
							value={confirmPassword}
							onChangeText={setConfirmPassword}
							secureTextEntry
							autoCapitalize="none"
						/>
						{confirmPassword.length > 0 && confirmPassword !== newPassword && (
							<Text style={styles.errorHint}>Passwords do not match</Text>
						)}
					</View>

					{/* Submit */}
					<TouchableOpacity
						style={[styles.submitBtn, mutation.isPending && { opacity: 0.6 }]}
						onPress={handleSubmit}
						disabled={mutation.isPending}>
						{mutation.isPending ? (
							<ActivityIndicator color="#FFF" />
						) : (
							<Text style={styles.submitBtnText}>Change Password</Text>
						)}
					</TouchableOpacity>
				</ScrollView>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: "#F8FAFC" },
	content: { padding: 20, paddingBottom: 40 },
	header: { marginBottom: 28 },
	backBtn: { fontSize: 15, color: "#2F8F4E", fontWeight: "600" },
	title: {
		fontSize: 24,
		fontWeight: "800",
		color: "#1E293B",
		marginTop: 12,
	},
	subtitle: { fontSize: 14, color: "#64748B", marginTop: 4 },
	fieldGroup: { marginBottom: 20 },
	label: {
		fontSize: 14,
		fontWeight: "600",
		color: "#374151",
		marginBottom: 8,
	},
	inputRow: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#FFFFFF",
		borderWidth: 1,
		borderColor: "#E5E7EB",
		borderRadius: 12,
	},
	input: {
		flex: 1,
		paddingHorizontal: 16,
		paddingVertical: 14,
		fontSize: 16,
		color: "#111827",
	},
	inputFull: {
		backgroundColor: "#FFFFFF",
		borderWidth: 1,
		borderColor: "#E5E7EB",
		borderRadius: 12,
		paddingHorizontal: 16,
		paddingVertical: 14,
		fontSize: 16,
		color: "#111827",
	},
	inputError: { borderColor: "#EF4444" },
	eyeBtn: { paddingHorizontal: 14 },
	eyeText: { fontSize: 18 },
	hint: { fontSize: 12, color: "#F59E0B", marginTop: 4, marginLeft: 4 },
	errorHint: { fontSize: 12, color: "#EF4444", marginTop: 4, marginLeft: 4 },
	submitBtn: {
		backgroundColor: "#2F8F4E",
		borderRadius: 14,
		paddingVertical: 16,
		alignItems: "center",
		marginTop: 12,
	},
	submitBtnText: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },
});
