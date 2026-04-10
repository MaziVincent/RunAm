import apiClient, { type PaginatedResult } from "./client";
import type {
	CreateWalletRequest,
	Wallet,
	WalletTransaction,
	TopUpRequest,
} from "../types";

// ── Get Wallet ───────────────────────────────────────────────

export function getWallet(): Promise<Wallet | null> {
	return apiClient.get<Wallet | null>("/payments/wallet");
}

export function createWallet(data: CreateWalletRequest): Promise<Wallet> {
	return apiClient.post<Wallet>("/payments/wallet", data);
}

// ── Get Transactions ─────────────────────────────────────────

interface GetTransactionsParams {
	page?: number;
	pageSize?: number;
}

export function getWalletTransactions(
	params?: GetTransactionsParams,
): Promise<PaginatedResult<WalletTransaction>> {
	return apiClient.getPaginated<WalletTransaction>(
		"/payments/wallet/transactions",
		params as Record<string, string | number | boolean | undefined>,
	);
}

// ── Top Up Wallet ────────────────────────────────────────────

export function topUpWallet(data: TopUpRequest): Promise<Wallet> {
	return apiClient.post<Wallet>("/payments/wallet/topup", data);
}

// ── Withdraw ─────────────────────────────────────────────────

export interface WithdrawRequest {
	amount: number;
	bankCode: string;
	accountNumber: string;
	accountName: string;
}

export function withdrawFromWallet(data: WithdrawRequest): Promise<Wallet> {
	return apiClient.post<Wallet>("/payments/wallet/withdraw", data);
}

// ── Reserve Account (Monnify) ────────────────────────────────

export interface ReserveAccountRequest {
	accountName: string;
	email: string;
}

export interface ReservedAccount {
	accountNumber: string;
	accountName: string;
	bankName: string;
	bankCode: string;
	accountReference: string;
}

export function reserveAccount(
	data: ReserveAccountRequest,
): Promise<ReservedAccount> {
	return apiClient.post<ReservedAccount>(
		"/payments/wallet/reserve-account",
		data,
	);
}

// ── Verify Transaction ───────────────────────────────────────

export interface TransactionStatus {
	paid: boolean;
	amount: number;
	paymentReference?: string;
}

export function verifyTransaction(
	transactionReference: string,
): Promise<TransactionStatus> {
	return apiClient.get<TransactionStatus>(
		`/payments/verify/${transactionReference}`,
	);
}
