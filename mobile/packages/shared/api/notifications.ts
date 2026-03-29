import apiClient, { type PaginatedResult } from "./client";
import type { AppNotification, NotificationPreferences } from "../types";

// ── List Notifications ───────────────────────────────────────

interface GetNotificationsParams {
	page?: number;
	pageSize?: number;
}

export function getNotifications(
	params?: GetNotificationsParams,
): Promise<PaginatedResult<AppNotification>> {
	return apiClient.getPaginated<AppNotification>(
		"/notifications",
		params as Record<string, string | number | boolean | undefined>,
	);
}

// ── Unread Count ─────────────────────────────────────────────

export interface UnreadCount {
	unreadCount: number;
}

export function getUnreadCount(): Promise<UnreadCount> {
	return apiClient.get<UnreadCount>("/notifications/unread-count");
}

// ── Mark as Read ─────────────────────────────────────────────

export function markAsRead(id: string): Promise<void> {
	return apiClient.patch<void>(`/notifications/${id}/read`);
}

export function markAllAsRead(): Promise<void> {
	return apiClient.patch<void>("/notifications/read-all");
}

// ── Preferences ──────────────────────────────────────────────

export function getNotificationPreferences(): Promise<NotificationPreferences> {
	return apiClient.get<NotificationPreferences>("/notifications/preferences");
}

export function updateNotificationPreferences(
	data: Partial<NotificationPreferences>,
): Promise<NotificationPreferences> {
	return apiClient.patch<NotificationPreferences>(
		"/notifications/preferences",
		data,
	);
}
