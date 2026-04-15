import { create } from "zustand";
import * as Location from "expo-location";

interface LocationState {
	lat: number | undefined;
	lng: number | undefined;
	loading: boolean;
	error: string | undefined;
	hasRequested: boolean;
	request: (force?: boolean) => Promise<void>;
}

export const useLocationStore = create<LocationState>((set, get) => ({
	lat: undefined,
	lng: undefined,
	loading: false,
	error: undefined,
	hasRequested: false,

	request: async (force = false) => {
		if (get().loading) return;
		if (!force && (get().hasRequested || (get().lat != null && get().lng != null))) {
			return;
		}

		set({ loading: true, error: undefined, hasRequested: true });
		try {
			const { status } = await Location.requestForegroundPermissionsAsync();
			if (status !== "granted") {
				set({ loading: false, error: "Location permission denied" });
				return;
			}
			const loc = await Location.getCurrentPositionAsync({
				accuracy: Location.Accuracy.Balanced,
			});
			set({
				lat: loc.coords.latitude,
				lng: loc.coords.longitude,
				loading: false,
				error: undefined,
			});
		} catch (err: any) {
			set({
				loading: false,
				hasRequested: true,
				error: err?.message ?? "Failed to get location",
			});
		}
	},
}));
