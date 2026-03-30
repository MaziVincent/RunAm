import { useState, useCallback, useRef } from "react";
import {
	View,
	Text,
	StyleSheet,
	FlatList,
	TextInput,
	TouchableOpacity,
	KeyboardAvoidingView,
	Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMessages, sendMessage } from "@runam/shared/api/chat";
import { useAuthStore } from "@runam/shared/stores/auth-store";
import type { ChatMessage } from "@runam/shared/types";

export default function RiderChatScreen() {
	const { id: errandId } = useLocalSearchParams<{ id: string }>();
	const queryClient = useQueryClient();
	const { user } = useAuthStore();
	const [message, setMessage] = useState("");
	const flatListRef = useRef<FlatList>(null);
	const currentUserId = user?.id ?? "";

	const { data: messagesData } = useQuery({
		queryKey: ["rider-chat", errandId],
		queryFn: () => getMessages(errandId!, { page: 1, pageSize: 50 }),
		refetchInterval: 5000,
	});

	const messages = messagesData?.items ?? [];

	const sendMutation = useMutation({
		mutationFn: (text: string) =>
			sendMessage(errandId!, {
				message: text,
				messageType: 0,
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["rider-chat", errandId] });
			setMessage("");
		},
	});

	const handleSend = useCallback(() => {
		const text = message.trim();
		if (!text) return;
		sendMutation.mutate(text);
	}, [message, sendMutation]);

	const renderMessage = ({ item }: { item: ChatMessage }) => {
		const isMe = item.senderId === currentUserId;
		return (
			<View
				style={[styles.bubble, isMe ? styles.myBubble : styles.theirBubble]}>
				{!isMe && <Text style={styles.senderName}>{item.senderName}</Text>}
				<Text
					style={[styles.messageText, isMe ? styles.myText : styles.theirText]}>
					{item.message}
				</Text>
				<Text
					style={[styles.timeText, isMe ? styles.myTime : styles.theirTime]}>
					{new Date(item.createdAt).toLocaleTimeString([], {
						hour: "2-digit",
						minute: "2-digit",
					})}
				</Text>
			</View>
		);
	};

	return (
		<SafeAreaView style={styles.container} edges={["bottom"]}>
			<KeyboardAvoidingView
				style={styles.flex}
				behavior={Platform.OS === "ios" ? "padding" : undefined}
				keyboardVerticalOffset={90}>
				<FlatList
					ref={flatListRef}
					data={[...messages].reverse()}
					keyExtractor={(item) => item.id}
					renderItem={renderMessage}
					contentContainerStyle={styles.list}
					inverted={false}
					onContentSizeChange={() =>
						flatListRef.current?.scrollToEnd({ animated: true })
					}
				/>

				<View style={styles.inputRow}>
					<TextInput
						style={styles.input}
						value={message}
						onChangeText={setMessage}
						placeholder="Type a message..."
						placeholderTextColor="#94A3B8"
						multiline
						maxLength={2000}
					/>
					<TouchableOpacity
						style={[styles.sendBtn, !message.trim() && styles.sendBtnDisabled]}
						onPress={handleSend}
						disabled={!message.trim() || sendMutation.isPending}>
						<Text style={styles.sendBtnText}>➤</Text>
					</TouchableOpacity>
				</View>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: "#F8FAFC" },
	flex: { flex: 1 },
	list: { padding: 16, paddingBottom: 8 },
	bubble: {
		maxWidth: "78%",
		borderRadius: 18,
		padding: 12,
		paddingBottom: 6,
		marginBottom: 8,
	},
	myBubble: {
		backgroundColor: "#2F8F4E",
		alignSelf: "flex-end",
		borderBottomRightRadius: 4,
	},
	theirBubble: {
		backgroundColor: "#FFFFFF",
		alignSelf: "flex-start",
		borderBottomLeftRadius: 4,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.05,
		shadowRadius: 2,
		elevation: 1,
	},
	senderName: {
		fontSize: 11,
		fontWeight: "600",
		color: "#2F8F4E",
		marginBottom: 3,
	},
	messageText: { fontSize: 15, lineHeight: 20 },
	myText: { color: "#FFFFFF" },
	theirText: { color: "#1E293B" },
	timeText: { fontSize: 10, marginTop: 4, alignSelf: "flex-end" },
	myTime: { color: "rgba(255,255,255,0.7)" },
	theirTime: { color: "#94A3B8" },
	inputRow: {
		flexDirection: "row",
		alignItems: "flex-end",
		padding: 12,
		paddingBottom: Platform.OS === "ios" ? 12 : 16,
		backgroundColor: "#FFFFFF",
		borderTopWidth: 1,
		borderTopColor: "#E2E8F0",
	},
	input: {
		flex: 1,
		backgroundColor: "#F1F5F9",
		borderRadius: 20,
		paddingHorizontal: 16,
		paddingVertical: 10,
		fontSize: 15,
		color: "#1E293B",
		maxHeight: 100,
		marginRight: 8,
	},
	sendBtn: {
		width: 42,
		height: 42,
		borderRadius: 21,
		backgroundColor: "#2F8F4E",
		justifyContent: "center",
		alignItems: "center",
	},
	sendBtnDisabled: { backgroundColor: "#94A3B8" },
	sendBtnText: { fontSize: 18, color: "#FFFFFF" },
});
