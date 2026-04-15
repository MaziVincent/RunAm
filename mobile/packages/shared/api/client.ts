import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "auth_token";
const REFRESH_TOKEN_KEY = "refresh_token";

interface AuthTokenPayload {
	accessToken?: string;
	token?: string;
	refreshToken?: string;
}

function extractHost(candidate?: string | null): string | null {
	if (!candidate) return null;
	const normalized = candidate.replace(/^https?:\/\//, "").split("/")[0];
	if (!normalized) return null;
	return normalized.split(":")[0] || null;
}

function resolveDevBaseUrl(): string {
	const envBaseUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
	if (envBaseUrl) {
		return envBaseUrl;
	}

	const hostCandidates = [
		extractHost((Constants.expoConfig as { hostUri?: string } | null)?.hostUri),
		extractHost(
			(Constants as unknown as {
				manifest2?: { extra?: { expoClient?: { hostUri?: string } } };
			}).manifest2?.extra?.expoClient?.hostUri,
		),
		extractHost(
			(Constants as unknown as { manifest?: { debuggerHost?: string } }).manifest
				?.debuggerHost,
		),
		extractHost(Constants.linkingUri),
	].filter((value): value is string => Boolean(value));

	const host = hostCandidates[0] ?? "127.0.0.1";
	return `http://${host}:5001/api/v1`;
}

const BASE_URL = __DEV__ ? resolveDevBaseUrl() : "https://api.runam.com/api/v1";

export interface PaginatedResult<T> {
	items: T[];
	page: number;
	pageSize: number;
	totalCount: number;
	totalPages: number;
}

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface RequestOptions {
	method?: HttpMethod;
	body?: unknown;
	headers?: Record<string, string>;
	params?: Record<string, string | number | boolean | undefined>;
}

class ApiClient {
	private baseUrl: string;
	private refreshPromise: Promise<string | null> | null = null;

	constructor(baseUrl: string) {
		this.baseUrl = baseUrl;
	}

	getBaseUrl(): string {
		return this.baseUrl;
	}

	private async getToken(): Promise<string | null> {
		try {
			return await SecureStore.getItemAsync(TOKEN_KEY);
		} catch {
			return null;
		}
	}

	private async getRefreshToken(): Promise<string | null> {
		try {
			return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
		} catch {
			return null;
		}
	}

	async setToken(token: string): Promise<void> {
		await SecureStore.setItemAsync(TOKEN_KEY, token);
	}

	async setRefreshToken(token: string): Promise<void> {
		await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
	}

	async clearTokens(): Promise<void> {
		await SecureStore.deleteItemAsync(TOKEN_KEY);
		await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
	}

	private buildUrl(
		path: string,
		params?: Record<string, string | number | boolean | undefined>,
	): string {
		const url = new URL(`${this.baseUrl}${path}`);
		if (params) {
			Object.entries(params).forEach(([key, value]) => {
				if (value !== undefined) {
					url.searchParams.append(key, String(value));
				}
			});
		}
		return url.toString();
	}

	private async sendRequest(
		path: string,
		options: RequestOptions,
		token: string | null,
	): Promise<Response> {
		const { method = "GET", body, headers = {}, params } = options;
		const isFormData = body instanceof FormData;

		const requestHeaders: Record<string, string> = {
			...(isFormData ? {} : { "Content-Type": "application/json" }),
			Accept: "application/json",
			...headers,
		};

		if (token) {
			requestHeaders["Authorization"] = `Bearer ${token}`;
		}

		return fetch(this.buildUrl(path, params), {
			method,
			headers: requestHeaders,
			body: body
				? isFormData
					? (body as FormData)
					: JSON.stringify(body)
				: undefined,
		});
	}

	private async refreshAccessToken(): Promise<string | null> {
		if (this.refreshPromise) {
			return this.refreshPromise;
		}

		this.refreshPromise = (async () => {
			const [accessToken, refreshToken] = await Promise.all([
				this.getToken(),
				this.getRefreshToken(),
			]);

			if (!refreshToken) {
				return null;
			}

			const response = await fetch(this.buildUrl("/auth/refresh-token"), {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Accept: "application/json",
				},
				body: JSON.stringify({
					accessToken: accessToken ?? "",
					refreshToken,
				}),
			});

			if (!response.ok) {
				return null;
			}

			const json = await response.json().catch(() => null);
			const payload =
				json &&
				typeof json === "object" &&
				"data" in json &&
				json.data &&
				typeof json.data === "object"
					? (json.data as AuthTokenPayload)
					: (json as AuthTokenPayload | null);

			const nextAccessToken = payload?.accessToken ?? payload?.token;

			if (!nextAccessToken || !payload?.refreshToken) {
				return null;
			}

			await Promise.all([
				this.setToken(nextAccessToken),
				this.setRefreshToken(payload.refreshToken),
			]);

			return nextAccessToken;
		})().finally(() => {
			this.refreshPromise = null;
		});

		return this.refreshPromise;
	}

	async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
		const token = await this.getToken();
		let response: Response;

		try {
			response = await this.sendRequest(path, options, token);
		} catch (error) {
			throw new ApiError(
				`Unable to reach ${this.baseUrl}. Make sure the backend is running and your phone is on the same network as your computer.`,
				0,
				undefined,
				error,
			);
		}

		if (response.status === 401 && token && path !== "/auth/refresh-token") {
			const refreshedToken = await this.refreshAccessToken();
			if (refreshedToken) {
				try {
					response = await this.sendRequest(path, options, refreshedToken);
				} catch (error) {
					throw new ApiError(
						`Unable to reach ${this.baseUrl}. Make sure the backend is running and your phone is on the same network as your computer.`,
						0,
						undefined,
						error,
					);
				}
			}
		}

		if (response.status === 401) {
			await this.clearTokens();
			throw new ApiError("Unauthorized", 401);
		}

		if (!response.ok) {
			const errorBody = await response.json().catch(() => ({}));
			throw new ApiError(
				errorBody.message || `Request failed with status ${response.status}`,
				response.status,
				errorBody.errors,
			);
		}

		if (response.status === 204) {
			return undefined as T;
		}

		const json = await response.json();

		// Auto-unwrap ApiResponse<T> envelope from backend
		if (
			json &&
			typeof json === "object" &&
			"success" in json &&
			"data" in json
		) {
			return json.data as T;
		}

		return json as T;
	}

	/**
	 * Returns the raw envelope (success, data, meta) without unwrapping.
	 * Used by getPaginated to access both data and meta.
	 */
	private async requestRaw(
		path: string,
		options: RequestOptions = {},
	): Promise<{
		data: unknown;
		meta: {
			page: number;
			pageSize: number;
			totalCount: number;
			totalPages: number;
		} | null;
	}> {
		const token = await this.getToken();
		let response: Response;

		try {
			response = await this.sendRequest(path, options, token);
		} catch (error) {
			throw new ApiError(
				`Unable to reach ${this.baseUrl}. Make sure the backend is running and your phone is on the same network as your computer.`,
				0,
				undefined,
				error,
			);
		}

		if (response.status === 401 && token && path !== "/auth/refresh-token") {
			const refreshedToken = await this.refreshAccessToken();
			if (refreshedToken) {
				try {
					response = await this.sendRequest(path, options, refreshedToken);
				} catch (error) {
					throw new ApiError(
						`Unable to reach ${this.baseUrl}. Make sure the backend is running and your phone is on the same network as your computer.`,
						0,
						undefined,
						error,
					);
				}
			}
		}

		if (response.status === 401) {
			await this.clearTokens();
			throw new ApiError("Unauthorized", 401);
		}

		if (!response.ok) {
			const errorBody = await response.json().catch(() => ({}));
			throw new ApiError(
				errorBody.message || `Request failed with status ${response.status}`,
				response.status,
				errorBody.errors,
			);
		}

		const json = await response.json();
		return { data: json.data ?? json, meta: json.meta ?? null };
	}

	get<T>(
		path: string,
		params?: Record<string, string | number | boolean | undefined>,
	): Promise<T> {
		return this.request<T>(path, { method: "GET", params });
	}

	async getPaginated<T>(
		path: string,
		params?: Record<string, string | number | boolean | undefined>,
	): Promise<PaginatedResult<T>> {
		const json = await this.requestRaw(path, { method: "GET", params });
		return {
			items: (json.data ?? []) as T[],
			page: json.meta?.page ?? 1,
			pageSize: json.meta?.pageSize ?? 20,
			totalCount: json.meta?.totalCount ?? (json.data as T[])?.length ?? 0,
			totalPages: json.meta?.totalPages ?? 1,
		};
	}

	post<T>(path: string, body?: unknown): Promise<T> {
		return this.request<T>(path, { method: "POST", body });
	}

	put<T>(path: string, body?: unknown): Promise<T> {
		return this.request<T>(path, { method: "PUT", body });
	}

	patch<T>(path: string, body?: unknown): Promise<T> {
		return this.request<T>(path, { method: "PATCH", body });
	}

	delete<T>(path: string): Promise<T> {
		return this.request<T>(path, { method: "DELETE" });
	}
}

export class ApiError extends Error {
	statusCode: number;
	errors?: Record<string, string[]>;
	cause?: unknown;

	constructor(
		message: string,
		statusCode: number,
		errors?: Record<string, string[]>,
		cause?: unknown,
	) {
		super(message);
		this.name = "ApiError";
		this.statusCode = statusCode;
		this.errors = errors;
		this.cause = cause;
	}
}

export const apiClient = new ApiClient(BASE_URL);
export default apiClient;
