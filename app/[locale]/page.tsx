"use client";

import { useState } from "react";
import { GeoPrompt } from "@/components/finder/geo-prompt";
import { Header } from "@/components/finder/header";
import { LocationList } from "@/components/finder/location-list";
import { TimeFilterBar } from "@/components/finder/time-filter-bar";
import { useGeolocation } from "@/hooks/use-geolocation";
import { useLocations } from "@/hooks/use-locations";
import type { TimeFilter } from "@/lib/types/location";

export default function FinderPage() {
	const [filter, setFilter] = useState<TimeFilter>("open-now");

	const {
		coordinates,
		isLoading: geoLoading,
		permissionState,
		requestPermission,
	} = useGeolocation();

	const { locations, counts } = useLocations({
		filter,
		userCoordinates: coordinates,
	});

	// Only show geo prompt if permission hasn't been decided yet
	const shouldShowGeoPrompt = permissionState === "prompt" && !coordinates;

	// Geo prompt element for header
	const geoPromptElement = shouldShowGeoPrompt ? (
		<GeoPrompt onAllow={requestPermission} isLoading={geoLoading} />
	) : null;

	return (
		<div className="min-h-screen bg-background">
			<Header />
			<TimeFilterBar
				activeFilter={filter}
				onFilterChange={setFilter}
				counts={counts}
			/>
			<main>
				<LocationList
					locations={locations}
					filter={filter}
					geoPromptSlot={geoPromptElement}
				/>
			</main>
		</div>
	);
}
