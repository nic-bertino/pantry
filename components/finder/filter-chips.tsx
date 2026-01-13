"use client";

import { useMemo } from "react";
import { CheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/lib/i18n/use-translations";
import type { DisplayLocation } from "@/lib/types/location";

export type DistanceRing = "under2" | "under5" | "over5" | null;
export type EligibilityFilter = "no-requirements" | null;

interface FilterChipsProps {
	locations: DisplayLocation[];
	distanceFilter: DistanceRing;
	eligibilityFilter: EligibilityFilter;
	onDistanceChange: (ring: DistanceRing) => void;
	onEligibilityChange: (filter: EligibilityFilter) => void;
}

export function FilterChips({
	locations,
	distanceFilter,
	eligibilityFilter,
	onDistanceChange,
	onEligibilityChange,
}: FilterChipsProps) {
	const { t } = useTranslations();

	// Calculate if we have distance data
	const hasDistanceData = useMemo(() => {
		return locations.some((loc) => loc.distance !== undefined);
	}, [locations]);

	// Calculate eligibility counts
	const eligibilityCounts = useMemo(() => {
		let noRequirements = 0;
		for (const location of locations) {
			if (!location.eligibility) {
				noRequirements++;
			}
		}
		return { noRequirements, hasRequirements: locations.length - noRequirements };
	}, [locations]);

	// Only show eligibility filter if there's a mix
	const showEligibility =
		eligibilityCounts.noRequirements > 0 &&
		eligibilityCounts.hasRequirements > 0;

	// Distance ring options
	const distanceOptions: { ring: DistanceRing; label: string }[] = [
		{ ring: "under2", label: t("under2mi") },
		{ ring: "under5", label: t("under5mi") },
		{ ring: "over5", label: t("over5mi") },
	];

	if (!hasDistanceData && !showEligibility) {
		return null;
	}

	return (
		<div className="flex items-center gap-1.5">
			{/* Distance chips */}
			{hasDistanceData && (
				<>
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
					{showEligibility && (
						<span className="text-border mx-1 shrink-0">|</span>
					)}
				</>
			)}

			{/* Eligibility chip */}
			{showEligibility && (
				<button
					type="button"
					onClick={() =>
						onEligibilityChange(
							eligibilityFilter === "no-requirements" ? null : "no-requirements",
						)
					}
					className={cn(
						"inline-flex shrink-0 items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border transition-colors whitespace-nowrap",
						eligibilityFilter === "no-requirements"
							? "border-primary bg-primary text-primary-foreground"
							: "border-border bg-background hover:bg-muted",
					)}
				>
					{eligibilityFilter === "no-requirements" && (
						<CheckIcon className="h-3 w-3" />
					)}
					{t("noRequirements")}
				</button>
			)}
		</div>
	);
}

/**
 * Filter locations by distance ring
 */
export function filterByDistanceRing(
	locations: DisplayLocation[],
	ring: DistanceRing,
): DisplayLocation[] {
	if (!ring) return locations;

	return locations.filter((location) => {
		if (location.distance === undefined) return false;
		switch (ring) {
			case "under2":
				return location.distance < 2;
			case "under5":
				return location.distance >= 2 && location.distance < 5;
			case "over5":
				return location.distance >= 5;
			default:
				return true;
		}
	});
}

/**
 * Filter locations by eligibility
 */
export function filterByEligibility(
	locations: DisplayLocation[],
	filter: EligibilityFilter,
): DisplayLocation[] {
	if (!filter) return locations;
	return locations.filter((location) => !location.eligibility);
}
