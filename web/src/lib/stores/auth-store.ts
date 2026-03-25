import { create } from "zustand";
import type { UserDto } from "@/types";

function isTokenExpired(token: string): boolean {
	try {
		const payload = JSON.parse(atob(token.split(".")[1]));
		// exp is in seconds, Date.now() in ms
		return payload.exp * 1000 < Date.now();
	} catch {
		return true;
	}
}

// Set lightweight cookies readable by Next.js middleware (not httpOnly — these
// are signals only, the actual token stays in memory / localStorage).
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
	login: (token: string, refreshToken: string, user: UserDto) => void;
	logout: () => void;
	setUser: (user: UserDto) => void;
	hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
	user: null,
	token: null,
	isAuthenticated: false,

	login: (token, refreshToken, user) => {
		localStorage.setItem("access_token", token);
		localStorage.setItem("refresh_token", refreshToken);
		localStorage.setItem("user", JSON.stringify(user));
		setSessionCookies(user);
		set({ token, user, isAuthenticated: true });
	},

	logout: () => {
		localStorage.removeItem("access_token");
		localStorage.removeItem("refresh_token");
		localStorage.removeItem("user");
		setSessionCookies(null);
		set({ token: null, user: null, isAuthenticated: false });
	},

	setUser: (user) => {
		localStorage.setItem("user", JSON.stringify(user));
		setSessionCookies(user);
		set({ user });
	},

	hydrate: () => {
		const token = localStorage.getItem("access_token");
		const userStr = localStorage.getItem("user");
		if (token && userStr) {
			// Reject expired tokens instead of blindly trusting them
			if (isTokenExpired(token)) {
				localStorage.removeItem("access_token");
				localStorage.removeItem("refresh_token");
				localStorage.removeItem("user");
				setSessionCookies(null);
				set({ token: null, user: null, isAuthenticated: false });
				return;
			}
			try {
				const user = JSON.parse(userStr) as UserDto;
				setSessionCookies(user);
				set({ token, user, isAuthenticated: true });
			} catch {
				setSessionCookies(null);
				set({ token: null, user: null, isAuthenticated: false });
			}
		} else {
			setSessionCookies(null);
		}
	},
}));
