import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import type { User, AuthResponse } from "../types";
import { apiClient } from "../api/client";

const USER_KEY = "auth_user";
const TOKEN_KEY = "auth_token";

interface AuthState {
	user: User | null;
	token: string | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	isHydrated: boolean;

	hydrate: () => Promise<void>;
	login: (response: AuthResponse) => Promise<void>;
	logout: () => Promise<void>;
	updateUser: (user: User) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
	user: null,
	token: null,
	isAuthenticated: false,
	isLoading: false,
	isHydrated: false,

	hydrate: async () => {
		try {
			set({ isLoading: true });
			const [tokenStr, userStr] = await Promise.all([
				SecureStore.getItemAsync(TOKEN_KEY),
				SecureStore.getItemAsync(USER_KEY),
			]);

			if (tokenStr && userStr) {
				const user = JSON.parse(userStr) as User;
				set({
					user,
					token: tokenStr,
					isAuthenticated: true,
					isLoading: false,
					isHydrated: true,
				});
			} else {
				set({ isLoading: false, isHydrated: true });
			}
		} catch {
			set({ isLoading: false, isHydrated: true });
		}
	},

	login: async (response: AuthResponse) => {
		const { token, refreshToken, user } = response;

		await Promise.all([
			apiClient.setToken(token),
			apiClient.setRefreshToken(refreshToken),
			SecureStore.setItemAsync(USER_KEY, JSON.stringify(user)),
		]);

		set({
			user,
			token,
			isAuthenticated: true,
		});
	},

	logout: async () => {
		await Promise.all([
			apiClient.clearTokens(),
			SecureStore.deleteItemAsync(USER_KEY),
		]);

		set({
			user: null,
			token: null,
			isAuthenticated: false,
		});
	},

	updateUser: async (user: User) => {
		await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
		set({ user });
	},
}));
