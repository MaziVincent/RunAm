import { useState } from "react";
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	TextInput,
	Alert,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import apiClient from "@runam/shared/api/client";

export default function RateErrandScreen() {
	const { id: errandId } = useLocalSearchParams<{ id: string }>();
	const router = useRouter();
	const [rating, setRating] = useState(0);
	const [comment, setComment] = useState("");
	const [submitted, setSubmitted] = useState(false);

	const submitMutation = useMutation({
		mutationFn: () =>
			apiClient.post("/reviews", {
				errandId,
				rating,
				comment: comment.trim() || null,
			}),
		onSuccess: () => {
			setSubmitted(true);
		},
		onError: (err: Error) => {
			Alert.alert("Error", err.message);
		},
	});

	if (submitted) {
		return (
			<SafeAreaView style={styles.container} edges={["top"]}>
				<View style={styles.successContainer}>
					<Text style={styles.successIcon}>🎉</Text>
					<Text style={styles.successTitle}>Thank You!</Text>
					<Text style={styles.successSubtext}>
						Your {rating}-star rating has been submitted.
					</Text>
					<TouchableOpacity
						style={styles.doneBtn}
						onPress={() => router.back()}>
						<Text style={styles.doneBtnText}>Done</Text>
					</TouchableOpacity>
				</View>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<KeyboardAvoidingView
				style={styles.flex}
				behavior={Platform.OS === "ios" ? "padding" : undefined}>
				<ScrollView
					contentContainerStyle={styles.content}
					showsVerticalScrollIndicator={false}>
					<Text style={styles.title}>Rate Your Delivery</Text>
					<Text style={styles.subtitle}>
						How was your experience with our rider?
					</Text>

					{/* Star Selection */}
					<View style={styles.starRow}>
						{[1, 2, 3, 4, 5].map((star) => (
							<TouchableOpacity
								key={star}
								onPress={() => setRating(star)}
								style={styles.starBtn}>
								<Text
									style={[
										styles.starIcon,
										star <= rating && styles.starIconActive,
									]}>
									★
								</Text>
							</TouchableOpacity>
						))}
					</View>

					{rating > 0 && (
						<Text style={styles.ratingLabel}>{ratingLabels[rating]}</Text>
					)}

					{/* Comment */}
					<View style={styles.commentSection}>
						<Text style={styles.commentLabel}>Leave a comment (optional)</Text>
						<TextInput
							style={styles.commentInput}
							value={comment}
							onChangeText={setComment}
							placeholder="Tell us about your experience..."
							placeholderTextColor="#94A3B8"
							multiline
							maxLength={2000}
							textAlignVertical="top"
						/>
					</View>

					{/* Submit */}
					<TouchableOpacity
						style={[styles.submitBtn, rating === 0 && styles.submitBtnDisabled]}
						onPress={() => submitMutation.mutate()}
						disabled={rating === 0 || submitMutation.isPending}>
						<Text style={styles.submitBtnText}>
							{submitMutation.isPending ? "Submitting..." : "Submit Review"}
						</Text>
					</TouchableOpacity>

					<TouchableOpacity
						style={styles.skipBtn}
						onPress={() => router.back()}>
						<Text style={styles.skipBtnText}>Skip</Text>
					</TouchableOpacity>
				</ScrollView>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}

const ratingLabels: Record<number, string> = {
	1: "Poor",
	2: "Fair",
	3: "Good",
	4: "Very Good",
	5: "Excellent!",
};

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: "#F8FAFC" },
	flex: { flex: 1 },
	content: { padding: 24, alignItems: "center" },
	title: {
		fontSize: 24,
		fontWeight: "800",
		color: "#1E293B",
		marginTop: 40,
		textAlign: "center",
	},
	subtitle: {
		fontSize: 15,
		color: "#64748B",
		marginTop: 8,
		textAlign: "center",
	},
	starRow: {
		flexDirection: "row",
		justifyContent: "center",
		marginTop: 32,
		gap: 12,
	},
	starBtn: { padding: 4 },
	starIcon: { fontSize: 48, color: "#CBD5E1" },
	starIconActive: { color: "#FBBF24" },
	ratingLabel: {
		fontSize: 16,
		fontWeight: "600",
		color: "#3B82F6",
		marginTop: 12,
		textAlign: "center",
	},
	commentSection: { width: "100%", marginTop: 32 },
	commentLabel: {
		fontSize: 14,
		fontWeight: "600",
		color: "#334155",
		marginBottom: 8,
	},
	commentInput: {
		backgroundColor: "#FFFFFF",
		borderRadius: 14,
		borderWidth: 1,
		borderColor: "#E2E8F0",
		padding: 14,
		fontSize: 15,
		color: "#1E293B",
		height: 120,
	},
	submitBtn: {
		width: "100%",
		backgroundColor: "#3B82F6",
		borderRadius: 14,
		paddingVertical: 16,
		alignItems: "center",
		marginTop: 28,
	},
	submitBtnDisabled: { backgroundColor: "#94A3B8" },
	submitBtnText: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },
	skipBtn: {
		paddingVertical: 14,
		alignItems: "center",
		marginTop: 8,
	},
	skipBtnText: { fontSize: 14, fontWeight: "500", color: "#64748B" },
	successContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: 24,
	},
	successIcon: { fontSize: 64 },
	successTitle: {
		fontSize: 24,
		fontWeight: "800",
		color: "#1E293B",
		marginTop: 16,
	},
	successSubtext: {
		fontSize: 15,
		color: "#64748B",
		marginTop: 8,
		textAlign: "center",
	},
	doneBtn: {
		backgroundColor: "#3B82F6",
		borderRadius: 14,
		paddingVertical: 14,
		paddingHorizontal: 48,
		marginTop: 32,
	},
	doneBtnText: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },
});
