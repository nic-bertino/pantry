import type { DisplayLocation } from "@/lib/types/location";

export type DistanceRing = "within5" | "within10" | null;

/** Radius in miles for each ring */
export const RING_MILES: Record<Exclude<DistanceRing, null>, number> = {
	within5: 5,
	within10: 10,
};

/** Inclusive radius check — "within X miles". No ring means everything passes. */
export function isWithinRing(location: DisplayLocation, ring: DistanceRing): boolean {
	if (!ring) return true;
	return location.distance !== undefined && location.distance < RING_MILES[ring];
}

/**
 * Filter locations by distance radius (inclusive — everything within X miles)
 */
export function filterByDistanceRing(
	locations: DisplayLocation[],
	ring: DistanceRing,
): DisplayLocation[] {
	if (!ring) return locations;
	return locations.filter((location) => isWithinRing(location, ring));
}
