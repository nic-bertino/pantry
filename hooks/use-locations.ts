"use client";

import { useMemo, useState, useEffect } from "react";
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
import type { Region } from "./use-region";

// Dynamic import map - only loads the requested region's data
// Dev regions gated behind NEXT_PUBLIC_DEV_REGIONS to avoid build errors
// when dev data files aren't present
async function loadRegionData(region: Region): Promise<FoodLocation[]> {
	if (process.env.NEXT_PUBLIC_DEV_REGIONS === "true") {
		switch (region) {
			case "riverside":
				return (await import("@/lib/data/locations-riverside.json")).default as FoodLocation[];
			case "houston":
				return (await import("@/lib/data/locations-houston.json")).default as FoodLocation[];
		}
	}
	return (await import("@/lib/data/locations.json")).default as FoodLocation[];
}

interface UseLocationsOptions {
	filter: TimeFilter;
	userCoordinates?: { lat: number; lng: number } | null;
	region?: Region;
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

export function useLocations({ filter, userCoordinates, region = "san-diego" }: UseLocationsOptions) {
	const [rawLocations, setRawLocations] = useState<FoodLocation[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const now = useMemo(() => new Date(), []);

	// Dynamic import - only loads the requested region's data
	useEffect(() => {
		setIsLoading(true);
		loadRegionData(region)
			.then((data) => {
				setRawLocations(data);
				setIsLoading(false);
			})
			.catch((err) => {
				console.error(`Failed to load region data: ${region}`, err);
				setIsLoading(false);
			});
	}, [region]);

	// Single-pass processing: calculate availability, distance, and categorize by filter
	const { displayLocations, counts } = useMemo(() => {
		const visibleLocations = rawLocations.filter((loc) => !loc.hidden);

		const counts = {
			"open-now": 0,
			today: 0,
			tomorrow: 0,
			"this-week": 0,
		};

		const displayLocations: DisplayLocation[] = visibleLocations.map((loc) => {
			const availability = calculateAvailability(loc.schedule, now, loc.timezone);

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

			// Count for each filter in single pass
			if (isOpenNow(loc.schedule, now, loc.timezone)) counts["open-now"]++;
			if (isOpenToday(loc.schedule, now, loc.timezone)) counts.today++;
			if (isOpenTomorrow(loc.schedule, now, loc.timezone)) counts.tomorrow++;
			if (isOpenThisWeek(loc.schedule, now, loc.timezone)) counts["this-week"]++;

			return {
				...loc,
				availability,
				distance,
			};
		});

		return { displayLocations, counts };
	}, [rawLocations, now, userCoordinates]);

	// Filter based on time filter
	const filteredLocations = useMemo(() => {
		switch (filter) {
			case "open-now":
				return displayLocations.filter((loc) =>
					isOpenNow(loc.schedule, now, loc.timezone),
				);
			case "today":
				return displayLocations.filter((loc) =>
					isOpenToday(loc.schedule, now, loc.timezone),
				);
			case "tomorrow":
				return displayLocations.filter((loc) =>
					isOpenTomorrow(loc.schedule, now, loc.timezone),
				);
			case "this-week":
				return displayLocations.filter((loc) =>
					isOpenThisWeek(loc.schedule, now, loc.timezone),
				);
			default:
				return displayLocations;
		}
	}, [displayLocations, filter, now]);

	// Sort by opening time: open now first, then by when they open next
	const sortedLocations = useMemo(() => {
		return [...filteredLocations].sort((a, b) => {
			// Get opening time for sorting (0 = open now, otherwise minutes until open)
			const getOpeningTime = (loc: DisplayLocation): number => {
				if (loc.availability.status === "open") return 0;
				if (loc.availability.status === "opening-soon") {
					return loc.availability.minutesUntil;
				}
				if (loc.availability.status === "closed" && loc.availability.opensAt) {
					return Math.floor(
						(loc.availability.opensAt.getTime() - now.getTime()) / (1000 * 60),
					);
				}
				return Number.MAX_SAFE_INTEGER; // Unknown status goes to end
			};

			const aTime = getOpeningTime(a);
			const bTime = getOpeningTime(b);

			// Sort by opening time first
			if (aTime !== bTime) return aTime - bTime;

			// Then by distance (if available and both are similar opening time)
			if (a.distance !== undefined && b.distance !== undefined) {
				return a.distance - b.distance;
			}

			// Finally alphabetically
			return a.name.en.localeCompare(b.name.en);
		});
	}, [filteredLocations, now]);

	return {
		locations: sortedLocations,
		allLocations: displayLocations,
		counts,
		total: displayLocations.length,
		isLoading,
	};
}
