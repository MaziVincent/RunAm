import { useState, useCallback, useRef, useEffect } from "react";
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
import {
	getMessages,
	sendMessage,
	markMessagesAsRead,
} from "@runam/shared/api/chat";
import { useAuthStore } from "@runam/shared/stores/auth-store";
import { signalRService } from "@runam/shared/services/signalr";
import type { ChatMessage } from "@runam/shared/types";

const QUICK_REPLIES = [
	"I'm here",
	"On my way",
	"5 minutes away",
	"Please call me",
	"Thank you!",
];

export default function ChatScreen() {
	const { id: errandId } = useLocalSearchParams<{ id: string }>();
	const queryClient = useQueryClient();
	const { user } = useAuthStore();
	const [message, setMessage] = useState("");
	const [isConnected, setIsConnected] = useState(false);
	const flatListRef = useRef<FlatList>(null);
	const currentUserId = user?.id ?? "";

	const { data: messagesData } = useQuery({
		queryKey: ["chat", errandId],
		queryFn: () => getMessages(errandId!, { page: 1, pageSize: 50 }),
		refetchInterval: isConnected ? 30000 : 5000,
		enabled: !!errandId,
	});

	const messages = messagesData?.items ?? [];

	// SignalR real-time messages
	useEffect(() => {
		if (!errandId) return;

		const connect = async () => {
			try {
				await signalRService.connect("/hubs/chat");
				await signalRService.invoke("JoinChat", errandId);
				setIsConnected(true);

				// Mark existing messages as read
				markMessagesAsRead(errandId!).catch(() => {});

				signalRService.on<ChatMessage>("NewMessage", (msg) => {
					queryClient.setQueryData<ChatMessage[]>(["chat", errandId], (old) => {
						if (!old) return [msg];
						if (old.find((m) => m.id === msg.id)) return old;
						return [...old, msg];
					});
				});

				signalRService.on<string>("MessageRead", (_msgId) => {
					queryClient.invalidateQueries({ queryKey: ["chat", errandId] });
				});
			} catch (err) {
				console.warn("Chat SignalR failed, using polling", err);
			}
		};

		connect();

		return () => {
			signalRService.invoke("LeaveChat", errandId).catch(() => {});
			signalRService.off("NewMessage");
			signalRService.off("MessageRead");
			signalRService.disconnect();
		};
	}, [errandId]);

	const sendMutation = useMutation({
		mutationFn: (text: string) =>
			sendMessage(errandId!, {
				message: text,
				messageType: 0,
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["chat", errandId] });
			setMessage("");
		},
	});

	const handleSend = useCallback(() => {
		const text = message.trim();
		if (!text) return;
		sendMutation.mutate(text);
	}, [message, sendMutation]);

	const handleQuickReply = (text: string) => {
		sendMutation.mutate(text);
	};

	const renderMessage = ({ item }: { item: ChatMessage }) => {
		const isMe = item.senderId === currentUserId;
		return (
			<View
				style={[
					styles.messageBubble,
					isMe ? styles.myBubble : styles.otherBubble,
				]}>
				{!isMe && <Text style={styles.senderName}>{item.senderName}</Text>}
				<Text
					style={[
						styles.messageText,
						isMe ? styles.myMessageText : styles.otherMessageText,
					]}>
					{item.message}
				</Text>
				<Text
					style={[
						styles.timeText,
						isMe ? styles.myTimeText : styles.otherTimeText,
					]}>
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
				{/* Connection indicator */}
				{isConnected && (
					<View style={styles.liveBanner}>
						<View style={styles.liveDot} />
						<Text style={styles.liveText}>Live</Text>
					</View>
				)}

				<FlatList
					ref={flatListRef}
					data={[...messages].reverse()}
					keyExtractor={(item) => item.id}
					renderItem={renderMessage}
					contentContainerStyle={styles.messageList}
					inverted={false}
					onContentSizeChange={() =>
						flatListRef.current?.scrollToEnd({ animated: true })
					}
				/>

				{/* Quick replies */}
				<View style={styles.quickReplyRow}>
					{QUICK_REPLIES.map((qr) => (
						<TouchableOpacity
							key={qr}
							style={styles.quickReplyBtn}
							onPress={() => handleQuickReply(qr)}>
							<Text style={styles.quickReplyText}>{qr}</Text>
						</TouchableOpacity>
					))}
				</View>

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
						style={[
							styles.sendButton,
							!message.trim() && styles.sendButtonDisabled,
						]}
						onPress={handleSend}
						disabled={!message.trim() || sendMutation.isPending}>
						<Text style={styles.sendButtonText}>➤</Text>
					</TouchableOpacity>
				</View>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: "#F8FAFC" },
	flex: { flex: 1 },
	liveBanner: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 6,
		paddingVertical: 4,
		backgroundColor: "rgba(16,185,129,0.1)",
	},
	liveDot: {
		width: 6,
		height: 6,
		borderRadius: 3,
		backgroundColor: "#10B981",
	},
	liveText: { fontSize: 11, fontWeight: "700", color: "#10B981" },
	messageList: { padding: 16, paddingBottom: 8 },
	messageBubble: {
		maxWidth: "78%",
		borderRadius: 18,
		padding: 12,
		paddingBottom: 6,
		marginBottom: 8,
	},
	myBubble: {
		backgroundColor: "#3B82F6",
		alignSelf: "flex-end",
		borderBottomRightRadius: 4,
	},
	otherBubble: {
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
		color: "#3B82F6",
		marginBottom: 3,
	},
	messageText: { fontSize: 15, lineHeight: 20 },
	myMessageText: { color: "#FFFFFF" },
	otherMessageText: { color: "#1E293B" },
	timeText: { fontSize: 10, marginTop: 4, alignSelf: "flex-end" },
	myTimeText: { color: "rgba(255,255,255,0.7)" },
	otherTimeText: { color: "#94A3B8" },
	quickReplyRow: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 6,
		paddingHorizontal: 12,
		paddingVertical: 8,
		backgroundColor: "#FFFFFF",
		borderTopWidth: 1,
		borderTopColor: "#F1F5F9",
	},
	quickReplyBtn: {
		backgroundColor: "#F1F5F9",
		borderRadius: 16,
		paddingHorizontal: 12,
		paddingVertical: 6,
	},
	quickReplyText: { fontSize: 12, color: "#3B82F6", fontWeight: "600" },
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
	sendButton: {
		width: 42,
		height: 42,
		borderRadius: 21,
		backgroundColor: "#3B82F6",
		justifyContent: "center",
		alignItems: "center",
	},
	sendButtonDisabled: { backgroundColor: "#94A3B8" },
	sendButtonText: { fontSize: 18, color: "#FFFFFF" },
});
