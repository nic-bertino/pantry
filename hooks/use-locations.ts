"use client";

import { useMemo, useState, useEffect } from "react";
import { type DistanceRing, isWithinRing } from "@/lib/geo/distance-ring";
import { calculateAvailability, getNextSession } from "@/lib/schedule/calculator";
import type {
	DisplayLocation,
	FoodLocation,
	Session,
	TimeFilter,
} from "@/lib/types/location";
import type { Region } from "./use-region";

async function loadRegionData(_region: Region): Promise<FoodLocation[]> {
	return (await import("@/lib/data/locations.json")).default as FoodLocation[];
}

interface UseLocationsOptions {
	filter: TimeFilter;
	userCoordinates?: { lat: number; lng: number } | null;
	/** Limit results (and counts) to a radius around the user */
	distanceRing?: DistanceRing;
	region?: Region;
}

/**
 * A run of locations sharing a time context, rendered under one heading:
 * "Open now", "Later today", "Tomorrow", or a weekday.
 */
export interface LocationGroup {
	key: string;
	kind: "open-now" | "later-today" | "day";
	dayOffset: number;
	/** Start of the first session in the group, for formatting the heading date */
	date: Date;
	timezone: string;
	locations: DisplayLocation[];
}

/** Calendar-day window (relative to today) each filter covers */
const FILTER_WINDOWS: Record<TimeFilter, { fromDay: number; toDay: number }> = {
	"open-now": { fromDay: 0, toDay: 0 },
	today: { fromDay: 0, toDay: 0 },
	tomorrow: { fromDay: 1, toDay: 1 },
	"this-week": { fromDay: 0, toDay: 6 },
};

const FILTERS = Object.keys(FILTER_WINDOWS) as TimeFilter[];

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in miles
 */
function calculateDistance(
	lat1: number,
	lon1: number,
	lat2: number,
	lon2: number,
): number {
	const R = 3959; // Earth's radius in miles
	const dLat = ((lat2 - lat1) * Math.PI) / 180;
	const dLon = ((lon2 - lon1) * Math.PI) / 180;
	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos((lat1 * Math.PI) / 180) *
			Math.cos((lat2 * Math.PI) / 180) *
			Math.sin(dLon / 2) *
			Math.sin(dLon / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return R * c;
}

/**
 * The session a location contributes to a filter, or null if it's excluded.
 * Shared by counts and filtering so chip numbers always match the list.
 */
function sessionForFilter(
	location: DisplayLocation,
	filter: TimeFilter,
	now: Date,
): Session | null {
	if (filter === "open-now" && location.availability.status !== "open") {
		return null;
	}
	return getNextSession(
		location.schedule,
		now,
		location.timezone,
		FILTER_WINDOWS[filter],
	);
}

/**
 * Order within a group: nearest first when the user has set a location,
 * otherwise soonest first. Both fall back to the other, then name.
 */
function compareLocations(
	a: DisplayLocation,
	b: DisplayLocation,
	now: Date,
	hasLocation: boolean,
): number {
	const startOf = (loc: DisplayLocation) =>
		loc.session
			? Math.max(loc.session.opensAt.getTime(), now.getTime())
			: Number.MAX_SAFE_INTEGER;
	const byDistance = () => {
		if (a.distance === undefined && b.distance === undefined) return 0;
		if (a.distance === undefined) return 1;
		if (b.distance === undefined) return -1;
		return a.distance - b.distance;
	};
	const byTime = () => startOf(a) - startOf(b);

	return (
		(hasLocation ? byDistance() || byTime() : byTime() || byDistance()) ||
		a.name.en.localeCompare(b.name.en)
	);
}

/**
 * Bucket locations by when their session happens, in chronological order
 */
export function groupLocations(
	locations: DisplayLocation[],
	now: Date,
	hasLocation: boolean,
): LocationGroup[] {
	const groups = new Map<string, LocationGroup>();

	for (const location of locations) {
		const { session } = location;
		if (!session) continue;

		const isOpen = session.opensAt <= now;
		const kind: LocationGroup["kind"] = isOpen
			? "open-now"
			: session.dayOffset === 0
				? "later-today"
				: "day";
		const key = kind === "day" ? `day-${session.dayOffset}` : kind;

		let group = groups.get(key);
		if (!group) {
			group = {
				key,
				kind,
				dayOffset: session.dayOffset,
				date: session.opensAt,
				timezone: location.timezone,
				locations: [],
			};
			groups.set(key, group);
		}
		group.locations.push(location);
	}

	const rank = (g: LocationGroup) => (g.kind === "open-now" ? -1 : g.dayOffset);
	return [...groups.values()]
		.sort((a, b) => rank(a) - rank(b))
		.map((group) => ({
			...group,
			locations: group.locations.sort((a, b) =>
				compareLocations(a, b, now, hasLocation),
			),
		}));
}

/** How often relative labels ("Opens in 12 min") and groupings refresh */
const CLOCK_TICK_MS = 60_000;

/**
 * Current time, refreshed every minute and whenever the tab becomes visible
 * again, so "Open now" and "Opens in N min" don't go stale.
 */
function useNow(): Date {
	const [now, setNow] = useState(() => new Date());

	useEffect(() => {
		const tick = () => setNow(new Date());
		const interval = setInterval(tick, CLOCK_TICK_MS);
		const onVisibilityChange = () => {
			if (document.visibilityState === "visible") tick();
		};
		document.addEventListener("visibilitychange", onVisibilityChange);
		return () => {
			clearInterval(interval);
			document.removeEventListener("visibilitychange", onVisibilityChange);
		};
	}, []);

	return now;
}

function countByFilter(infos: ScheduleInfo[]): Record<TimeFilter, number> {
	const counts: Record<TimeFilter, number> = {
		"open-now": 0,
		today: 0,
		tomorrow: 0,
		"this-week": 0,
	};
	for (const { location, sessions } of infos) {
		for (const f of FILTERS) if (sessions[f]) counts[f]++;
		// Unknown schedules can't be ruled out, so they count toward the week
		if (location.schedule.type === "unknown") counts["this-week"]++;
	}
	return counts;
}

interface ScheduleInfo {
	location: DisplayLocation;
	/** Session each filter would show, or null when the filter excludes it */
	sessions: Record<TimeFilter, Session | null>;
	/** Next session that hasn't started yet, for empty-state suggestions */
	upcoming: Session | null;
}

export function useLocations({
	filter,
	userCoordinates,
	distanceRing = null,
	region = "san-diego",
}: UseLocationsOptions) {
	const [rawLocations, setRawLocations] = useState<FoodLocation[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const now = useNow();

	// Dynamic import - only loads the requested region's data
	useEffect(() => {
		setIsLoading(true);
		loadRegionData(region)
			.then((data) => {
				setRawLocations(data);
				setIsLoading(false);
			})
			.catch((err) => {
				console.error(`Failed to load region data: ${region}`, err);
				setIsLoading(false);
			});
	}, [region]);

	// Schedule math, independent of the user's location so moving the
	// location doesn't redo it. Recomputes on each clock tick.
	const scheduleInfo = useMemo(() => {
		return rawLocations
			.filter((loc) => !loc.hidden)
			.map((loc): ScheduleInfo => {
				const location: DisplayLocation = {
					...loc,
					availability: calculateAvailability(loc.schedule, now, loc.timezone),
				};
				const sessions = {} as Record<TimeFilter, Session | null>;
				for (const f of FILTERS) sessions[f] = sessionForFilter(location, f, now);

				const next = getNextSession(loc.schedule, now, loc.timezone, {
					fromDay: 0,
					toDay: 7,
				});
				return {
					location,
					sessions,
					upcoming: next && next.opensAt > now ? next : null,
				};
			});
	}, [rawLocations, now]);

	// Attach distances (cheap) whenever the user's location changes
	const located = useMemo(() => {
		if (!userCoordinates) return scheduleInfo;
		return scheduleInfo.map((info) => {
			const { coordinates } = info.location;
			if (!coordinates) return info;
			const distance = calculateDistance(
				userCoordinates.lat,
				userCoordinates.lng,
				coordinates.lat,
				coordinates.lng,
			);
			return { ...info, location: { ...info.location, distance } };
		});
	}, [scheduleInfo, userCoordinates]);

	// Everything below respects the distance ring, so chip counts match the list
	const inRing = useMemo(
		() => located.filter((info) => isWithinRing(info.location, distanceRing)),
		[located, distanceRing],
	);

	const counts = useMemo(() => countByFilter(inRing), [inRing]);

	// Same counts ignoring the ring, so the empty state can tell when the
	// distance filter (not the time filter) is what emptied the list
	const unfilteredCounts = useMemo(() => countByFilter(located), [located]);

	const { groups, unknown } = useMemo(() => {
		const scheduled: DisplayLocation[] = [];
		const unknown: DisplayLocation[] = [];

		for (const { location, sessions } of inRing) {
			if (location.schedule.type === "unknown") {
				if (filter === "this-week") unknown.push({ ...location, session: null });
				continue;
			}
			const session = sessions[filter];
			if (session) scheduled.push({ ...location, session });
		}

		unknown.sort((a, b) => a.name.en.localeCompare(b.name.en));

		return {
			groups: groupLocations(scheduled, now, userCoordinates != null),
			unknown,
		};
	}, [inRing, filter, now, userCoordinates]);

	// Upcoming sessions in start order, offered when the active filter has no results
	const nextUp = useMemo(
		() =>
			inRing
				.flatMap(({ location, upcoming }) =>
					upcoming ? [{ ...location, session: upcoming }] : [],
				)
				.sort((a, b) => compareLocations(a, b, now, false)),
		[inRing, now],
	);

	const locations = useMemo(
		() => [...groups.flatMap((g) => g.locations), ...unknown],
		[groups, unknown],
	);

	// All visible locations with distances, ignoring the ring
	const allLocations = useMemo(() => located.map((info) => info.location), [located]);

	return {
		locations,
		groups,
		unknown,
		nextUp,
		allLocations,
		counts,
		unfilteredCounts,
		total: allLocations.length,
		now,
		isLoading,
	};
}
