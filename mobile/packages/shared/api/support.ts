import apiClient from "./client";
import type { SupportTicket, CreateSupportTicketRequest } from "../types";

// ── Create Ticket ────────────────────────────────────────────

export function createSupportTicket(
	data: CreateSupportTicketRequest,
): Promise<SupportTicket> {
	return apiClient.post<SupportTicket>("/support/tickets", data);
}

// ── List Tickets ─────────────────────────────────────────────

export function getSupportTickets(): Promise<SupportTicket[]> {
	return apiClient.get<SupportTicket[]>("/support/tickets");
}

// ── Get Ticket by ID ─────────────────────────────────────────

export function getSupportTicket(id: string): Promise<SupportTicket> {
	return apiClient.get<SupportTicket>(`/support/tickets/${id}`);
}

// ── Reply to Ticket ──────────────────────────────────────────

export function replyToTicket(
	id: string,
	message: string,
): Promise<SupportTicket> {
	return apiClient.post<SupportTicket>(`/support/tickets/${id}/replies`, {
		message,
	});
}
