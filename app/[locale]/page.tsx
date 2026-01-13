"use client";

import { useState, useCallback } from "react";
import { Header } from "@/components/finder/header";
import { LocationDetailSheet } from "@/components/finder/location-detail-sheet";
import { LocationInput } from "@/components/finder/location-input";
import { LocationList } from "@/components/finder/location-list";
import { NextAvailableTimeline } from "@/components/finder/next-available-timeline";
import { TimeFilterBar } from "@/components/finder/time-filter-bar";
import { useGeolocation } from "@/hooks/use-geolocation";
import { useLocations } from "@/hooks/use-locations";
import type { DisplayLocation, TimeFilter } from "@/lib/types/location";

export default function FinderPage() {
	const [filter, setFilter] = useState<TimeFilter>("open-now");
	const [selectedLocation, setSelectedLocation] = useState<DisplayLocation | null>(null);
	const [sheetOpen, setSheetOpen] = useState(false);

	const {
		coordinates,
		isLoading: geoLoading,
		permissionState,
		source: locationSource,
		zipCode,
		requestPermission,
		setZipLocation,
	} = useGeolocation();

	const { locations, counts } = useLocations({
		filter,
		userCoordinates: coordinates,
	});

	// Handle location click from Next Available
	const handleNextAvailableClick = useCallback((location: DisplayLocation) => {
		setSelectedLocation(location);
		setSheetOpen(true);
	}, []);

	// Location input element
	const locationInputElement = (
		<LocationInput
			coordinates={coordinates}
			source={locationSource}
			zipCode={zipCode}
			permissionState={permissionState}
			isLoading={geoLoading}
			onRequestBrowserLocation={requestPermission}
			onSetZipLocation={setZipLocation}
		/>
	);

	return (
		<div className="min-h-screen bg-background">
			<Header />
			<TimeFilterBar
				activeFilter={filter}
				onFilterChange={setFilter}
				counts={counts}
				locationInput={locationInputElement}
			/>

			<main>
				<div className="container mx-auto max-w-3xl px-4 py-4">
					{/* Next Available - only shown when not on "Open Now" */}
					{filter !== "open-now" && (
						<div className="mb-4">
							<NextAvailableTimeline
								locations={locations}
								onLocationClick={handleNextAvailableClick}
								currentFilter={filter}
								limit={3}
							/>
						</div>
					)}
				</div>

				<LocationList
					locations={locations}
					filter={filter}
				/>
			</main>

			{/* Detail sheet for Next Available clicks */}
			<LocationDetailSheet
				location={selectedLocation}
				open={sheetOpen}
				onOpenChange={setSheetOpen}
			/>
		</div>
	);
}
