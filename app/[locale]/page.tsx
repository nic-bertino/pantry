"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
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
import { useTranslations } from "@/lib/i18n/use-translations";
import type { TimeFilter } from "@/lib/types/location";

function FinderContent() {
	const { t, locale } = useTranslations();
	const [filter, setFilter] = useState<TimeFilter>("open-now");
	const [distanceFilter, setDistanceFilter] = useState<DistanceRing>(null);
	const region = useRegion();

	// Keep <html lang> in sync with current locale
	useEffect(() => {
		document.documentElement.lang = locale;
	}, [locale]);

	const {
		coordinates,
		isLoading: geoLoading,
		error: geoError,
		permissionState,
		source: locationSource,
		zipCode,
		requestPermission,
		clearLocation,
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
			error={geoError}
			onRequestBrowserLocation={requestPermission}
			onSetZipLocation={setZipLocation}
			onClearLocation={clearLocation}
		/>
	);

	// Distance chips element (self-hides when no distance data)
	const distanceChipsElement = (
		<FilterChips
			locations={locations}
			distanceFilter={distanceFilter}
			onDistanceChange={setDistanceFilter}
		/>
	);

	const isDevRegion = region.id !== "san-diego";

	return (
		<div className="min-h-screen bg-background">
			<a
				href="#main-content"
				className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-background focus:px-4 focus:py-2 focus:rounded-md focus:ring-2 focus:ring-primary focus:text-sm"
			>
				{t("skipToContent")}
			</a>
			{isDevRegion && (
				<div className="bg-amber-500 text-amber-950 text-center text-sm py-1 px-4 font-medium">
					Dev Preview: {region.name} ({locations.length} locations)
				</div>
			)}
			<Header />
			<div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
				<TimeFilterBar
					activeFilter={filter}
					onFilterChange={setFilter}
					counts={counts}
					locationInput={locationInputElement}
					distanceChips={distanceChipsElement}
				/>
			</div>

			<main id="main-content">
				<LocationList
					locations={filteredLocations}
					filter={filter}
					isLoading={locationsLoading}
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
