"use client";

import { useState } from "react";
import { Footer } from "@/components/finder/footer";
import { Header } from "@/components/finder/header";
import { LocationInput } from "@/components/finder/location-input";
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
		source: locationSource,
		zipCode,
		requestPermission,
		setZipLocation,
	} = useGeolocation();

	const { locations, counts } = useLocations({
		filter,
		userCoordinates: coordinates,
	});

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
				<LocationList
					locations={locations}
					filter={filter}
				/>
			</main>

			<Footer />
		</div>
	);
}
