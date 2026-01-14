"use client";

import { useState } from "react";
import type { DisplayLocation, TimeFilter } from "@/lib/types/location";
import { EmptyState } from "./empty-state";
import { LocationCard } from "./location-card";
import { LocationDetailSheet } from "./location-detail-sheet";

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
	const [selectedLocation, setSelectedLocation] =
		useState<DisplayLocation | null>(null);
	const [sheetOpen, setSheetOpen] = useState(false);

	const handleLocationClick = (location: DisplayLocation) => {
		setSelectedLocation(location);
		setSheetOpen(true);
	};

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
				<div className="space-y-3 sm:space-y-2">
					{locations.map((location) => (
						<LocationCard
							key={location.id}
							location={location}
							onClick={() => handleLocationClick(location)}
						/>
					))}
				</div>
			</div>

			<LocationDetailSheet
				location={selectedLocation}
				open={sheetOpen}
				onOpenChange={setSheetOpen}
			/>
		</>
	);
}
