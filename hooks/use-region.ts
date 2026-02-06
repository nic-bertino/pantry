"use client";

import { useSearchParams } from "next/navigation";

export type Region = "san-diego" | "riverside" | "houston";

export interface RegionConfig {
	id: Region;
	name: string;
	defaultCenter: { lat: number; lng: number };
}

export const REGIONS: Record<string, RegionConfig> = {
	"san-diego": {
		id: "san-diego",
		name: "San Diego",
		defaultCenter: { lat: 32.7157, lng: -117.1611 },
	},
};

const DEFAULT_REGION: Region = "san-diego";

/**
 * Hook to get the current region from URL params
 * Usage: Add ?region=riverside to the URL to switch regions
 */
export function useRegion(): RegionConfig {
	const searchParams = useSearchParams();
	const regionParam = searchParams.get("region");

	// Validate region param
	if (regionParam && regionParam in REGIONS) {
		return REGIONS[regionParam as Region];
	}

	return REGIONS[DEFAULT_REGION];
}
