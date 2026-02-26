import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "auth_token";
const REFRESH_TOKEN_KEY = "refresh_token";

// Change this to your backend URL
const BASE_URL = __DEV__
	? "http://localhost:5000/api/v1"
	: "https://api.runam.com/api/v1";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface RequestOptions {
	method?: HttpMethod;
	body?: unknown;
	headers?: Record<string, string>;
	params?: Record<string, string | number | boolean | undefined>;
}

class ApiClient {
	private baseUrl: string;

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

	async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
		const { method = "GET", body, headers = {}, params } = options;
		const token = await this.getToken();

		const requestHeaders: Record<string, string> = {
			"Content-Type": "application/json",
			Accept: "application/json",
			...headers,
		};

		if (token) {
			requestHeaders["Authorization"] = `Bearer ${token}`;
		}

		const url = this.buildUrl(path, params);

		const response = await fetch(url, {
			method,
			headers: requestHeaders,
			body: body ? JSON.stringify(body) : undefined,
		});

		if (response.status === 401) {
			await this.clearTokens();
			// The auth store listener will handle redirect
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

	get<T>(
		path: string,
		params?: Record<string, string | number | boolean | undefined>,
	): Promise<T> {
		return this.request<T>(path, { method: "GET", params });
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
