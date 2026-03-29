import apiClient from "./client";
import type { PaymentResult, ApplyPromoResult } from "../types";

// ── Process Payment ──────────────────────────────────────────

export interface ProcessPaymentRequest {
	errandId: string;
	paymentMethod: string;
	paymentReference?: string;
}

export function processPayment(
	data: ProcessPaymentRequest,
): Promise<PaymentResult> {
	return apiClient.post<PaymentResult>("/payments", data);
}

// ── Tip Rider ────────────────────────────────────────────────

export function tipRider(
	errandId: string,
	amount: number,
): Promise<PaymentResult> {
	return apiClient.post<PaymentResult>(`/payments/${errandId}/tip`, {
		amount,
	});
}

// ── Validate Promo Code ──────────────────────────────────────

export function validatePromoCode(
	code: string,
	orderAmount: number,
): Promise<ApplyPromoResult> {
	return apiClient.post<ApplyPromoResult>("/payments/promo/validate", {
		code,
		orderAmount,
	});
}
