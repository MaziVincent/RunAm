import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "auth_token";
const REFRESH_TOKEN_KEY = "refresh_token";

// Change this to your backend URL
const BASE_URL = __DEV__
	? "http://localhost:5001/api/v1"
	: "https://api.runam.com/api/v1";

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
					? (json.data as { token?: string; refreshToken?: string })
					: (json as { token?: string; refreshToken?: string } | null);

			if (!payload?.token || !payload.refreshToken) {
				return null;
			}

			await Promise.all([
				this.setToken(payload.token),
				this.setRefreshToken(payload.refreshToken),
			]);

			return payload.token;
		})().finally(() => {
			this.refreshPromise = null;
		});

		return this.refreshPromise;
	}

	async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
		const token = await this.getToken();
		let response = await this.sendRequest(path, options, token);

		if (response.status === 401 && token && path !== "/auth/refresh-token") {
			const refreshedToken = await this.refreshAccessToken();
			if (refreshedToken) {
				response = await this.sendRequest(path, options, refreshedToken);
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
		let response = await this.sendRequest(path, options, token);

		if (response.status === 401 && token && path !== "/auth/refresh-token") {
			const refreshedToken = await this.refreshAccessToken();
			if (refreshedToken) {
				response = await this.sendRequest(path, options, refreshedToken);
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

	constructor(
		message: string,
		statusCode: number,
		errors?: Record<string, string[]>,
	) {
		super(message);
		this.name = "ApiError";
		this.statusCode = statusCode;
		this.errors = errors;
	}
}

export const apiClient = new ApiClient(BASE_URL);
export default apiClient;
