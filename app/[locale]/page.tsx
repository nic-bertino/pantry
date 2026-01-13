"use client";

import { useState, useCallback, useMemo } from "react";
import { Header } from "@/components/finder/header";
import { LocationDetailSheet } from "@/components/finder/location-detail-sheet";
import { LocationInput } from "@/components/finder/location-input";
import { LocationList } from "@/components/finder/location-list";
import { NextAvailableTimeline } from "@/components/finder/next-available-timeline";
import { TimeFilterBar } from "@/components/finder/time-filter-bar";
import {
	FilterChips,
	filterByDistanceRing,
	filterByEligibility,
	type DistanceRing,
	type EligibilityFilter,
} from "@/components/finder/filter-chips";
import { useGeolocation } from "@/hooks/use-geolocation";
import { useLocations } from "@/hooks/use-locations";
import type { DisplayLocation, TimeFilter } from "@/lib/types/location";

export default function FinderPage() {
	const [filter, setFilter] = useState<TimeFilter>("open-now");
	const [distanceFilter, setDistanceFilter] = useState<DistanceRing>(null);
	const [eligibilityFilter, setEligibilityFilter] = useState<EligibilityFilter>(null);
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

	// Apply visualization filters
	const displayedLocations = useMemo(() => {
		let filtered = locations;
		if (distanceFilter) {
			filtered = filterByDistanceRing(filtered, distanceFilter);
		}
		if (eligibilityFilter) {
			filtered = filterByEligibility(filtered, eligibilityFilter);
		}
		return filtered;
	}, [locations, distanceFilter, eligibilityFilter]);

	// Handle location click from Next Available
	const handleNextAvailableClick = useCallback((location: DisplayLocation) => {
		setSelectedLocation(location);
		setSheetOpen(true);
	}, []);

	// Clear secondary filters when time filter changes
	const handleTimeFilterChange = useCallback((newFilter: TimeFilter) => {
		setFilter(newFilter);
		setDistanceFilter(null);
		setEligibilityFilter(null);
	}, []);

	// Location input element for header
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

	// Secondary filter chips element
	const filterChipsElement = (
		<FilterChips
			locations={locations}
			distanceFilter={distanceFilter}
			eligibilityFilter={eligibilityFilter}
			onDistanceChange={setDistanceFilter}
			onEligibilityChange={setEligibilityFilter}
		/>
	);

	return (
		<div className="min-h-screen bg-background">
			<Header />
			<TimeFilterBar
				activeFilter={filter}
				onFilterChange={handleTimeFilterChange}
				counts={counts}
				secondaryFilters={filterChipsElement}
				locationInput={locationInputElement}
			/>

			<main>
				<div className="container mx-auto max-w-3xl px-4 py-4">
					{/* Next Available - only shown when not on "Open Now" */}
					{filter !== "open-now" && (
						<div className="mb-4">
							<NextAvailableTimeline
								locations={displayedLocations}
								onLocationClick={handleNextAvailableClick}
								currentFilter={filter}
								limit={3}
							/>
						</div>
					)}
				</div>

				<LocationList
					locations={displayedLocations}
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
