import { useState } from "react";
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	TextInput,
	TouchableOpacity,
	FlatList,
	Alert,
	ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
	getSupportTickets,
	createSupportTicket,
	replyToTicket,
} from "@runam/shared/api/support";
import type {
	SupportTicket,
	CreateSupportTicketRequest,
} from "@runam/shared/types";

type ScreenMode = "list" | "new" | "detail";

const CATEGORIES = [
	{ key: "Delivery", label: "Delivery Issue", icon: "📦" },
	{ key: "Payment", label: "Payment Problem", icon: "💳" },
	{ key: "Account", label: "Account Help", icon: "👤" },
	{ key: "App", label: "App Bug", icon: "🐛" },
	{ key: "Other", label: "Other", icon: "❓" },
];

export default function SupportScreen() {
	const router = useRouter();
	const queryClient = useQueryClient();
	const [mode, setMode] = useState<ScreenMode>("list");
	const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(
		null,
	);
	const [category, setCategory] = useState("");
	const [subject, setSubject] = useState("");
	const [description, setDescription] = useState("");
	const [replyText, setReplyText] = useState("");

	const { data: tickets = [], isLoading } = useQuery<SupportTicket[]>({
		queryKey: ["support-tickets"],
		queryFn: getSupportTickets,
	});

	const createMutation = useMutation({
		mutationFn: (data: CreateSupportTicketRequest) => createSupportTicket(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
			setMode("list");
			setCategory("");
			setSubject("");
			setDescription("");
			Alert.alert("Ticket Created", "We'll get back to you shortly.");
		},
		onError: (err: any) =>
			Alert.alert("Error", err?.message || "Failed to create ticket."),
	});

	const replyMutation = useMutation({
		mutationFn: (text: string) => replyToTicket(selectedTicket!.id, text),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
			setReplyText("");
			Alert.alert("Sent", "Your reply has been sent.");
		},
	});

	const handleCreate = () => {
		if (!category) {
			Alert.alert("Error", "Please select a category.");
			return;
		}
		if (!subject.trim() || !description.trim()) {
			Alert.alert("Error", "Please fill in all fields.");
			return;
		}
		createMutation.mutate({
			category,
			subject: subject.trim(),
			message: description.trim(),
		});
	};

	const statusColor = (status: string) => {
		switch (status) {
			case "Open":
				return "#F59E0B";
			case "InProgress":
				return "#2F8F4E";
			case "Resolved":
				return "#10B981";
			case "Closed":
				return "#6B7280";
			default:
				return "#9CA3AF";
		}
	};

	// List of tickets
	if (mode === "list") {
		return (
			<SafeAreaView style={styles.container} edges={["bottom"]}>
				<View style={styles.header}>
					<Text style={styles.headerTitle}>Support</Text>
					<TouchableOpacity
						style={styles.newBtn}
						onPress={() => setMode("new")}>
						<Text style={styles.newBtnText}>+ New Ticket</Text>
					</TouchableOpacity>
				</View>

				{isLoading ? (
					<View style={styles.centered}>
						<ActivityIndicator size="large" color="#2F8F4E" />
					</View>
				) : tickets.length === 0 ? (
					<View style={styles.centered}>
						<Text style={styles.emptyIcon}>🎧</Text>
						<Text style={styles.emptyTitle}>No support tickets</Text>
						<Text style={styles.emptySubtitle}>
							Need help? Create a new ticket
						</Text>
					</View>
				) : (
					<FlatList
						data={tickets}
						keyExtractor={(item) => item.id}
						contentContainerStyle={styles.listContent}
						renderItem={({ item }) => (
							<TouchableOpacity
								style={styles.ticketCard}
								onPress={() => {
									setSelectedTicket(item);
									setMode("detail");
								}}>
								<View style={styles.ticketTop}>
									<Text style={styles.ticketSubject} numberOfLines={1}>
										{item.subject}
									</Text>
									<View
										style={[
											styles.statusBadge,
											{ backgroundColor: statusColor(item.status) + "18" },
										]}>
										<Text
											style={[
												styles.statusText,
												{ color: statusColor(item.status) },
											]}>
											{item.status}
										</Text>
									</View>
								</View>
								<Text style={styles.ticketDesc} numberOfLines={2}>
									{item.message}
								</Text>
								<Text style={styles.ticketDate}>
									{new Date(item.createdAt).toLocaleDateString()}
								</Text>
							</TouchableOpacity>
						)}
					/>
				)}
			</SafeAreaView>
		);
	}

	// New ticket form
	if (mode === "new") {
		return (
			<SafeAreaView style={styles.container} edges={["bottom"]}>
				<View style={styles.header}>
					<TouchableOpacity onPress={() => setMode("list")}>
						<Text style={styles.backText}>← Back</Text>
					</TouchableOpacity>
					<Text style={styles.headerTitle}>New Ticket</Text>
					<View style={{ width: 60 }} />
				</View>

				<ScrollView contentContainerStyle={styles.formContent}>
					<Text style={styles.label}>Category</Text>
					<View style={styles.categoryGrid}>
						{CATEGORIES.map((cat) => (
							<TouchableOpacity
								key={cat.key}
								style={[
									styles.categoryCard,
									category === cat.key && styles.categoryCardActive,
								]}
								onPress={() => setCategory(cat.key)}>
								<Text style={styles.categoryIcon}>{cat.icon}</Text>
								<Text
									style={[
										styles.categoryLabel,
										category === cat.key && styles.categoryLabelActive,
									]}>
									{cat.label}
								</Text>
							</TouchableOpacity>
						))}
					</View>

					<Text style={styles.label}>Subject</Text>
					<TextInput
						style={styles.input}
						placeholder="Brief summary of your issue"
						placeholderTextColor="#9CA3AF"
						value={subject}
						onChangeText={setSubject}
					/>

					<Text style={styles.label}>Description</Text>
					<TextInput
						style={[styles.input, styles.textArea]}
						placeholder="Describe your issue in detail..."
						placeholderTextColor="#9CA3AF"
						value={description}
						onChangeText={setDescription}
						multiline
						numberOfLines={6}
					/>

					<TouchableOpacity
						style={[
							styles.submitBtn,
							createMutation.isPending && { opacity: 0.6 },
						]}
						onPress={handleCreate}
						disabled={createMutation.isPending}>
						{createMutation.isPending ? (
							<ActivityIndicator color="#FFF" />
						) : (
							<Text style={styles.submitBtnText}>Submit Ticket</Text>
						)}
					</TouchableOpacity>
				</ScrollView>
			</SafeAreaView>
		);
	}

	// Ticket detail
	return (
		<SafeAreaView style={styles.container} edges={["bottom"]}>
			<View style={styles.header}>
				<TouchableOpacity onPress={() => setMode("list")}>
					<Text style={styles.backText}>← Back</Text>
				</TouchableOpacity>
				<Text style={styles.headerTitle}>Ticket</Text>
				<View style={{ width: 60 }} />
			</View>

			<ScrollView contentContainerStyle={styles.formContent}>
				{selectedTicket && (
					<>
						<View style={styles.detailCard}>
							<Text style={styles.detailSubject}>{selectedTicket.subject}</Text>
							<View
								style={[
									styles.statusBadge,
									{
										backgroundColor: statusColor(selectedTicket.status) + "18",
										alignSelf: "flex-start",
									},
								]}>
								<Text
									style={[
										styles.statusText,
										{ color: statusColor(selectedTicket.status) },
									]}>
									{selectedTicket.status}
								</Text>
							</View>
							<Text style={styles.detailDesc}>{selectedTicket.message}</Text>
							<Text style={styles.detailDate}>
								{new Date(selectedTicket.createdAt).toLocaleString()}
							</Text>
						</View>

						{/* Replies */}
						{selectedTicket.replies?.map((reply, idx) => (
							<View
								key={idx}
								style={[
									styles.replyCard,
									reply.isStaff ? styles.staffReply : styles.userReply,
								]}>
								<Text style={styles.replyAuthor}>
									{reply.isStaff ? "🎧 Support" : "👤 You"}
								</Text>
								<Text style={styles.replyText}>{reply.message}</Text>
								<Text style={styles.replyDate}>
									{new Date(reply.createdAt).toLocaleTimeString([], {
										hour: "2-digit",
										minute: "2-digit",
									})}
								</Text>
							</View>
						))}

						{/* Reply input */}
						{selectedTicket.status !== "Closed" &&
							selectedTicket.status !== "Resolved" && (
								<View style={styles.replyInputRow}>
									<TextInput
										style={styles.replyInput}
										placeholder="Type a reply..."
										placeholderTextColor="#9CA3AF"
										value={replyText}
										onChangeText={setReplyText}
										multiline
									/>
									<TouchableOpacity
										style={styles.replySendBtn}
										onPress={() =>
											replyText.trim() && replyMutation.mutate(replyText.trim())
										}
										disabled={!replyText.trim() || replyMutation.isPending}>
										<Text style={styles.replySendText}>Send</Text>
									</TouchableOpacity>
								</View>
							)}
					</>
				)}
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: "#F9FAFB" },
	centered: { flex: 1, alignItems: "center", justifyContent: "center" },
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 20,
		paddingVertical: 16,
		backgroundColor: "#FFFFFF",
		borderBottomWidth: 1,
		borderBottomColor: "#F3F4F6",
	},
	headerTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },
	backText: { fontSize: 15, fontWeight: "600", color: "#2F8F4E" },
	newBtn: {
		backgroundColor: "#2F8F4E",
		borderRadius: 10,
		paddingHorizontal: 14,
		paddingVertical: 8,
	},
	newBtnText: { fontSize: 13, fontWeight: "700", color: "#FFFFFF" },
	listContent: { padding: 20 },
	ticketCard: {
		backgroundColor: "#FFFFFF",
		borderRadius: 14,
		padding: 16,
		marginBottom: 12,
		borderWidth: 1,
		borderColor: "#F3F4F6",
	},
	ticketTop: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 8,
	},
	ticketSubject: {
		fontSize: 15,
		fontWeight: "700",
		color: "#111827",
		flex: 1,
		marginRight: 10,
	},
	statusBadge: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
	statusText: { fontSize: 11, fontWeight: "700" },
	ticketDesc: { fontSize: 13, color: "#6B7280", marginBottom: 8 },
	ticketDate: { fontSize: 12, color: "#9CA3AF" },
	emptyIcon: { fontSize: 48, marginBottom: 12 },
	emptyTitle: { fontSize: 18, fontWeight: "600", color: "#374151" },
	emptySubtitle: { fontSize: 14, color: "#9CA3AF", marginTop: 4 },
	formContent: { padding: 20 },
	label: {
		fontSize: 14,
		fontWeight: "600",
		color: "#374151",
		marginBottom: 8,
		marginTop: 16,
	},
	categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
	categoryCard: {
		backgroundColor: "#FFFFFF",
		borderRadius: 12,
		padding: 14,
		alignItems: "center",
		width: "30%",
		borderWidth: 2,
		borderColor: "#E5E7EB",
	},
	categoryCardActive: { borderColor: "#2F8F4E", backgroundColor: "#F0FDF4" },
	categoryIcon: { fontSize: 24, marginBottom: 6 },
	categoryLabel: {
		fontSize: 11,
		fontWeight: "600",
		color: "#374151",
		textAlign: "center",
	},
	categoryLabelActive: { color: "#2F8F4E" },
	input: {
		backgroundColor: "#FFFFFF",
		borderWidth: 1,
		borderColor: "#E5E7EB",
		borderRadius: 12,
		paddingHorizontal: 16,
		paddingVertical: 14,
		fontSize: 15,
		color: "#111827",
	},
	textArea: { minHeight: 120, textAlignVertical: "top" },
	submitBtn: {
		backgroundColor: "#2F8F4E",
		borderRadius: 14,
		paddingVertical: 16,
		alignItems: "center",
		marginTop: 24,
	},
	submitBtnText: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },
	detailCard: {
		backgroundColor: "#FFFFFF",
		borderRadius: 14,
		padding: 20,
		marginBottom: 16,
		borderWidth: 1,
		borderColor: "#F3F4F6",
	},
	detailSubject: {
		fontSize: 18,
		fontWeight: "700",
		color: "#111827",
		marginBottom: 10,
	},
	detailDesc: { fontSize: 14, color: "#374151", lineHeight: 22, marginTop: 12 },
	detailDate: { fontSize: 12, color: "#9CA3AF", marginTop: 12 },
	replyCard: {
		borderRadius: 14,
		padding: 14,
		marginBottom: 8,
	},
	staffReply: {
		backgroundColor: "#F0FDF4",
		borderWidth: 1,
		borderColor: "#BFDBFE",
	},
	userReply: {
		backgroundColor: "#FFFFFF",
		borderWidth: 1,
		borderColor: "#F3F4F6",
	},
	replyAuthor: {
		fontSize: 12,
		fontWeight: "700",
		color: "#374151",
		marginBottom: 4,
	},
	replyText: { fontSize: 14, color: "#111827", lineHeight: 20 },
	replyDate: {
		fontSize: 10,
		color: "#9CA3AF",
		marginTop: 6,
		alignSelf: "flex-end",
	},
	replyInputRow: {
		flexDirection: "row",
		gap: 10,
		marginTop: 16,
		alignItems: "flex-end",
	},
	replyInput: {
		flex: 1,
		backgroundColor: "#FFFFFF",
		borderWidth: 1,
		borderColor: "#E5E7EB",
		borderRadius: 14,
		paddingHorizontal: 14,
		paddingVertical: 12,
		fontSize: 14,
		color: "#111827",
		maxHeight: 100,
	},
	replySendBtn: {
		backgroundColor: "#2F8F4E",
		borderRadius: 12,
		paddingHorizontal: 18,
		paddingVertical: 14,
	},
	replySendText: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },
});
