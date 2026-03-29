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

export default function RiderChangePasswordScreen() {
	const router = useRouter();
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");

	const mutation = useMutation({
		mutationFn: () => changePassword({ currentPassword, newPassword }),
		onSuccess: () => {
			Alert.alert("Success", "Your password has been changed", [
				{ text: "OK", onPress: () => router.back() },
			]);
		},
		onError: (err: Error) => {
			Alert.alert("Error", err.message);
		},
	});

	const handleSubmit = () => {
		if (!currentPassword || !newPassword || !confirmPassword) {
			Alert.alert("Error", "Please fill in all fields");
			return;
		}
		if (newPassword.length < 8) {
			Alert.alert("Error", "New password must be at least 8 characters");
			return;
		}
		if (newPassword !== confirmPassword) {
			Alert.alert("Error", "New passwords do not match");
			return;
		}
		mutation.mutate();
	};

	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<View style={styles.header}>
				<TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
					<Text style={styles.backText}>‹ Back</Text>
				</TouchableOpacity>
				<Text style={styles.title}>Change Password</Text>
				<View style={{ width: 60 }} />
			</View>

			<KeyboardAvoidingView
				style={styles.flex}
				behavior={Platform.OS === "ios" ? "padding" : undefined}>
				<ScrollView
					contentContainerStyle={styles.content}
					showsVerticalScrollIndicator={false}
					keyboardShouldPersistTaps="handled">
					<Text style={styles.label}>Current Password</Text>
					<TextInput
						style={styles.input}
						value={currentPassword}
						onChangeText={setCurrentPassword}
						placeholder="Enter current password"
						placeholderTextColor="#9CA3AF"
						secureTextEntry
					/>

					<Text style={styles.label}>New Password</Text>
					<TextInput
						style={styles.input}
						value={newPassword}
						onChangeText={setNewPassword}
						placeholder="Enter new password"
						placeholderTextColor="#9CA3AF"
						secureTextEntry
					/>

					<Text style={styles.label}>Confirm New Password</Text>
					<TextInput
						style={styles.input}
						value={confirmPassword}
						onChangeText={setConfirmPassword}
						placeholder="Confirm new password"
						placeholderTextColor="#9CA3AF"
						secureTextEntry
					/>

					<TouchableOpacity
						style={[
							styles.submitBtn,
							mutation.isPending && styles.buttonDisabled,
						]}
						onPress={handleSubmit}
						disabled={mutation.isPending}
						activeOpacity={0.8}>
						{mutation.isPending ? (
							<ActivityIndicator color="#FFFFFF" />
						) : (
							<Text style={styles.submitBtnText}>Update Password</Text>
						)}
					</TouchableOpacity>
				</ScrollView>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: "#F9FAFB" },
	flex: { flex: 1 },
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 20,
		paddingVertical: 12,
		borderBottomWidth: 1,
		borderBottomColor: "#F3F4F6",
		backgroundColor: "#FFFFFF",
	},
	backBtn: { width: 60 },
	backText: { fontSize: 17, color: "#3B82F6", fontWeight: "600" },
	title: { fontSize: 18, fontWeight: "700", color: "#111827" },
	content: { padding: 20, paddingBottom: 40 },
	label: {
		fontSize: 14,
		fontWeight: "600",
		color: "#374151",
		marginBottom: 6,
	},
	input: {
		backgroundColor: "#FFFFFF",
		borderWidth: 1,
		borderColor: "#E5E7EB",
		borderRadius: 12,
		paddingHorizontal: 16,
		paddingVertical: 14,
		fontSize: 16,
		color: "#111827",
		marginBottom: 16,
	},
	submitBtn: {
		backgroundColor: "#3B82F6",
		borderRadius: 12,
		paddingVertical: 16,
		alignItems: "center",
		marginTop: 8,
	},
	buttonDisabled: { opacity: 0.6 },
	submitBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
});
