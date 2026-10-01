import { describe, expect, it } from "vitest";
import { parseHoursText } from "./hours";

describe("parseHoursText", () => {
	it("merges consecutive days with identical hours", () => {
		const rows = parseHoursText(
			"Mon: 8:00 AM - 4:30 PM, Tue: 8:00 AM - 4:30 PM, Wed: 8:00 AM - 4:30 PM, Thu: 8:00 AM - 4:30 PM, Fri: 8:00 AM - 4:30 PM",
			"en",
		);
		expect(rows).toEqual([
			{ days: [1, 2, 3, 4, 5], label: "Mon–Fri", hours: "8:00 AM – 4:30 PM" },
		]);
	});

	it("keeps non-consecutive days and differing hours separate", () => {
		const rows = parseHoursText(
			"Mon: 11:00 AM - 12:00 PM, Wed: 10:30 AM - 11:30 AM, Thu: 10:30 AM - 11:30 AM, Fri: 11:00 AM - 12:00 PM",
			"en",
		);
		expect(rows?.map((r) => r.label)).toEqual(["Mon", "Wed–Thu", "Fri"]);
	});

	it("keeps multiple ranges on the same day together", () => {
		const rows = parseHoursText(
			"Thu: 9:30 AM - 12:30 PM, Fri: 9:30 AM - 12:30 PM, 4:00 PM - 6:00 PM",
			"en",
		);
		expect(rows).toEqual([
			{ days: [4], label: "Thu", hours: "9:30 AM – 12:30 PM" },
			{ days: [5], label: "Fri", hours: "9:30 AM – 12:30 PM, 4:00 PM – 6:00 PM" },
		]);
	});

	it("parses Spanish day names and labels in Spanish", () => {
		const rows = parseHoursText("Lun: 8:00 AM - 4:30 PM, Mar: 8:00 AM - 4:30 PM, Sáb: 9:00 AM - 10:00 AM", "es");
		expect(rows?.map((r) => r.label)).toEqual(["Lun–Mar", "Sáb"]);
	});

	it("labels English text in Spanish when the translation is missing", () => {
		expect(parseHoursText("Wed: 10:00 AM - 1:00 PM", "es")?.[0].label).toBe("Mié");
	});

	it("returns null for monthly patterns and free-form text", () => {
		expect(parseHoursText("1st Thursday of the month from 5:30 - 6:30 PM", "en")).toBeNull();
		expect(parseHoursText("Call for hours", "en")).toBeNull();
		expect(parseHoursText("", "en")).toBeNull();
	});
});
