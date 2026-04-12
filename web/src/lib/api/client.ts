import type { ApiResponse } from "@/types";
import { useAuthStore } from "@/lib/stores/auth-store";

const BASE_URL =
	process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001/api/v1";

interface RequestOptions extends Omit<RequestInit, "body"> {
	body?: unknown;
	params?: Record<string, string | number | boolean | undefined>;
}

function buildUrl(
	path: string,
	params?: Record<string, string | number | boolean | undefined>,
): string {
	const url = new URL(`${BASE_URL}${path}`);
	if (params) {
		Object.entries(params).forEach(([key, value]) => {
			if (value !== undefined) {
				url.searchParams.set(key, String(value));
			}
		});
	}
	return url.toString();
}

function getToken(): string | null {
	if (typeof window === "undefined") return null;
	return useAuthStore.getState().token;
}

// Prevent multiple simultaneous refresh attempts
let refreshPromise: Promise<boolean> | null = null;

async function tryRefreshToken(): Promise<boolean> {
	if (refreshPromise) return refreshPromise;

	refreshPromise = (async () => {
		try {
			const expiredToken = getToken() ?? "";
			const response = await fetch(buildUrl("/auth/refresh-token"), {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({
					accessToken: expiredToken,
					refreshToken: "",
				}),
			});

			if (!response.ok) return false;

			const data = (await response.json()) as ApiResponse<{
				accessToken: string;
				user: { role: number };
			}>;
			if (data.success && data.data) {
				// Store the new access token in memory only
				useAuthStore.getState().setToken(data.data.accessToken);
				return true;
			}
			return false;
		} catch {
			return false;
		} finally {
			refreshPromise = null;
		}
	})();

	return refreshPromise;
}

function clearAuth() {
	if (typeof window === "undefined") return;
	useAuthStore.getState().logout();
}

async function request<T>(
	path: string,
	options: RequestOptions = {},
): Promise<ApiResponse<T>> {
	const { body, params, headers: customHeaders, ...rest } = options;
	const token = getToken();

	const headers: Record<string, string> = {
		"Content-Type": "application/json",
		...((customHeaders as Record<string, string>) ?? {}),
	};

	if (token) {
		headers["Authorization"] = `Bearer ${token}`;
	}

	const response = await fetch(buildUrl(path, params), {
		...rest,
		headers,
		credentials: "include",
		body: body ? JSON.stringify(body) : undefined,
	});

	if (response.status === 401) {
		// Try silent refresh (skip if this was already an auth request)
		if (!path.startsWith("/auth/")) {
			const refreshed = await tryRefreshToken();
			if (refreshed) {
				// Retry the original request with the new token
				const newToken = getToken();
				if (newToken) headers["Authorization"] = `Bearer ${newToken}`;
				const retryResponse = await fetch(buildUrl(path, params), {
					...rest,
					headers,
					credentials: "include",
					body: body ? JSON.stringify(body) : undefined,
				});

				if (retryResponse.ok) {
					if (retryResponse.status === 204) {
						return { success: true } as ApiResponse<T>;
					}
					return retryResponse.json() as Promise<ApiResponse<T>>;
				}

				if (retryResponse.status !== 401) {
					const error = await retryResponse.json().catch(() => ({
						success: false,
						error: {
							code: "NETWORK_ERROR",
							message: retryResponse.statusText,
						},
					}));
					return error as ApiResponse<T>;
				}
			}
		}

		// Refresh failed or was an auth request — force re-login
		clearAuth();
		if (typeof window !== "undefined") {
			window.location.href = "/login";
		}
		throw new Error("Unauthorized");
	}

	if (!response.ok) {
		const error = await response.json().catch(() => ({
			success: false,
			error: { code: "NETWORK_ERROR", message: response.statusText },
		}));
		return error as ApiResponse<T>;
	}

	// Handle 204 No Content
	if (response.status === 204) {
		return { success: true } as ApiResponse<T>;
	}

	return response.json() as Promise<ApiResponse<T>>;
}

export const api = {
	get<T>(
		path: string,
		params?: Record<string, string | number | boolean | undefined>,
	) {
		return request<T>(path, { method: "GET", params });
	},

	post<T>(path: string, body?: unknown) {
		return request<T>(path, { method: "POST", body });
	},

	put<T>(path: string, body?: unknown) {
		return request<T>(path, { method: "PUT", body });
	},

	patch<T>(path: string, body?: unknown) {
		return request<T>(path, { method: "PATCH", body });
	},

	delete<T>(path: string) {
		return request<T>(path, { method: "DELETE" });
	},

	async upload<T>(
		path: string,
		file: File,
		fieldName = "file",
	): Promise<ApiResponse<T>> {
		const token = useAuthStore.getState().token;
		const formData = new FormData();
		formData.append(fieldName, file);

		const headers: Record<string, string> = {};
		if (token) headers["Authorization"] = `Bearer ${token}`;

		const response = await fetch(buildUrl(path), {
			method: "POST",
			headers,
			credentials: "include",
			body: formData,
		});

		if (!response.ok) {
			const error = await response.json().catch(() => ({
				success: false,
				error: { code: "UPLOAD_ERROR", message: response.statusText },
			}));
			return error as ApiResponse<T>;
		}

		return response.json() as Promise<ApiResponse<T>>;
	},
};
