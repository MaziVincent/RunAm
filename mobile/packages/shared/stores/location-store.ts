import { create } from "zustand";
import * as Location from "expo-location";

interface LocationState {
	lat: number | undefined;
	lng: number | undefined;
	loading: boolean;
	error: string | undefined;
	request: () => Promise<void>;
}

export const useLocationStore = create<LocationState>((set) => ({
	lat: undefined,
	lng: undefined,
	loading: false,
	error: undefined,

	request: async () => {
		set({ loading: true, error: undefined });
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
				error: err?.message ?? "Failed to get location",
			});
		}
	},
}));
