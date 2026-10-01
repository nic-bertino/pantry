"use client";

import { useState, useCallback } from "react";
import { ChevronRightIcon } from "lucide-react";
import type { LocationGroup } from "@/hooks/use-locations";
import type { DistanceRing } from "@/lib/geo/distance-ring";
import type { DisplayLocation, TimeFilter } from "@/lib/types/location";
import { approximateCount } from "@/lib/format/count";
import { formatDateInZone } from "@/lib/format/session";
import { useTranslations } from "@/lib/i18n/use-translations";
import { EmptyState } from "./empty-state";
import { LocationCard } from "./location-card";
import { LocationDetailSheet } from "./location-detail-sheet";

// Wrapper component that provides stable onClick via useCallback
function LocationCardWrapper({
	location,
	now,
	underOpenHeading,
	onSelect,
}: {
	location: DisplayLocation;
	now: Date;
	underOpenHeading?: boolean;
	onSelect: (location: DisplayLocation) => void;
}) {
	const handleClick = useCallback(() => {
		onSelect(location);
	}, [location, onSelect]);

	return (
		<LocationCard
			location={location}
			now={now}
			underOpenHeading={underOpenHeading}
			onClick={handleClick}
		/>
	);
}

function GroupHeading({ group, id }: { group: LocationGroup; id: string }) {
	const { t, locale } = useTranslations();

	let title: string;
	let date: string | null = null;

	if (group.kind === "open-now") {
		title = t("groupOpenNow");
	} else if (group.kind === "later-today") {
		title = t("groupLaterToday");
	} else {
		const format = (options: Parameters<typeof formatDateInZone>[3]) =>
			formatDateInZone(group.date, group.timezone, locale, options);
		const weekday = format({ weekday: "long" });
		title =
			group.dayOffset === 1
				? t("groupTomorrow")
				: weekday.charAt(0).toLocaleUpperCase(locale) + weekday.slice(1);
		date = format({ month: "short", day: "numeric" });
	}

	// Sticks just below the filter bar (py-2 + h-10 chips + 1px border) so the
	// day stays visible while scrolling a long group
	return (
		<h2
			id={id}
			className="sticky top-[calc(3.5rem+1px)] z-30 -mx-1 mb-1 flex items-baseline gap-2 bg-background/95 px-2 py-2 text-sm font-semibold backdrop-blur supports-[backdrop-filter]:bg-background/80"
		>
			{title}
			{date && <span className="font-normal text-muted-foreground">{date}</span>}
		</h2>
	);
}

interface LocationListProps {
	groups: LocationGroup[];
	/** Locations without a parseable schedule */
	unknown: DisplayLocation[];
	/** Upcoming sessions, suggested when nothing matches */
	nextUp: DisplayLocation[];
	filter: TimeFilter;
	distanceFilter: DistanceRing;
	/** Per-filter counts within the distance ring, and ignoring it */
	counts: Record<TimeFilter, number>;
	unfilteredCounts: Record<TimeFilter, number>;
	now: Date;
	isLoading?: boolean;
	onFilterChange: (filter: TimeFilter) => void;
	onClearDistance: () => void;
}

export function LocationList({
	groups,
	unknown,
	nextUp,
	filter,
	distanceFilter,
	counts,
	unfilteredCounts,
	now,
	isLoading,
	onFilterChange,
	onClearDistance,
}: LocationListProps) {
	const { t } = useTranslations();
	const [selectedLocation, setSelectedLocation] =
		useState<DisplayLocation | null>(null);
	const [sheetOpen, setSheetOpen] = useState(false);
	const [showUnknown, setShowUnknown] = useState(false);

	const handleLocationSelect = useCallback((location: DisplayLocation) => {
		setSelectedLocation(location);
		setSheetOpen(true);
	}, []);

	if (isLoading) {
		return (
			<div className="container mx-auto max-w-3xl px-4 py-4">
				<div className="space-y-2">
					{[...Array(3)].map((_, i) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
						<div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
					))}
				</div>
			</div>
		);
	}

	// The filter chip already says "Open now", so a heading would repeat it
	const showHeadings = filter !== "open-now";
	const isEmpty = groups.length === 0 && unknown.length === 0;

	return (
		<>
			{isEmpty ? (
				<EmptyState
					filter={filter}
					distanceFilter={distanceFilter}
					counts={counts}
					unfilteredCounts={unfilteredCounts}
					nextUp={nextUp}
					now={now}
					onSelect={handleLocationSelect}
					onFilterChange={onFilterChange}
					onClearDistance={onClearDistance}
				/>
			) : (
				<div className="container mx-auto max-w-3xl px-4 py-4">
					{groups.map((group) => {
						const headingId = `group-${group.key}`;
						return (
							<section
								key={group.key}
								aria-labelledby={showHeadings ? headingId : undefined}
								className="mt-4 first:mt-0"
							>
								{showHeadings && <GroupHeading group={group} id={headingId} />}
								<div className="space-y-2">
									{group.locations.map((location) => (
										<div
											key={location.id}
											style={{ contentVisibility: "auto", containIntrinsicSize: "0 80px" }}
										>
											<LocationCardWrapper
												location={location}
												now={now}
												underOpenHeading={showHeadings && group.kind === "open-now"}
												onSelect={handleLocationSelect}
											/>
										</div>
									))}
								</div>
							</section>
						);
					})}

					{/* Unknown schedule locations - collapsible */}
					{unknown.length > 0 && (
						<div className={groups.length > 0 ? "mt-8 pt-6 border-t border-border" : ""}>
							<button
								type="button"
								onClick={() => setShowUnknown(!showUnknown)}
								aria-expanded={showUnknown}
								className="flex w-full items-center gap-3 px-3 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors"
							>
								<ChevronRightIcon
									aria-hidden="true"
									className="h-4 w-4 shrink-0 transition-transform duration-200 motion-reduce:transition-none"
									style={{ transform: showUnknown ? "rotate(90deg)" : "rotate(0deg)" }}
								/>
								<span className="flex flex-col items-start gap-0.5">
									<span className="font-medium text-foreground">
										{t("moreLocationsCount", { count: approximateCount(unknown.length) })}
									</span>
									<span className="text-xs">{t("callForHours")}</span>
								</span>
							</button>

							{showUnknown && (
								<div className="space-y-2 mt-3">
									{unknown.map((location) => (
										<LocationCardWrapper
											key={location.id}
											location={location}
											now={now}
											onSelect={handleLocationSelect}
										/>
									))}
								</div>
							)}
						</div>
					)}
				</div>
			)}

			<LocationDetailSheet
				location={selectedLocation}
				now={now}
				open={sheetOpen}
				onOpenChange={setSheetOpen}
			/>
		</>
	);
}
