"use client";

import { useMemo } from "react";
import { useTranslations } from "@/lib/i18n/use-translations";
import type { DistanceRing } from "@/lib/geo/distance-ring";
import type { DisplayLocation } from "@/lib/types/location";
import { chipClassName } from "./time-filter-bar";

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
						className={chipClassName(isActive)}
					>
						{label}
					</button>
				);
			})}
		</>
	);
}
