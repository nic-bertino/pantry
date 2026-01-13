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
				let errorMessage = "Could not get your location";
				let permissionState: "prompt" | "granted" | "denied" = "prompt";

				switch (error.code) {
					case error.PERMISSION_DENIED:
						errorMessage = "Location permission denied";
						permissionState = "denied";
						break;
					case error.POSITION_UNAVAILABLE:
						errorMessage = "Location unavailable";
						break;
					case error.TIMEOUT:
						errorMessage = "Location request timed out";
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
				enableHighAccuracy: false,
				timeout: 10000,
				maximumAge: 300000, // 5 minutes
			},
		);
	}, []);

	// Check permission state on mount
	useEffect(() => {
		if (typeof window === "undefined" || !navigator.geolocation) {
			setState((prev) => ({ ...prev, permissionState: "unavailable" }));
			return;
		}

		// Check if permission was previously granted
		if (navigator.permissions) {
			navigator.permissions.query({ name: "geolocation" }).then((result) => {
				setState((prev) => ({
					...prev,
					permissionState: result.state as "prompt" | "granted" | "denied",
				}));

				// If already granted, get position
				if (result.state === "granted") {
					requestPosition();
				}

				// Listen for permission changes
				result.onchange = () => {
					setState((prev) => ({
						...prev,
						permissionState: result.state as "prompt" | "granted" | "denied",
					}));
				};
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
