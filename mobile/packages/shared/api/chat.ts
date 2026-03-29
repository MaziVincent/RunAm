import apiClient, { type PaginatedResult } from "./client";
import type { ChatMessage } from "../types";

// ── Get Messages ─────────────────────────────────────────────

interface GetMessagesParams {
	page?: number;
	pageSize?: number;
}

export function getMessages(
	errandId: string,
	params?: GetMessagesParams,
): Promise<PaginatedResult<ChatMessage>> {
	return apiClient.getPaginated<ChatMessage>(
		`/errands/${errandId}/messages`,
		params as Record<string, string | number | boolean | undefined>,
	);
}

// ── Send Message ─────────────────────────────────────────────

export interface SendMessageRequest {
	message: string;
	messageType?: number;
}

export function sendMessage(
	errandId: string,
	data: SendMessageRequest,
): Promise<ChatMessage> {
	return apiClient.post<ChatMessage>(`/errands/${errandId}/messages`, data);
}

// ── Mark Messages as Read ────────────────────────────────────

export function markMessagesAsRead(errandId: string): Promise<void> {
	return apiClient.patch<void>(`/errands/${errandId}/messages/read`);
}
