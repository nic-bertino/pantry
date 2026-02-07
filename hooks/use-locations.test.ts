import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useLocations } from "./use-locations";

vi.mock("@/lib/data/locations.json", () => ({
	default: [
		{
			id: "loc-1",
			name: { en: "Alpha Pantry", es: "Alpha" },
			description: { en: "Description", es: "Descripcion" },
			address: "123 Main St",
			city: "San Diego",
			state: "CA",
			postcode: "92101",
			timezone: "America/Los_Angeles",
			coordinates: { lat: 32.72, lng: -117.16 },
			phone: null,
			website: null,
			schedule: {
				type: "weekly",
				schedule: {
					monday: null,
					tuesday: null,
					wednesday: {
						open: { hour: 9, minute: 0 },
						close: { hour: 12, minute: 0 },
					},
					thursday: null,
					friday: null,
					saturday: null,
					sunday: null,
				},
			},
			rawScheduleText: { en: "Wed 9-12", es: "Mie 9-12" },
			closures: null,
			eligibility: null,
			tags: [],
			hidden: false,
		},
		{
			id: "loc-2",
			name: { en: "Beta Pantry", es: "Beta" },
			description: { en: "Description", es: "Descripcion" },
			address: "456 Oak Ave",
			city: "San Diego",
			state: "CA",
			postcode: "92103",
			timezone: "America/Los_Angeles",
			coordinates: { lat: 32.75, lng: -117.2 },
			phone: null,
			website: null,
			schedule: {
				type: "weekly",
				schedule: {
					monday: null,
					tuesday: {
						open: { hour: 9, minute: 0 },
						close: { hour: 12, minute: 0 },
					},
					wednesday: null,
					thursday: null,
					friday: null,
					saturday: null,
					sunday: null,
				},
			},
			rawScheduleText: { en: "Tue 9-12", es: "Mar 9-12" },
			closures: null,
			eligibility: null,
			tags: [],
			hidden: false,
		},
		{
			id: "loc-3",
			name: { en: "Hidden Pantry", es: "Oculta" },
			description: { en: "Description", es: "Descripcion" },
			address: "789 Elm St",
			city: "San Diego",
			state: "CA",
			postcode: "92101",
			timezone: "America/Los_Angeles",
			coordinates: { lat: 32.72, lng: -117.16 },
			phone: null,
			website: null,
			schedule: {
				type: "weekly",
				schedule: {
					monday: null,
					tuesday: null,
					wednesday: {
						open: { hour: 9, minute: 0 },
						close: { hour: 12, minute: 0 },
					},
					thursday: null,
					friday: null,
					saturday: null,
					sunday: null,
				},
			},
			rawScheduleText: { en: "Wed 9-12", es: "Mie 9-12" },
			closures: null,
			eligibility: null,
			tags: [],
			hidden: true,
		},
		{
			id: "loc-4",
			name: { en: "No Coords Pantry", es: "Sin Coords" },
			description: { en: "Description", es: "Descripcion" },
			address: "000 Nowhere",
			city: "San Diego",
			state: "CA",
			postcode: "92101",
			timezone: "America/Los_Angeles",
			phone: null,
			website: null,
			schedule: {
				type: "weekly",
				schedule: {
					monday: null,
					tuesday: null,
					wednesday: {
						open: { hour: 9, minute: 0 },
						close: { hour: 12, minute: 0 },
					},
					thursday: null,
					friday: null,
					saturday: null,
					sunday: null,
				},
			},
			rawScheduleText: { en: "Wed 9-12", es: "Mie 9-12" },
			closures: null,
			eligibility: null,
			tags: [],
			hidden: false,
		},
	],
}));

describe("useLocations", () => {
	beforeEach(() => {
		vi.useFakeTimers({ shouldAdvanceTime: true });
		// Wednesday Jan 3, 2024 at 10:00 AM PT = 18:00 UTC
		vi.setSystemTime(new Date("2024-01-03T18:00:00Z"));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	async function waitForLoad(result: { current: { isLoading: boolean } }) {
		await waitFor(() => {
			expect(result.current.isLoading).toBe(false);
		});
	}

	it("loads and returns visible locations", async () => {
		const { result } = renderHook(() =>
			useLocations({ filter: "this-week" }),
		);

		await waitForLoad(result);

		// 3 visible out of 4 (loc-3 is hidden)
		expect(result.current.total).toBe(3);
	});

	it("filters hidden locations", async () => {
		const { result } = renderHook(() =>
			useLocations({ filter: "this-week" }),
		);

		await waitForLoad(result);

		const ids = result.current.allLocations.map((l) => l.id);
		expect(ids).not.toContain("loc-3");
	});

	it("filters by open-now", async () => {
		// It's Wednesday 10 AM — loc-1 (Wed 9-12) and loc-4 (Wed 9-12) are open
		// loc-2 (Tue 9-12) is not
		const { result } = renderHook(() =>
			useLocations({ filter: "open-now" }),
		);

		await waitForLoad(result);

		const ids = result.current.locations.map((l) => l.id);
		expect(ids).toContain("loc-1");
		expect(ids).not.toContain("loc-2");
	});

	it("filters by today", async () => {
		// Wednesday — loc-1 and loc-4 are open Wed, loc-2 is Tue only
		const { result } = renderHook(() =>
			useLocations({ filter: "today" }),
		);

		await waitForLoad(result);

		const ids = result.current.locations.map((l) => l.id);
		expect(ids).toContain("loc-1");
		expect(ids).not.toContain("loc-2");
	});

	it("calculates distance when user coordinates provided", async () => {
		const { result } = renderHook(() =>
			useLocations({
				filter: "this-week",
				userCoordinates: { lat: 32.7157, lng: -117.1611 },
			}),
		);

		await waitForLoad(result);

		const loc1 = result.current.allLocations.find((l) => l.id === "loc-1");
		expect(loc1?.distance).toBeDefined();
		expect(typeof loc1?.distance).toBe("number");
		expect(loc1!.distance!).toBeLessThan(50);
	});

	it("has undefined distance for locations without coordinates", async () => {
		const { result } = renderHook(() =>
			useLocations({
				filter: "this-week",
				userCoordinates: { lat: 32.7157, lng: -117.1611 },
			}),
		);

		await waitForLoad(result);

		const noCoords = result.current.allLocations.find(
			(l) => l.id === "loc-4",
		);
		expect(noCoords?.distance).toBeUndefined();
	});

	it("sorts open locations first", async () => {
		// Wednesday 10 AM — loc-1 is open (Wed), loc-2 is closed (Tue)
		const { result } = renderHook(() =>
			useLocations({ filter: "this-week" }),
		);

		await waitForLoad(result);

		const locs = result.current.locations;
		const loc1Idx = locs.findIndex((l) => l.id === "loc-1");
		const loc2Idx = locs.findIndex((l) => l.id === "loc-2");
		expect(loc1Idx).toBeLessThan(loc2Idx);
	});

	it("tracks counts per filter", async () => {
		const { result } = renderHook(() =>
			useLocations({ filter: "this-week" }),
		);

		await waitForLoad(result);

		// Wed 10 AM: loc-1 and loc-4 are open now (Wed 9-12), loc-2 is not
		expect(result.current.counts["open-now"]).toBe(2);
		expect(result.current.counts.today).toBe(2);
		// Tomorrow is Thursday — no locations open Thu
		expect(result.current.counts.tomorrow).toBe(0);
		// This week includes Tue + Wed, so all 3 visible should be open this week
		expect(result.current.counts["this-week"]).toBe(3);
	});
});
