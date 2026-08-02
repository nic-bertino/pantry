"use client";

import { Button } from "@/components/ui/button";
import { useTranslations } from "@/lib/i18n/use-translations";
import type { TimeFilter } from "@/lib/types/location";
import type { DistanceRing } from "./filter-chips";

interface EmptyStateProps {
	filter: TimeFilter;
	counts?: Record<TimeFilter, number>;
	onFilterChange?: (filter: TimeFilter) => void;
	distanceFilter?: DistanceRing;
	onClearDistance?: () => void;
	/** Locations the active time filter matched before distance filtering */
	hiddenByDistance?: number;
}

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

export function EmptyState({
	filter,
	counts,
	onFilterChange,
	distanceFilter,
	onClearDistance,
	hiddenByDistance = 0,
}: EmptyStateProps) {
	const { t } = useTranslations();

	// The distance ring, not the time filter, emptied the list
	if (distanceFilter && hiddenByDistance > 0) {
		const miles = distanceFilter === "within5" ? 5 : 10;
		return (
			<div className="flex flex-col items-center justify-center py-16 text-center px-4">
				<h3 className="font-semibold">
					{t("nothingWithinDistance", { miles })}
				</h3>
				{onClearDistance && (
					<Button className="mt-4" onClick={onClearDistance}>
						{t("clearDistanceFilter")}
					</Button>
				)}
			</div>
		);
	}

	const getMessage = () => {
		switch (filter) {
			case "open-now":
				return t("noLocationsOpenNow");
			case "today":
				return t("noLocationsToday");
			default:
				return t("noLocationsFound");
		}
	};

	const nextFilter = FALL_FORWARD[filter].find(
		(f) => (counts?.[f] ?? 0) > 0,
	);

	return (
		<div className="flex flex-col items-center justify-center py-16 text-center px-4">
			<h3 className="font-semibold">{getMessage()}</h3>
			{nextFilter && nextFilter !== "open-now" && onFilterChange ? (
				<Button className="mt-4" onClick={() => onFilterChange(nextFilter)}>
					{t(CTA_KEYS[nextFilter], { count: counts?.[nextFilter] ?? 0 })}
				</Button>
			) : (
				<p className="mt-1 text-sm text-muted-foreground">
					{t("tryDifferentFilter")}
				</p>
			)}
		</div>
	);
}
