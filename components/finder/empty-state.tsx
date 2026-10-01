"use client";

import { Button } from "@/components/ui/button";
import { approximateCount } from "@/lib/format/count";
import { type DistanceRing, RING_MILES } from "@/lib/geo/distance-ring";
import { useTranslations } from "@/lib/i18n/use-translations";
import type { DisplayLocation, TimeFilter } from "@/lib/types/location";
import { cn } from "@/lib/utils";
import { LocationCard } from "./location-card";

/** How many upcoming sessions to suggest */
const SUGGESTION_COUNT = 3;

// Later time windows a user can fall forward to from each filter
const FALL_FORWARD: Record<TimeFilter, TimeFilter[]> = {
	"open-now": ["today", "tomorrow", "this-week"],
	today: ["tomorrow", "this-week"],
	tomorrow: ["this-week"],
	"this-week": [],
};

const CTA_KEYS = {
	today: "seeOpenToday",
	tomorrow: "seeOpenTomorrow",
	"this-week": "seeOpenThisWeek",
} as const;

interface EmptyStateProps {
	filter: TimeFilter;
	distanceFilter: DistanceRing;
	/** Per-filter counts within the active distance ring */
	counts: Record<TimeFilter, number>;
	/** Per-filter counts ignoring the distance ring */
	unfilteredCounts: Record<TimeFilter, number>;
	/** Upcoming sessions in start order */
	nextUp: DisplayLocation[];
	now: Date;
	onSelect: (location: DisplayLocation) => void;
	onFilterChange: (filter: TimeFilter) => void;
	onClearDistance: () => void;
}

export function EmptyState({
	filter,
	distanceFilter,
	counts,
	unfilteredCounts,
	nextUp,
	now,
	onSelect,
	onFilterChange,
	onClearDistance,
}: EmptyStateProps) {
	const { t } = useTranslations();
	const suggestions = nextUp.slice(0, SUGGESTION_COUNT);
	const hasSuggestions = suggestions.length > 0;

	// The distance ring, not the time filter, is what emptied the list
	const hiddenByDistance = distanceFilter !== null && unfilteredCounts[filter] > 0;
	const nextFilter = FALL_FORWARD[filter].find((f) => counts[f] > 0);
	const hasActions = hiddenByDistance || nextFilter !== undefined;

	const getMessage = () => {
		if (distanceFilter) {
			const miles = RING_MILES[distanceFilter];
			switch (filter) {
				case "open-now":
					return t("noLocationsOpenNowWithin", { miles });
				case "today":
					return t("noLocationsTodayWithin", { miles });
				default:
					return t("noLocationsWithin", { miles });
			}
		}
		switch (filter) {
			case "open-now":
				return t("noLocationsOpenNow");
			case "today":
				return t("noLocationsToday");
			default:
				return t("noLocationsFound");
		}
	};

	// One axis: left-aligned when there's a list to scan, centered when it's just a message
	return (
		<div
			className={cn(
				"container mx-auto max-w-3xl px-4",
				hasSuggestions ? "py-6" : "py-12 text-center",
			)}
		>
			<h2 className={cn("font-semibold", hasSuggestions && "px-1")}>{getMessage()}</h2>
			{!hasActions && !hasSuggestions && (
				<p className="mt-1 text-sm text-muted-foreground">
					{t("tryDifferentFilter")}
				</p>
			)}

			{hasActions && (
				<div className={cn("mt-4 flex flex-wrap gap-2", !hasSuggestions && "justify-center")}>
					{nextFilter && nextFilter !== "open-now" && (
						<Button onClick={() => onFilterChange(nextFilter)}>
							{t(CTA_KEYS[nextFilter], {
								count: approximateCount(counts[nextFilter]),
								// Spanish templates pluralize with {s}; English ignores it
								s: counts[nextFilter] === 1 ? "" : "s",
							})}
						</Button>
					)}
					{hiddenByDistance && (
						<Button variant="outline" onClick={onClearDistance}>
							{t("clearDistanceFilter")}
						</Button>
					)}
				</div>
			)}

			{hasSuggestions && (
				<section aria-labelledby="opening-next" className="mt-6">
					<h2 id="opening-next" className="mb-2 px-1 text-sm font-semibold text-muted-foreground">
						{t("openingNext")}
					</h2>
					<div className="space-y-2">
						{suggestions.map((location) => (
							<LocationCard
								key={location.id}
								location={location}
								now={now}
								statusMode="full"
								onClick={() => onSelect(location)}
							/>
						))}
					</div>
				</section>
			)}
		</div>
	);
}
