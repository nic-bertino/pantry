import { describe, expect, it } from "vitest";
import type { DisplayLocation } from "@/lib/types/location";
import { filterByDistanceRing } from "./filter-chips";

// Minimal DisplayLocation factory — only fields the filter reads
function makeLocation(
	overrides: Partial<DisplayLocation> = {},
): DisplayLocation {
	return {
		id: "test",
		name: { en: "Test", es: "Test" },
		description: { en: "", es: "" },
		address: "123 Main St",
		city: "San Diego",
		state: "CA",
		postcode: "92101",
		timezone: "America/Los_Angeles",
		phone: null,
		website: null,
		schedule: { type: "unknown", rawText: "" },
		rawScheduleText: { en: "", es: "" },
		closures: null,
		eligibility: null,
		tags: [],
		hidden: false,
		availability: { status: "unknown" },
		...overrides,
	};
}

describe("filterByDistanceRing", () => {
	const locations: DisplayLocation[] = [
		makeLocation({ id: "close", distance: 1.5 }),
		makeLocation({ id: "mid", distance: 4.9 }),
		makeLocation({ id: "far", distance: 12 }),
		makeLocation({ id: "no-distance" }), // distance undefined
	];

	it("returns all locations when ring is null", () => {
		const result = filterByDistanceRing(locations, null);
		expect(result).toHaveLength(4);
	});

	it("within5 returns locations under 5 miles", () => {
		const result = filterByDistanceRing(locations, "within5");
		expect(result.map((l) => l.id)).toEqual(["close", "mid"]);
	});

	it("within10 returns locations under 10 miles", () => {
		const result = filterByDistanceRing(locations, "within10");
		expect(result.map((l) => l.id)).toEqual(["close", "mid"]);
	});

	it("excludes locations without distance data", () => {
		const result = filterByDistanceRing(locations, "within5");
		expect(result.find((l) => l.id === "no-distance")).toBeUndefined();
	});

	it("includes location at exactly the boundary (< 5, not <=)", () => {
		const atBoundary = [makeLocation({ id: "exact-5", distance: 5.0 })];
		expect(filterByDistanceRing(atBoundary, "within5")).toHaveLength(0);
	});

	it("within10 includes locations between 5 and 10 miles", () => {
		const midRange = [
			makeLocation({ id: "seven", distance: 7 }),
			makeLocation({ id: "exact-10", distance: 10.0 }),
		];
		const result = filterByDistanceRing(midRange, "within10");
		expect(result.map((l) => l.id)).toEqual(["seven"]);
	});

	it("returns empty array when no locations match", () => {
		const farOnly = [makeLocation({ id: "far", distance: 50 })];
		expect(filterByDistanceRing(farOnly, "within5")).toHaveLength(0);
	});

	it("handles empty locations array", () => {
		expect(filterByDistanceRing([], "within5")).toEqual([]);
		expect(filterByDistanceRing([], null)).toEqual([]);
	});
});
