"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
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

const TIME_FILTERS: TimeFilter[] = [
	"open-now",
	"today",
	"tomorrow",
	"this-week",
];

function parseFilterParam(value: string | null): TimeFilter {
	return TIME_FILTERS.includes(value as TimeFilter)
		? (value as TimeFilter)
		: "open-now";
}

function parseDistParam(value: string | null): DistanceRing {
	if (value === "5") return "within5";
	if (value === "10") return "within10";
	return null;
}

function FinderContent() {
	const { t, locale } = useTranslations();
	const searchParams = useSearchParams();
	const [filter, setFilter] = useState<TimeFilter>(() =>
		parseFilterParam(searchParams?.get("filter") ?? null),
	);
	const [distanceFilter, setDistanceFilter] = useState<DistanceRing>(() =>
		parseDistParam(searchParams?.get("dist") ?? null),
	);
	const region = useRegion();

	// Reflect filters in the URL so refreshes, shared links, and the
	// language switch keep the current view
	useEffect(() => {
		const params = new URLSearchParams(window.location.search);
		if (filter === "open-now") params.delete("filter");
		else params.set("filter", filter);
		if (distanceFilter === "within5") params.set("dist", "5");
		else if (distanceFilter === "within10") params.set("dist", "10");
		else params.delete("dist");
		const query = params.toString();
		const next = `${window.location.pathname}${query ? `?${query}` : ""}`;
		if (next !== `${window.location.pathname}${window.location.search}`) {
			window.history.replaceState(null, "", next);
		}
	}, [filter, distanceFilter]);

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
		distanceRing: distanceFilter,
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
				<div className="bg-primary text-primary-foreground text-center text-sm py-1 px-4 font-medium">
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
					counts={counts}
					onFilterChange={setFilter}
					distanceFilter={distanceFilter}
					onClearDistance={() => setDistanceFilter(null)}
					hiddenByDistance={distanceFilter ? locations.length : 0}
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
