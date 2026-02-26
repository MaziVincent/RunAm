import { create } from "zustand";
import type { UserDto } from "@/types";

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
		set({ token, user, isAuthenticated: true });
	},

	logout: () => {
		localStorage.removeItem("access_token");
		localStorage.removeItem("refresh_token");
		localStorage.removeItem("user");
		set({ token: null, user: null, isAuthenticated: false });
	},

	setUser: (user) => {
		localStorage.setItem("user", JSON.stringify(user));
		set({ user });
	},

	hydrate: () => {
		const token = localStorage.getItem("access_token");
		const userStr = localStorage.getItem("user");
		if (token && userStr) {
			try {
				const user = JSON.parse(userStr) as UserDto;
				set({ token, user, isAuthenticated: true });
			} catch {
				set({ token: null, user: null, isAuthenticated: false });
			}
		}
	},
}));
