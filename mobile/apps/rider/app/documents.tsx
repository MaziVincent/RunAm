import { useState, useCallback } from "react";
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	Alert,
	ActivityIndicator,
	ScrollView,
	RefreshControl,
	Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { getRiderProfile } from "@runam/shared/api/rider";
import { uploadRiderDocument, deleteFile } from "@runam/shared/api/files";
import type { RiderProfile } from "@runam/shared/types";

interface DocumentType {
	key: string;
	label: string;
	icon: string;
	required: boolean;
}

const DOCUMENT_TYPES: DocumentType[] = [
	{ key: "governmentId", label: "Government ID", icon: "🪪", required: true },
	{
		key: "driversLicense",
		label: "Driver's License",
		icon: "🪪",
		required: true,
	},
	{
		key: "vehicleRegistration",
		label: "Vehicle Registration",
		icon: "📋",
		required: false,
	},
	{
		key: "insurance",
		label: "Insurance Certificate",
		icon: "🛡️",
		required: false,
	},
];

export default function DocumentsScreen() {
	const router = useRouter();
	const queryClient = useQueryClient();
	const [refreshing, setRefreshing] = useState(false);
	const [uploadingKey, setUploadingKey] = useState<string | null>(null);
	const [uploadedDocs, setUploadedDocs] = useState<Record<string, string>>({});

	const {
		data: profile,
		refetch,
		isLoading,
	} = useQuery<RiderProfile>({
		queryKey: ["rider", "profile"],
		queryFn: () => getRiderProfile(),
	});

	const onRefresh = useCallback(async () => {
		setRefreshing(true);
		await refetch();
		setRefreshing(false);
	}, [refetch]);

	const uploadMutation = useMutation({
		mutationFn: async ({ key, uri }: { key: string; uri: string }) => {
			const filename = uri.split("/").pop() || "document.jpg";
			const ext = filename.split(".").pop()?.toLowerCase() || "jpg";
			const mimeType =
				ext === "png"
					? "image/png"
					: ext === "pdf"
						? "application/pdf"
						: "image/jpeg";
			return uploadRiderDocument({
				uri,
				name: `${key}_${Date.now()}.${ext}`,
				type: mimeType,
			});
		},
		onSuccess: (result, { key }) => {
			setUploadedDocs((prev) => ({ ...prev, [key]: result.url }));
			setUploadingKey(null);
			queryClient.invalidateQueries({ queryKey: ["rider", "profile"] });
			Alert.alert("Success", "Document uploaded");
		},
		onError: (err: Error) => {
			setUploadingKey(null);
			Alert.alert("Upload Failed", err.message);
		},
	});

	const handleUpload = async (docType: DocumentType) => {
		const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
		if (status !== "granted") {
			Alert.alert(
				"Permission Required",
				"Please allow access to your photo library",
			);
			return;
		}

		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ["images"],
			allowsEditing: false,
			quality: 0.8,
		});

		if (!result.canceled && result.assets[0]) {
			setUploadingKey(docType.key);
			uploadMutation.mutate({
				key: docType.key,
				uri: result.assets[0].uri,
			});
		}
	};

	const handleRemove = (docType: DocumentType) => {
		const url = uploadedDocs[docType.key];
		if (!url) return;

		Alert.alert("Remove Document", `Remove ${docType.label}?`, [
			{ text: "Cancel", style: "cancel" },
			{
				text: "Remove",
				style: "destructive",
				onPress: async () => {
					try {
						await deleteFile(url);
						setUploadedDocs((prev) => {
							const next = { ...prev };
							delete next[docType.key];
							return next;
						});
						queryClient.invalidateQueries({ queryKey: ["rider", "profile"] });
					} catch {
						Alert.alert(
							"Error",
							"Failed to delete document. Please try again.",
						);
					}
				},
			},
		]);
	};

	if (isLoading) {
		return (
			<View style={styles.centered}>
				<ActivityIndicator size="large" color="#3B82F6" />
			</View>
		);
	}

	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<View style={styles.header}>
				<TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
					<Text style={styles.backText}>‹ Back</Text>
				</TouchableOpacity>
				<Text style={styles.title}>Documents</Text>
				<View style={{ width: 60 }} />
			</View>

			<ScrollView
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={onRefresh}
						tintColor="#3B82F6"
					/>
				}>
				<Text style={styles.subtitle}>
					Upload required documents to verify your rider account. Accepted
					formats: JPEG, PNG.
				</Text>

				{DOCUMENT_TYPES.map((doc) => {
					const uploaded = uploadedDocs[doc.key];
					const isUploading = uploadingKey === doc.key;

					return (
						<View key={doc.key} style={styles.docCard}>
							<View style={styles.docHeader}>
								<Text style={styles.docIcon}>{doc.icon}</Text>
								<View style={styles.docInfo}>
									<Text style={styles.docLabel}>{doc.label}</Text>
									<Text style={styles.docRequired}>
										{doc.required ? "Required" : "Optional"}
									</Text>
								</View>
								{uploaded && (
									<View style={styles.uploadedBadge}>
										<Text style={styles.uploadedText}>✅ Uploaded</Text>
									</View>
								)}
							</View>

							{uploaded && (
								<Image
									source={{ uri: uploaded }}
									style={styles.docPreview}
									resizeMode="cover"
								/>
							)}

							<View style={styles.docActions}>
								<TouchableOpacity
									style={[
										styles.uploadBtn,
										isUploading && styles.buttonDisabled,
									]}
									onPress={() => handleUpload(doc)}
									disabled={isUploading}>
									{isUploading ? (
										<ActivityIndicator color="#3B82F6" size="small" />
									) : (
										<Text style={styles.uploadBtnText}>
											{uploaded ? "Replace" : "Upload"}
										</Text>
									)}
								</TouchableOpacity>
								{uploaded && (
									<TouchableOpacity
										style={styles.removeBtn}
										onPress={() => handleRemove(doc)}>
										<Text style={styles.removeBtnText}>Remove</Text>
									</TouchableOpacity>
								)}
							</View>
						</View>
					);
				})}

				{profile && (
					<View style={styles.verificationCard}>
						<Text style={styles.verificationIcon}>
							{profile.isVerified ? "✅" : "⏳"}
						</Text>
						<Text style={styles.verificationTitle}>
							{profile.isVerified ? "Account Verified" : "Verification Pending"}
						</Text>
						<Text style={styles.verificationDesc}>
							{profile.isVerified
								? "Your documents have been verified. You can start accepting deliveries."
								: "Upload all required documents. Verification typically takes 24-48 hours."}
						</Text>
					</View>
				)}
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: "#F9FAFB" },
	centered: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "#F9FAFB",
	},
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
	subtitle: {
		fontSize: 14,
		color: "#6B7280",
		lineHeight: 20,
		marginBottom: 20,
	},
	docCard: {
		backgroundColor: "#FFFFFF",
		borderRadius: 16,
		padding: 18,
		marginBottom: 14,
		borderWidth: 1,
		borderColor: "#F3F4F6",
	},
	docHeader: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 12,
	},
	docIcon: { fontSize: 28, marginRight: 12 },
	docInfo: { flex: 1 },
	docLabel: { fontSize: 15, fontWeight: "600", color: "#111827" },
	docRequired: { fontSize: 12, color: "#9CA3AF", marginTop: 2 },
	uploadedBadge: {
		backgroundColor: "#D1FAE5",
		paddingHorizontal: 10,
		paddingVertical: 4,
		borderRadius: 8,
	},
	uploadedText: { fontSize: 12, fontWeight: "600", color: "#10B981" },
	docPreview: {
		width: "100%",
		height: 120,
		borderRadius: 10,
		marginBottom: 12,
		backgroundColor: "#F3F4F6",
	},
	docActions: { flexDirection: "row", gap: 10 },
	uploadBtn: {
		flex: 1,
		backgroundColor: "#EFF6FF",
		borderRadius: 10,
		paddingVertical: 10,
		alignItems: "center",
	},
	buttonDisabled: { opacity: 0.6 },
	uploadBtnText: { fontSize: 14, fontWeight: "600", color: "#3B82F6" },
	removeBtn: {
		paddingHorizontal: 16,
		paddingVertical: 10,
		borderRadius: 10,
		backgroundColor: "#FEE2E2",
	},
	removeBtnText: { fontSize: 14, fontWeight: "600", color: "#EF4444" },
	verificationCard: {
		backgroundColor: "#FFFFFF",
		borderRadius: 16,
		padding: 24,
		alignItems: "center",
		marginTop: 8,
		borderWidth: 1,
		borderColor: "#F3F4F6",
	},
	verificationIcon: { fontSize: 36, marginBottom: 12 },
	verificationTitle: {
		fontSize: 18,
		fontWeight: "700",
		color: "#111827",
		marginBottom: 8,
	},
	verificationDesc: {
		fontSize: 14,
		color: "#6B7280",
		textAlign: "center",
		lineHeight: 20,
	},
});
