import { create } from "zustand";
import * as SecureStore from "expo-secure-store";

const STORAGE_KEY = "runam_user_search_recents";
const MAX_RECENTS = 8;

interface SearchState {
	recents: string[];
	hydrated: boolean;
	hydrate: () => Promise<void>;
	addRecent: (term: string) => void;
	removeRecent: (term: string) => void;
	clearRecents: () => void;
}

async function persist(recents: string[]): Promise<void> {
	try {
		await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(recents));
	} catch {
		// non-fatal: recents stay in memory
	}
}

export const useSearchStore = create<SearchState>((set, get) => ({
	recents: [],
	hydrated: false,
	hydrate: async () => {
		if (get().hydrated) return;
		try {
			const raw = await SecureStore.getItemAsync(STORAGE_KEY);
			if (raw) {
				const parsed = JSON.parse(raw);
				if (Array.isArray(parsed)) {
					set({
						recents: parsed
							.filter((value): value is string => typeof value === "string")
							.slice(0, MAX_RECENTS),
					});
				}
			}
		} catch {
			// ignore
		} finally {
			set({ hydrated: true });
		}
	},
	addRecent: (term) => {
		const normalized = term.trim();
		if (!normalized) return;
		const existing = get().recents.filter(
			(value) => value.toLowerCase() !== normalized.toLowerCase(),
		);
		const next = [normalized, ...existing].slice(0, MAX_RECENTS);
		set({ recents: next });
		void persist(next);
	},
	removeRecent: (term) => {
		const next = get().recents.filter((value) => value !== term);
		set({ recents: next });
		void persist(next);
	},
	clearRecents: () => {
		set({ recents: [] });
		void persist([]);
	},
}));
