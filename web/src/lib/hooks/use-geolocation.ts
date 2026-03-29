"use client";

import { useState, useEffect, useCallback } from "react";

interface GeolocationState {
	lat: number | undefined;
	lng: number | undefined;
	loading: boolean;
	error: string | undefined;
}

export function useGeolocation() {
	const [state, setState] = useState<GeolocationState>({
		lat: undefined,
		lng: undefined,
		loading: true,
		error: undefined,
	});

	const request = useCallback(() => {
		if (typeof window === "undefined" || !navigator.geolocation) {
			setState((s) => ({
				...s,
				loading: false,
				error: "Geolocation is not supported",
			}));
			return;
		}

		setState((s) => ({ ...s, loading: true, error: undefined }));

		navigator.geolocation.getCurrentPosition(
			(pos) => {
				setState({
					lat: pos.coords.latitude,
					lng: pos.coords.longitude,
					loading: false,
					error: undefined,
				});
			},
			(err) => {
				setState((s) => ({
					...s,
					loading: false,
					error: err.message,
				}));
			},
			{ enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
		);
	}, []);

	useEffect(() => {
		request();
	}, [request]);

	return { ...state, refresh: request };
}
