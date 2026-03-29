import apiClient from "./client";
import type {
	PaymentResult,
	ApplyPromoResult,
	PaymentMethod,
	PromoCode,
} from "../types";

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

// ── Payment Methods ──────────────────────────────────────────

export function getPaymentMethods(): Promise<PaymentMethod[]> {
	return apiClient.get<PaymentMethod[]>("/payments/methods");
}

export interface AddPaymentMethodRequest {
	cardNumber: string;
	expiry: string;
	cvv: string;
	name: string;
}

export function addPaymentMethod(
	data: AddPaymentMethodRequest,
): Promise<PaymentMethod> {
	return apiClient.post<PaymentMethod>("/payments/methods", data);
}

export function deletePaymentMethod(id: string): Promise<void> {
	return apiClient.delete(`/payments/methods/${id}`);
}

export function setDefaultPaymentMethod(id: string): Promise<void> {
	return apiClient.post<void>(`/payments/methods/${id}/default`, {});
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

// ── Promo Codes ──────────────────────────────────────────────

export function getPromoCodes(): Promise<PromoCode[]> {
	return apiClient.get<PromoCode[]>("/payments/promo");
}

export function redeemPromoCode(code: string): Promise<ApplyPromoResult> {
	return apiClient.post<ApplyPromoResult>("/payments/promo/redeem", { code });
}
