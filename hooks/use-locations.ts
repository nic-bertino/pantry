"use client";

import { useMemo } from "react";
import locationsData from "@/lib/data/locations.json";
import {
	calculateAvailability,
	isOpenNow,
	isOpenThisWeek,
	isOpenToday,
	isOpenTomorrow,
} from "@/lib/schedule/calculator";
import type {
	DisplayLocation,
	FoodLocation,
	TimeFilter,
} from "@/lib/types/location";

// Type assertion for imported JSON
const locations = locationsData as FoodLocation[];

interface UseLocationsOptions {
	filter: TimeFilter;
	userCoordinates?: { lat: number; lng: number } | null;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in miles
 */
function calculateDistance(
	lat1: number,
	lon1: number,
	lat2: number,
	lon2: number,
): number {
	const R = 3959; // Earth's radius in miles
	const dLat = ((lat2 - lat1) * Math.PI) / 180;
	const dLon = ((lon2 - lon1) * Math.PI) / 180;
	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos((lat1 * Math.PI) / 180) *
			Math.cos((lat2 * Math.PI) / 180) *
			Math.sin(dLon / 2) *
			Math.sin(dLon / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return R * c;
}

export function useLocations({ filter, userCoordinates }: UseLocationsOptions) {
	const now = useMemo(() => new Date(), []);

	// Debug: log when coordinates change
	console.log("[Locations] userCoordinates:", userCoordinates);

	const displayLocations = useMemo(() => {
		// Filter out hidden locations
		const visibleLocations = locations.filter((loc) => !loc.hidden);

		// Debug: check if locations have coordinates
		const withCoords = visibleLocations.filter((loc) => loc.coordinates);
		console.log("[Locations] With coordinates:", withCoords.length, "/", visibleLocations.length);

		// Calculate availability and add to each location
		const withAvailability: DisplayLocation[] = visibleLocations.map((loc) => {
			const availability = calculateAvailability(loc.schedule, now);

			// Calculate distance if user coordinates available
			let distance: number | undefined;
			if (userCoordinates && loc.coordinates) {
				distance = calculateDistance(
					userCoordinates.lat,
					userCoordinates.lng,
					loc.coordinates.lat,
					loc.coordinates.lng,
				);
			}

			return {
				...loc,
				availability,
				distance,
			};
		});

		// Debug: log first location with distance
		const firstWithDist = withAvailability.find((loc) => loc.distance !== undefined);
		if (firstWithDist) {
			console.log("[Locations] Sample distance:", firstWithDist.name.en, firstWithDist.distance?.toFixed(1), "mi");
		}

		return withAvailability;
	}, [now, userCoordinates]);

	// Filter based on time filter
	const filteredLocations = useMemo(() => {
		switch (filter) {
			case "open-now":
				return displayLocations.filter((loc) => isOpenNow(loc.schedule, now));
			case "today":
				return displayLocations.filter((loc) => isOpenToday(loc.schedule, now));
			case "tomorrow":
				return displayLocations.filter((loc) =>
					isOpenTomorrow(loc.schedule, now),
				);
			case "this-week":
				return displayLocations.filter((loc) =>
					isOpenThisWeek(loc.schedule, now),
				);
			default:
				return displayLocations;
		}
	}, [displayLocations, filter, now]);

	// Sort: open locations first, then by distance (if available), then alphabetically
	const sortedLocations = useMemo(() => {
		return [...filteredLocations].sort((a, b) => {
			// Open locations first
			const aOpen = a.availability.status === "open" ? 0 : 1;
			const bOpen = b.availability.status === "open" ? 0 : 1;
			if (aOpen !== bOpen) return aOpen - bOpen;

			// Opening soon second
			const aOpeningSoon = a.availability.status === "opening-soon" ? 0 : 1;
			const bOpeningSoon = b.availability.status === "opening-soon" ? 0 : 1;
			if (aOpeningSoon !== bOpeningSoon) return aOpeningSoon - bOpeningSoon;

			// Then by distance (if available)
			if (a.distance !== undefined && b.distance !== undefined) {
				return a.distance - b.distance;
			}

			// Finally alphabetically
			return a.name.en.localeCompare(b.name.en);
		});
	}, [filteredLocations]);

	// Calculate counts for each filter
	const counts = useMemo(() => {
		return {
			"open-now": displayLocations.filter((loc) => isOpenNow(loc.schedule, now))
				.length,
			today: displayLocations.filter((loc) => isOpenToday(loc.schedule, now))
				.length,
			tomorrow: displayLocations.filter((loc) =>
				isOpenTomorrow(loc.schedule, now),
			).length,
			"this-week": displayLocations.filter((loc) =>
				isOpenThisWeek(loc.schedule, now),
			).length,
		};
	}, [displayLocations, now]);

	return {
		locations: sortedLocations,
		allLocations: displayLocations,
		counts,
		total: displayLocations.length,
	};
}
