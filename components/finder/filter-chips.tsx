"use client";

import { useMemo } from "react";
import { CheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";
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
		<div className="flex items-center gap-1.5">
			{distanceOptions.map(({ ring, label }) => {
				const isActive = distanceFilter === ring;
				return (
					<button
						key={ring}
						type="button"
						onClick={() => onDistanceChange(isActive ? null : ring)}
						className={cn(
							"inline-flex shrink-0 items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border transition-colors whitespace-nowrap",
							isActive
								? "border-primary bg-primary text-primary-foreground"
								: "border-border bg-background hover:bg-muted",
						)}
					>
						{isActive && <CheckIcon className="h-3 w-3" />}
						{label}
					</button>
				);
			})}
		</div>
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
