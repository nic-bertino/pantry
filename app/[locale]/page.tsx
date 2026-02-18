"use client";

import { Suspense, useMemo, useState } from "react";
import {
	FilterChips,
	filterByDistanceRing,
	type DistanceRing,
} from "@/components/finder/filter-chips";
import { Footer } from "@/components/finder/footer";
import { Header } from "@/components/finder/header";
import { LocationInput } from "@/components/finder/location-input";
import { LocationList } from "@/components/finder/location-list";
import { TimeFilterBar } from "@/components/finder/time-filter-bar";
import { useGeolocation } from "@/hooks/use-geolocation";
import { useLocations } from "@/hooks/use-locations";
import { useRegion } from "@/hooks/use-region";
import type { TimeFilter } from "@/lib/types/location";

function FinderContent() {
	const [filter, setFilter] = useState<TimeFilter>("open-now");
	const [distanceFilter, setDistanceFilter] = useState<DistanceRing>(null);
	const region = useRegion();

	const {
		coordinates,
		isLoading: geoLoading,
		permissionState,
		source: locationSource,
		zipCode,
		requestPermission,
		setZipLocation,
	} = useGeolocation();

	const { locations, counts, isLoading: locationsLoading } = useLocations({
		filter,
		userCoordinates: coordinates,
		region: region.id,
	});

	// Apply distance radius filter
	const filteredLocations = useMemo(
		() => filterByDistanceRing(locations, distanceFilter),
		[locations, distanceFilter],
	);

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

	// Filter chips element (self-hides when no distance data)
	const filterChipsElement = (
		<FilterChips
			locations={locations}
			distanceFilter={distanceFilter}
			onDistanceChange={setDistanceFilter}
		/>
	);

	const isDevRegion = region.id !== "san-diego";

	return (
		<div className="min-h-screen bg-background">
			{isDevRegion && (
				<div className="bg-amber-500 text-amber-950 text-center text-sm py-1 px-4 font-medium">
					Dev Preview: {region.name} ({locations.length} locations)
				</div>
			)}
			<div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
				<Header />
				<TimeFilterBar
					activeFilter={filter}
					onFilterChange={setFilter}
					counts={counts}
					locationInput={locationInputElement}
				/>
			</div>

			<main>
				<LocationList
					locations={filteredLocations}
					filter={filter}
					isLoading={locationsLoading}
					filterChipsSlot={filterChipsElement}
				/>
			</main>

			<Footer />
		</div>
	);
}

export default function FinderPage() {
	return (
		<Suspense fallback={<div className="min-h-screen bg-background" />}>
			<FinderContent />
		</Suspense>
	);
}
