"use client";

import { useState } from "react";
import { useTranslations } from "@/lib/i18n/use-translations";
import { Header } from "@/components/finder/header";
import { LocationInput } from "@/components/finder/location-input";
import { LocationList } from "@/components/finder/location-list";
import { TimeFilterBar } from "@/components/finder/time-filter-bar";
import { useGeolocation } from "@/hooks/use-geolocation";
import { useLocations } from "@/hooks/use-locations";
import type { TimeFilter } from "@/lib/types/location";

export default function FinderPage() {
	const { t } = useTranslations();
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
				{/* Context message when Open Now is empty */}
				{filter === "open-now" && locations.length === 0 && (
					<div className="container mx-auto max-w-3xl px-4 pt-4">
						<p className="text-muted-foreground">
							{t("noLocationsOpenNow")}
						</p>
					</div>
				)}

				<LocationList
					locations={locations}
					filter={filter}
				/>
			</main>
		</div>
	);
}
