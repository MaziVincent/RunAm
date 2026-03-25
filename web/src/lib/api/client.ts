import type { ApiResponse } from "@/types";

const BASE_URL =
	process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api/v1";

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
	return localStorage.getItem("access_token");
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
		body: body ? JSON.stringify(body) : undefined,
	});

	if (response.status === 401) {
		if (typeof window !== "undefined") {
			localStorage.removeItem("access_token");
			localStorage.removeItem("refresh_token");
			localStorage.removeItem("user");
			document.cookie = "has_session=; path=/; max-age=0";
			document.cookie = "user_role=; path=/; max-age=0";
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
		const token = getToken();
		const formData = new FormData();
		formData.append(fieldName, file);

		const headers: Record<string, string> = {};
		if (token) headers["Authorization"] = `Bearer ${token}`;

		const response = await fetch(buildUrl(path), {
			method: "POST",
			headers,
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
