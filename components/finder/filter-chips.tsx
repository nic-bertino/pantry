"use client";

import { useMemo } from "react";
import { useTranslations } from "@/lib/i18n/use-translations";
import type { DisplayLocation } from "@/lib/types/location";

export type DistanceRing = "within5" | "within10" | null;

interface FilterChipsProps {
	locations: DisplayLocation[];
	distanceFilter: DistanceRing;
	onDistanceChange: (ring: DistanceRing) => void;
}

export function FilterChips({
	locations,
	distanceFilter,
	onDistanceChange,
}: FilterChipsProps) {
	const { t } = useTranslations();

	// Calculate if we have distance data
	const hasDistanceData = useMemo(() => {
		return locations.some((loc) => loc.distance !== undefined);
	}, [locations]);

	// Distance radius options (inclusive — "within X miles")
	const distanceOptions: { ring: DistanceRing; label: string }[] = [
		{ ring: "within5", label: t("within5mi") },
		{ ring: "within10", label: t("within10mi") },
	];

	if (!hasDistanceData) {
		return null;
	}

	return (
		<>
			<div className="h-4 w-px bg-border shrink-0 mx-1" aria-hidden="true" />
			{distanceOptions.map(({ ring, label }) => {
				const isActive = distanceFilter === ring;
				return (
					<button
						key={ring}
						type="button"
						onClick={() => onDistanceChange(isActive ? null : ring)}
						aria-pressed={isActive}
						className={
							isActive
								? "shrink-0 inline-flex items-center gap-1.5 rounded-full border border-primary bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors"
								: "shrink-0 inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 active:bg-muted transition-colors"
						}
					>
						{label}
					</button>
				);
			})}
		</>
	);
}

/**
 * Filter locations by distance radius (inclusive — everything within X miles)
 */
export function filterByDistanceRing(
	locations: DisplayLocation[],
	ring: DistanceRing,
): DisplayLocation[] {
	if (!ring) return locations;

	return locations.filter((location) => {
		if (location.distance === undefined) return false;
		switch (ring) {
			case "within5":
				return location.distance < 5;
			case "within10":
				return location.distance < 10;
			default:
				return true;
		}
	});
}
