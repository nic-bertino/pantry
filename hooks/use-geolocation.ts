"use client";

import { useCallback, useEffect, useState } from "react";

interface Coordinates {
	lat: number;
	lng: number;
}

interface GeolocationState {
	coordinates: Coordinates | null;
	error: string | null;
	isLoading: boolean;
	permissionState: "prompt" | "granted" | "denied" | "unavailable";
}

export function useGeolocation() {
	const [state, setState] = useState<GeolocationState>({
		coordinates: null,
		error: null,
		isLoading: false,
		permissionState: "prompt",
	});

	const requestPosition = useCallback(() => {
		if (typeof window === "undefined" || !navigator.geolocation) {
			setState((prev) => ({
				...prev,
				error: "Geolocation is not supported",
				permissionState: "unavailable",
			}));
			return;
		}

		setState((prev) => ({ ...prev, isLoading: true, error: null }));

		navigator.geolocation.getCurrentPosition(
			(position) => {
				console.log(
					"[Geo] Success:",
					position.coords.latitude,
					position.coords.longitude,
				);
				setState({
					coordinates: {
						lat: position.coords.latitude,
						lng: position.coords.longitude,
					},
					error: null,
					isLoading: false,
					permissionState: "granted",
				});
			},
			(error) => {
				console.log("[Geo] Error:", error.code, error.message);
				let errorMessage = "Could not get your location";
				let permissionState: GeolocationState["permissionState"] = "prompt";

				switch (error.code) {
					case 1: // PERMISSION_DENIED
						errorMessage = "Location permission denied";
						permissionState = "denied";
						break;
					case 2: // POSITION_UNAVAILABLE
						errorMessage = "Location unavailable - try again";
						permissionState = "prompt"; // Allow retry
						break;
					case 3: // TIMEOUT
						errorMessage = "Location request timed out";
						permissionState = "prompt"; // Allow retry
						break;
				}

				setState((prev) => ({
					...prev,
					error: errorMessage,
					isLoading: false,
					permissionState,
				}));
			},
			{
				enableHighAccuracy: true, // Try GPS first
				timeout: 15000,
				maximumAge: 300000, // 5 minutes
			},
		);
	}, []);

	// Check if permission was previously granted on mount
	useEffect(() => {
		if (typeof window === "undefined" || !navigator.geolocation) {
			setState((prev) => ({ ...prev, permissionState: "unavailable" }));
			return;
		}

		// Only use Permissions API if available (not Safari)
		if (navigator.permissions?.query) {
			navigator.permissions
				.query({ name: "geolocation" })
				.then((result) => {
					console.log("[Geo] Initial permission:", result.state);
					if (result.state === "granted") {
						// Auto-fetch if already granted
						requestPosition();
					} else if (result.state === "denied") {
						setState((prev) => ({ ...prev, permissionState: "denied" }));
					}
				})
				.catch(() => {
					// Safari - permissions API not supported, that's OK
				});
		}
	}, [requestPosition]);

	const clearLocation = useCallback(() => {
		setState((prev) => ({
			...prev,
			coordinates: null,
		}));
	}, []);

	return {
		...state,
		requestPermission: requestPosition,
		clearLocation,
	};
}
