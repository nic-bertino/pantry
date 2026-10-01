"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { FilterChips } from "@/components/finder/filter-chips";
import { Footer } from "@/components/finder/footer";
import { Header } from "@/components/finder/header";
import { LocationInput } from "@/components/finder/location-input";
import { LocationList } from "@/components/finder/location-list";
import { TimeFilterBar } from "@/components/finder/time-filter-bar";
import { useGeolocation } from "@/hooks/use-geolocation";
import { useLocations } from "@/hooks/use-locations";
import { useRegion } from "@/hooks/use-region";
import type { DistanceRing } from "@/lib/geo/distance-ring";
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

	const {
		locations,
		allLocations,
		groups,
		unknown,
		nextUp,
		counts,
		unfilteredCounts,
		now,
		isLoading: locationsLoading,
	} = useLocations({
		filter,
		userCoordinates: coordinates,
		distanceRing: distanceFilter,
		region: region.id,
	});

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
			{/* Where: scrolls away with the page */}
			<div className="container mx-auto flex max-w-3xl items-center gap-1 overflow-x-auto px-4 pt-3 scrollbar-hide">
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
				{/* Distance chips self-hide when there's no distance data */}
				<FilterChips
					locations={allLocations}
					distanceFilter={distanceFilter}
					onDistanceChange={setDistanceFilter}
				/>
			</div>
			{/* When: stays pinned while browsing */}
			<div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
				<TimeFilterBar
					activeFilter={filter}
					onFilterChange={setFilter}
					counts={counts}
				/>
			</div>

			<main id="main-content">
				<LocationList
					groups={groups}
					unknown={unknown}
					nextUp={nextUp}
					filter={filter}
					distanceFilter={distanceFilter}
					counts={counts}
					unfilteredCounts={unfilteredCounts}
					now={now}
					isLoading={locationsLoading}
					onFilterChange={setFilter}
					onClearDistance={() => setDistanceFilter(null)}
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
