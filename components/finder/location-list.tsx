"use client";

import { useState, useMemo, useCallback } from "react";
import type { DisplayLocation, TimeFilter } from "@/lib/types/location";
import { approximateCount } from "@/lib/format/count";
import { useTranslations } from "@/lib/i18n/use-translations";
import { EmptyState } from "./empty-state";
import { LocationCard } from "./location-card";
import { LocationDetailSheet } from "./location-detail-sheet";

// Wrapper component that provides stable onClick via useCallback
function LocationCardWrapper({
	location,
	onSelect
}: {
	location: DisplayLocation;
	onSelect: (location: DisplayLocation) => void;
}) {
	const handleClick = useCallback(() => {
		onSelect(location);
	}, [location, onSelect]);

	return <LocationCard location={location} onClick={handleClick} />;
}

interface LocationListProps {
	locations: DisplayLocation[];
	filter: TimeFilter;
	isLoading?: boolean;
	geoPromptSlot?: React.ReactNode;
}

export function LocationList({
	locations,
	filter,
	isLoading,
	geoPromptSlot,
}: LocationListProps) {
	const { t } = useTranslations();
	const [selectedLocation, setSelectedLocation] =
		useState<DisplayLocation | null>(null);
	const [sheetOpen, setSheetOpen] = useState(false);
	const [showUnknown, setShowUnknown] = useState(false);

	// Split locations into scheduled vs unknown
	const { scheduled, unknown } = useMemo(() => {
		const scheduled: DisplayLocation[] = [];
		const unknown: DisplayLocation[] = [];

		for (const loc of locations) {
			if (loc.schedule.type === "unknown") {
				unknown.push(loc);
			} else {
				scheduled.push(loc);
			}
		}

		return { scheduled, unknown };
	}, [locations]);

	const handleLocationSelect = useCallback((location: DisplayLocation) => {
		setSelectedLocation(location);
		setSheetOpen(true);
	}, []);

	if (isLoading) {
		return (
			<div className="container mx-auto max-w-3xl px-4 py-4">
				<div className="space-y-3">
					{[...Array(3)].map((_, i) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
						<div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
					))}
				</div>
			</div>
		);
	}

	if (locations.length === 0) {
		return <EmptyState filter={filter} />;
	}

	return (
		<>
			<div className="container mx-auto max-w-3xl px-4 py-4">
				{geoPromptSlot && <div className="mb-3">{geoPromptSlot}</div>}

				{/* Locations with known schedules */}
				{scheduled.length > 0 && (
					<div className="space-y-3 sm:space-y-2">
						{scheduled.map((location) => (
							<div key={location.id} style={{ contentVisibility: "auto", containIntrinsicSize: "0 60px" }}>
								<LocationCardWrapper location={location} onSelect={handleLocationSelect} />
							</div>
						))}
					</div>
				)}

				{/* Unknown schedule locations - collapsible */}
				{unknown.length > 0 && (
					<div className={scheduled.length > 0 ? "mt-8 pt-6 border-t border-border" : ""}>
						<button
							type="button"
							onClick={() => setShowUnknown(!showUnknown)}
							className="flex w-full items-center gap-3 px-3 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors"
						>
							<span
								className="text-xs transition-transform duration-200"
								style={{ transform: showUnknown ? "rotate(90deg)" : "rotate(0deg)" }}
							>
								▶
							</span>
							<span className="flex flex-col items-start gap-0.5">
								<span className="font-medium text-foreground">
									{t("moreLocationsCount", { count: approximateCount(unknown.length) })}
								</span>
								<span className="text-xs">{t("callForHours")}</span>
							</span>
						</button>

						{showUnknown && (
							<div className="space-y-3 sm:space-y-2 mt-3">
								{unknown.map((location) => (
									<div key={location.id} style={{ contentVisibility: "auto", containIntrinsicSize: "0 60px" }}>
										<LocationCardWrapper location={location} onSelect={handleLocationSelect} />
									</div>
								))}
							</div>
						)}
					</div>
				)}
			</div>

			<LocationDetailSheet
				location={selectedLocation}
				open={sheetOpen}
				onOpenChange={setSheetOpen}
			/>
		</>
	);
}
