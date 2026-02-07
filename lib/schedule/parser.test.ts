import { describe, expect, it } from "vitest";
import {
	formatTime,
	formatTimeRange,
	formatTimeWithTimezone,
	getTimezoneAbbreviation,
	hasWeeklyHours,
	parseSchedule,
	parseSpecialPattern,
	parseTimeRange,
	parseWeeklySchedule,
} from "./parser";

describe("parseTimeRange", () => {
	it("parses 24-hour format", () => {
		expect(parseTimeRange("9:00 - 12:00")).toEqual({
			open: { hour: 9, minute: 0 },
			close: { hour: 12, minute: 0 },
		});
	});

	it("parses 12-hour AM/PM format", () => {
		expect(parseTimeRange("9:00 AM - 2:00 PM")).toEqual({
			open: { hour: 9, minute: 0 },
			close: { hour: 14, minute: 0 },
		});
	});

	it("handles noon correctly (12 PM)", () => {
		expect(parseTimeRange("12:00 PM - 1:00 PM")).toEqual({
			open: { hour: 12, minute: 0 },
			close: { hour: 13, minute: 0 },
		});
	});

	it("handles midnight correctly (12 AM)", () => {
		expect(parseTimeRange("12:00 AM - 1:00 AM")).toEqual({
			open: { hour: 0, minute: 0 },
			close: { hour: 1, minute: 0 },
		});
	});

	it("handles en-dash separator", () => {
		expect(parseTimeRange("9:00 \u2013 12:00")).toEqual({
			open: { hour: 9, minute: 0 },
			close: { hour: 12, minute: 0 },
		});
	});

	it("handles em-dash separator", () => {
		expect(parseTimeRange("9:00 \u2014 12:00")).toEqual({
			open: { hour: 9, minute: 0 },
			close: { hour: 12, minute: 0 },
		});
	});

	it("takes first range when multiple are provided", () => {
		expect(parseTimeRange("9:00 - 12:00, 1:00 - 3:00")).toEqual({
			open: { hour: 9, minute: 0 },
			close: { hour: 12, minute: 0 },
		});
	});

	it("parses time without minutes", () => {
		expect(parseTimeRange("9 am - 2 pm")).toEqual({
			open: { hour: 9, minute: 0 },
			close: { hour: 14, minute: 0 },
		});
	});

	it("parses a.m./p.m. period format", () => {
		expect(parseTimeRange("9:00 a.m. - 2:00 p.m.")).toEqual({
			open: { hour: 9, minute: 0 },
			close: { hour: 14, minute: 0 },
		});
	});

	it("returns null for empty string", () => {
		expect(parseTimeRange("")).toBeNull();
	});

	it("returns null for invalid format", () => {
		expect(parseTimeRange("not a time")).toBeNull();
	});
});

describe("parseWeeklySchedule", () => {
	it("parses day data with some days populated", () => {
		const result = parseWeeklySchedule({
			monday: "9:00 AM - 12:00 PM",
			tuesday: "",
			wednesday: "1:00 PM - 3:00 PM",
		});
		expect(result.monday).toEqual({
			open: { hour: 9, minute: 0 },
			close: { hour: 12, minute: 0 },
		});
		expect(result.tuesday).toBeNull();
		expect(result.wednesday).toEqual({
			open: { hour: 13, minute: 0 },
			close: { hour: 15, minute: 0 },
		});
		expect(result.thursday).toBeNull();
	});

	it("returns all null for empty data", () => {
		const result = parseWeeklySchedule({});
		expect(result.monday).toBeNull();
		expect(result.tuesday).toBeNull();
		expect(result.wednesday).toBeNull();
		expect(result.thursday).toBeNull();
		expect(result.friday).toBeNull();
		expect(result.saturday).toBeNull();
		expect(result.sunday).toBeNull();
	});
});

describe("hasWeeklyHours", () => {
	it("returns true when at least one day has hours", () => {
		const schedule = parseWeeklySchedule({ tuesday: "9:00 - 12:00" });
		expect(hasWeeklyHours(schedule)).toBe(true);
	});

	it("returns false when all days are null", () => {
		const schedule = parseWeeklySchedule({});
		expect(hasWeeklyHours(schedule)).toBe(false);
	});
});

describe("parseSpecialPattern", () => {
	it("parses '1st and 3rd Wednesday' pattern with time", () => {
		const result = parseSpecialPattern(
			"1st and 3rd Wednesday of the month from 12:00 - 2:00 p.m.",
		);
		expect(result).toEqual({
			weekday: 3,
			occurrences: [1, 3],
			timeRange: {
				open: { hour: 12, minute: 0 },
				close: { hour: 14, minute: 0 },
			},
		});
	});

	it("parses '2nd and 4th Friday' pattern", () => {
		const result = parseSpecialPattern(
			"2nd and 4th Friday 9:00 AM - 11:00 AM",
		);
		expect(result).toEqual({
			weekday: 5,
			occurrences: [2, 4],
			timeRange: {
				open: { hour: 9, minute: 0 },
				close: { hour: 11, minute: 0 },
			},
		});
	});

	it("parses single occurrence pattern", () => {
		const result = parseSpecialPattern("3rd Saturday 10:00 AM - 12:00 PM");
		expect(result).toEqual({
			weekday: 6,
			occurrences: [3],
			timeRange: {
				open: { hour: 10, minute: 0 },
				close: { hour: 12, minute: 0 },
			},
		});
	});

	it("defaults time range when no time found", () => {
		const result = parseSpecialPattern("1st Wednesday of the month");
		expect(result).not.toBeNull();
		expect(result!.timeRange).toEqual({
			open: { hour: 9, minute: 0 },
			close: { hour: 12, minute: 0 },
		});
	});

	it("returns null for non-matching text", () => {
		expect(parseSpecialPattern("Every day")).toBeNull();
		expect(parseSpecialPattern("")).toBeNull();
	});
});

describe("parseSchedule", () => {
	it("returns weekly type when day data has hours", () => {
		const result = parseSchedule("", { tuesday: "9:00 - 12:00" });
		expect(result.type).toBe("weekly");
	});

	it("returns special type when text matches pattern and no day hours", () => {
		const result = parseSchedule("1st and 3rd Wednesday 9:00 AM - 12:00 PM", {});
		expect(result.type).toBe("special");
	});

	it("returns unknown when nothing matches", () => {
		const result = parseSchedule("Call for hours", {});
		expect(result.type).toBe("unknown");
		if (result.type === "unknown") {
			expect(result.rawText).toBe("Call for hours");
		}
	});

	it("returns unknown with default text when no schedule text", () => {
		const result = parseSchedule("", {});
		expect(result.type).toBe("unknown");
		if (result.type === "unknown") {
			expect(result.rawText).toBe("Schedule not available");
		}
	});

	it("prefers weekly over special when day data has hours", () => {
		const result = parseSchedule("1st Wednesday 9:00 AM - 12:00 PM", {
			monday: "9:00 - 12:00",
		});
		expect(result.type).toBe("weekly");
	});
});

describe("formatTime", () => {
	it("formats morning time", () => {
		expect(formatTime({ hour: 9, minute: 0 })).toBe("9 AM");
	});

	it("formats afternoon time with minutes", () => {
		expect(formatTime({ hour: 14, minute: 30 })).toBe("2:30 PM");
	});

	it("formats midnight", () => {
		expect(formatTime({ hour: 0, minute: 0 })).toBe("12 AM");
	});

	it("formats noon", () => {
		expect(formatTime({ hour: 12, minute: 0 })).toBe("12 PM");
	});

	it("omits minutes when zero", () => {
		expect(formatTime({ hour: 9, minute: 0 })).toBe("9 AM");
		expect(formatTime({ hour: 9, minute: 0 })).not.toContain(":00");
	});

	it("includes minutes when non-zero", () => {
		expect(formatTime({ hour: 9, minute: 15 })).toBe("9:15 AM");
	});
});

describe("formatTimeRange", () => {
	it("formats a range with dash separator", () => {
		const range = {
			open: { hour: 9, minute: 0 },
			close: { hour: 14, minute: 30 },
		};
		expect(formatTimeRange(range)).toBe("9 AM - 2:30 PM");
	});
});

describe("getTimezoneAbbreviation", () => {
	it("returns a non-empty string for valid timezone", () => {
		const abbr = getTimezoneAbbreviation("America/Los_Angeles");
		expect(abbr).toBeTruthy();
		expect(typeof abbr).toBe("string");
	});

	it("returns a non-empty string for eastern timezone", () => {
		const abbr = getTimezoneAbbreviation("America/New_York");
		expect(abbr).toBeTruthy();
	});
});

describe("formatTimeWithTimezone", () => {
	it("includes timezone abbreviation", () => {
		const result = formatTimeWithTimezone(
			{ hour: 9, minute: 0 },
			"America/Los_Angeles",
		);
		expect(result).toMatch(/^9 AM \w+$/);
	});

	it("includes minutes when non-zero", () => {
		const result = formatTimeWithTimezone(
			{ hour: 14, minute: 30 },
			"America/Los_Angeles",
		);
		expect(result).toMatch(/^2:30 PM \w+$/);
	});
});
