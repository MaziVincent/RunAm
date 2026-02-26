import { create } from "zustand";
import * as SecureStore from "expo-secure-store";

const ONBOARDING_KEY = "has_seen_onboarding";

interface OnboardingState {
	hasSeenOnboarding: boolean;
	isHydrated: boolean;
	hydrate: () => Promise<void>;
	completeOnboarding: () => Promise<void>;
	reset: () => Promise<void>;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
	hasSeenOnboarding: false,
	isHydrated: false,

	hydrate: async () => {
		try {
			const value = await SecureStore.getItemAsync(ONBOARDING_KEY);
			set({
				hasSeenOnboarding: value === "true",
				isHydrated: true,
			});
		} catch {
			set({ isHydrated: true });
		}
	},

	completeOnboarding: async () => {
		await SecureStore.setItemAsync(ONBOARDING_KEY, "true");
		set({ hasSeenOnboarding: true });
	},

	reset: async () => {
		await SecureStore.deleteItemAsync(ONBOARDING_KEY);
		set({ hasSeenOnboarding: false });
	},
}));
