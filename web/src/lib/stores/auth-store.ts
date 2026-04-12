import { create } from "zustand";
import type { UserDto } from "@/types";

// Set lightweight cookies readable by Next.js middleware (not httpOnly — these
// are routing signals only, the actual JWT stays in memory).
function setSessionCookies(user: UserDto | null) {
	if (user) {
		document.cookie = `has_session=1; path=/; SameSite=Lax; max-age=${60 * 60 * 24 * 7}`;
		document.cookie = `user_role=${user.role}; path=/; SameSite=Lax; max-age=${60 * 60 * 24 * 7}`;
	} else {
		document.cookie = "has_session=; path=/; max-age=0";
		document.cookie = "user_role=; path=/; max-age=0";
	}
}

interface AuthState {
	user: UserDto | null;
	token: string | null;
	isAuthenticated: boolean;
	isHydrated: boolean;
	login: (token: string, user: UserDto) => void;
	logout: () => void;
	setUser: (user: UserDto) => void;
	setToken: (token: string) => void;
	hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
	user: null,
	token: null,
	isAuthenticated: false,
	isHydrated: false,

	login: (token, user) => {
		// Access token lives ONLY in memory (Zustand state).
		// Refresh token is in an HttpOnly cookie set by the backend.
		setSessionCookies(user);
		set({ token, user, isAuthenticated: true, isHydrated: true });
	},

	logout: () => {
		setSessionCookies(null);
		set({ token: null, user: null, isAuthenticated: false });
		// Call logout endpoint to clear the HttpOnly refresh token cookie
		const baseUrl =
			process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001/api/v1";
		fetch(`${baseUrl}/auth/logout`, {
			method: "POST",
			credentials: "include",
		}).catch(() => {});
	},

	setUser: (user) => {
		setSessionCookies(user);
		set({ user });
	},

	setToken: (token) => {
		set({ token });
	},

	hydrate: async () => {
		// Already hydrated in this session
		if (get().isHydrated) return;

		// No session cookie → definitely not logged in
		if (typeof document === "undefined" || !document.cookie.includes("has_session=1")) {
			set({ isHydrated: true });
			return;
		}

		// We have a session cookie — try to refresh the access token using the
		// HttpOnly refresh token cookie.
		try {
			const baseUrl =
				process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001/api/v1";
			const response = await fetch(`${baseUrl}/auth/refresh-token`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ accessToken: "", refreshToken: "" }),
			});

			if (response.ok) {
				const data = await response.json();
				if (data.success && data.data) {
					const { accessToken, user } = data.data;
					setSessionCookies(user);
					set({
						token: accessToken,
						user,
						isAuthenticated: true,
						isHydrated: true,
					});
					return;
				}
			}
		} catch {
			// Refresh failed — fall through to unauthenticated state
		}

		// Refresh failed — clear session signals
		setSessionCookies(null);
		set({ token: null, user: null, isAuthenticated: false, isHydrated: true });
	},
}));
