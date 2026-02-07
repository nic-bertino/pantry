import { afterEach, describe, expect, it, vi } from "vitest";
import type { SchedulePattern, SpecialPattern, WeeklySchedule } from "@/lib/types/location";
import {
	calculateAvailability,
	getNthWeekdayOfMonth,
	isOpenInRange,
	isOpenNow,
	isOpenOnDay,
	isOpenThisWeek,
	isOpenToday,
	isOpenTomorrow,
} from "./calculator";

const TZ = "America/Los_Angeles";

/**
 * Helper: build a UTC Date that represents a specific Pacific time.
 * During PST (standard time, Nov-Mar), PT = UTC-8.
 * Jan 3, 2024 (Wednesday) at 10:00 AM PT = 18:00 UTC
 */
function pacificDate(
	year: number,
	month: number,
	day: number,
	hour: number,
	minute = 0,
): Date {
	// Use Intl to figure out the actual UTC offset for the given date/time
	// We'll approximate by creating a UTC date and adjusting
	const utcGuess = new Date(Date.UTC(year, month, day, hour + 8, minute));

	// Verify the hour in Pacific time matches what we want
	const fmt = new Intl.DateTimeFormat("en-US", {
		timeZone: TZ,
		hour: "numeric",
		hour12: false,
	});
	const actualHour = Number.parseInt(fmt.format(utcGuess), 10);

	// Adjust if DST shifted us
	if (actualHour !== hour) {
		const diff = hour - actualHour;
		return new Date(utcGuess.getTime() + diff * 60 * 60 * 1000);
	}
	return utcGuess;
}

/** Helper: weekly schedule open only on a specific day */
function weeklyOn(
	day: keyof WeeklySchedule,
	openHour: number,
	closeHour: number,
): SchedulePattern {
	const schedule: WeeklySchedule = {
		monday: null,
		tuesday: null,
		wednesday: null,
		thursday: null,
		friday: null,
		saturday: null,
		sunday: null,
	};
	schedule[day] = {
		open: { hour: openHour, minute: 0 },
		close: { hour: closeHour, minute: 0 },
	};
	return { type: "weekly", schedule };
}

/** Helper: special pattern schedule */
function specialSchedule(
	weekday: 0 | 1 | 2 | 3 | 4 | 5 | 6,
	occurrences: number[],
	openHour: number,
	closeHour: number,
): SchedulePattern {
	return {
		type: "special",
		pattern: {
			weekday,
			occurrences,
			timeRange: {
				open: { hour: openHour, minute: 0 },
				close: { hour: closeHour, minute: 0 },
			},
		},
	};
}

const unknownSchedule: SchedulePattern = {
	type: "unknown",
	rawText: "Call for hours",
};

// -------------------------------------------------------------------
// getNthWeekdayOfMonth
// -------------------------------------------------------------------
describe("getNthWeekdayOfMonth", () => {
	it("finds the 1st Wednesday of January 2024", () => {
		const result = getNthWeekdayOfMonth(2024, 0, 3, 1);
		expect(result).not.toBeNull();
		expect(result!.getDate()).toBe(3);
		expect(result!.getMonth()).toBe(0);
	});

	it("finds the 5th Wednesday of January 2024", () => {
		const result = getNthWeekdayOfMonth(2024, 0, 3, 5);
		expect(result).not.toBeNull();
		expect(result!.getDate()).toBe(31);
	});

	it("returns null when 5th occurrence does not exist", () => {
		// February 2024 has only 4 Wednesdays
		expect(getNthWeekdayOfMonth(2024, 1, 3, 5)).toBeNull();
	});

	it("returns null for nth < 1", () => {
		expect(getNthWeekdayOfMonth(2024, 0, 3, 0)).toBeNull();
	});

	it("returns null for nth > 5", () => {
		expect(getNthWeekdayOfMonth(2024, 0, 3, 6)).toBeNull();
	});

	it("finds the 1st Sunday of a month", () => {
		// January 2024 starts on Monday, so first Sunday is Jan 7
		const result = getNthWeekdayOfMonth(2024, 0, 0, 1);
		expect(result).not.toBeNull();
		expect(result!.getDate()).toBe(7);
	});
});

// -------------------------------------------------------------------
// calculateAvailability — weekly schedules
// -------------------------------------------------------------------
describe("calculateAvailability", () => {
	describe("weekly schedule", () => {
		it("returns open when currently within hours", () => {
			// Wednesday 10:00 AM PT, schedule open Wed 9-12
			const now = pacificDate(2024, 0, 3, 10);
			const schedule = weeklyOn("wednesday", 9, 12);

			const result = calculateAvailability(schedule, now, TZ);
			expect(result.status).toBe("open");
			if (result.status === "open") {
				expect(result.closesAt).toBeInstanceOf(Date);
			}
		});

		it("returns closed when outside hours", () => {
			// Wednesday 13:00 PT, schedule open Wed 9-12
			const now = pacificDate(2024, 0, 3, 13);
			const schedule = weeklyOn("wednesday", 9, 12);

			const result = calculateAvailability(schedule, now, TZ);
			expect(result.status).toBe("closed");
		});

		it("returns opening-soon within 30 minutes of open", () => {
			// Wednesday 8:45 AM PT, schedule open Wed 9-12
			const now = pacificDate(2024, 0, 3, 8, 45);
			const schedule = weeklyOn("wednesday", 9, 12);

			const result = calculateAvailability(schedule, now, TZ);
			expect(result.status).toBe("opening-soon");
			if (result.status === "opening-soon") {
				expect(result.minutesUntil).toBe(15);
			}
		});

		it("does not return opening-soon when more than 30 min away", () => {
			// Wednesday 8:00 AM PT, schedule open Wed 9-12
			const now = pacificDate(2024, 0, 3, 8, 0);
			const schedule = weeklyOn("wednesday", 9, 12);

			const result = calculateAvailability(schedule, now, TZ);
			expect(result.status).toBe("closed");
		});

		it("returns closed with next opening date for wrong day", () => {
			// Tuesday 10:00 AM PT, schedule open Wed 9-12
			const now = pacificDate(2024, 0, 2, 10);
			const schedule = weeklyOn("wednesday", 9, 12);

			const result = calculateAvailability(schedule, now, TZ);
			expect(result.status).toBe("closed");
			if (result.status === "closed") {
				expect(result.opensAt).toBeInstanceOf(Date);
			}
		});

		it("is closed at exact close time (range is exclusive of close)", () => {
			// Wednesday 12:00 PM PT exactly, schedule open Wed 9-12
			const now = pacificDate(2024, 0, 3, 12, 0);
			const schedule = weeklyOn("wednesday", 9, 12);

			const result = calculateAvailability(schedule, now, TZ);
			expect(result.status).toBe("closed");
		});
	});

	describe("special schedule", () => {
		it("returns open on matching special day during hours", () => {
			// 1st Wednesday of Jan 2024 = Jan 3, at 10:00 AM
			const now = pacificDate(2024, 0, 3, 10);
			const schedule = specialSchedule(3, [1, 3], 9, 12);

			const result = calculateAvailability(schedule, now, TZ);
			expect(result.status).toBe("open");
		});

		it("returns closed on non-matching occurrence", () => {
			// 2nd Wednesday of Jan 2024 = Jan 10, at 10:00 AM
			const now = pacificDate(2024, 0, 10, 10);
			const schedule = specialSchedule(3, [1, 3], 9, 12);

			const result = calculateAvailability(schedule, now, TZ);
			expect(result.status).toBe("closed");
		});

		it("returns opening-soon on special day before open", () => {
			// 1st Wed Jan 2024, 8:45 AM
			const now = pacificDate(2024, 0, 3, 8, 45);
			const schedule = specialSchedule(3, [1, 3], 9, 12);

			const result = calculateAvailability(schedule, now, TZ);
			expect(result.status).toBe("opening-soon");
		});
	});

	describe("unknown schedule", () => {
		it("returns unknown status", () => {
			const result = calculateAvailability(unknownSchedule, new Date(), TZ);
			expect(result.status).toBe("unknown");
		});
	});

	describe("default parameters", () => {
		afterEach(() => {
			vi.useRealTimers();
		});

		it("uses current time and America/Los_Angeles when no args provided", () => {
			vi.useFakeTimers();
			// Set to a Wednesday at 10:00 AM PT (18:00 UTC) in January 2024
			vi.setSystemTime(new Date("2024-01-03T18:00:00Z"));

			const schedule = weeklyOn("wednesday", 9, 12);
			const result = calculateAvailability(schedule);
			expect(result.status).toBe("open");

			vi.useRealTimers();
		});
	});
});

// -------------------------------------------------------------------
// isOpenNow
// -------------------------------------------------------------------
describe("isOpenNow", () => {
	it("returns true when location is open", () => {
		const now = pacificDate(2024, 0, 3, 10);
		expect(isOpenNow(weeklyOn("wednesday", 9, 12), now, TZ)).toBe(true);
	});

	it("returns false when location is closed", () => {
		const now = pacificDate(2024, 0, 3, 13);
		expect(isOpenNow(weeklyOn("wednesday", 9, 12), now, TZ)).toBe(false);
	});
});

// -------------------------------------------------------------------
// isOpenToday
// -------------------------------------------------------------------
describe("isOpenToday", () => {
	it("returns true when schedule has hours for today", () => {
		// Wednesday
		const now = pacificDate(2024, 0, 3, 6);
		expect(isOpenToday(weeklyOn("wednesday", 9, 12), now, TZ)).toBe(true);
	});

	it("returns false when schedule has no hours for today", () => {
		// Wednesday, but schedule is for Tuesday
		const now = pacificDate(2024, 0, 3, 10);
		expect(isOpenToday(weeklyOn("tuesday", 9, 12), now, TZ)).toBe(false);
	});
});

// -------------------------------------------------------------------
// isOpenTomorrow
// -------------------------------------------------------------------
describe("isOpenTomorrow", () => {
	it("returns true when schedule has hours for tomorrow", () => {
		// Tuesday, schedule is for Wednesday
		const now = pacificDate(2024, 0, 2, 10);
		expect(isOpenTomorrow(weeklyOn("wednesday", 9, 12), now, TZ)).toBe(true);
	});

	it("returns false when schedule has no hours for tomorrow", () => {
		// Wednesday, schedule is for Wednesday (tomorrow is Thursday)
		const now = pacificDate(2024, 0, 3, 10);
		expect(isOpenTomorrow(weeklyOn("wednesday", 9, 12), now, TZ)).toBe(false);
	});
});

// -------------------------------------------------------------------
// isOpenThisWeek
// -------------------------------------------------------------------
describe("isOpenThisWeek", () => {
	it("returns true when schedule has hours within 7 days", () => {
		// Monday Jan 1, schedule open Wednesday
		const now = pacificDate(2024, 0, 1, 10);
		expect(isOpenThisWeek(weeklyOn("wednesday", 9, 12), now, TZ)).toBe(true);
	});

	it("returns true for unknown schedules", () => {
		expect(isOpenThisWeek(unknownSchedule, new Date(), TZ)).toBe(true);
	});
});

// -------------------------------------------------------------------
// isOpenOnDay
// -------------------------------------------------------------------
describe("isOpenOnDay", () => {
	it("returns true for weekly schedule on matching day", () => {
		const wed = pacificDate(2024, 0, 3, 10);
		expect(isOpenOnDay(weeklyOn("wednesday", 9, 12), wed, TZ)).toBe(true);
	});

	it("returns false for weekly schedule on non-matching day", () => {
		const tue = pacificDate(2024, 0, 2, 10);
		expect(isOpenOnDay(weeklyOn("wednesday", 9, 12), tue, TZ)).toBe(false);
	});

	it("returns true for special schedule on matching nth weekday", () => {
		// 1st Wednesday of Jan 2024 = Jan 3
		const jan3 = pacificDate(2024, 0, 3, 10);
		expect(isOpenOnDay(specialSchedule(3, [1, 3], 9, 12), jan3, TZ)).toBe(
			true,
		);
	});

	it("returns false for special schedule on non-matching nth", () => {
		// 2nd Wednesday of Jan 2024 = Jan 10
		const jan10 = pacificDate(2024, 0, 10, 10);
		expect(isOpenOnDay(specialSchedule(3, [1, 3], 9, 12), jan10, TZ)).toBe(
			false,
		);
	});

	it("returns false for unknown schedule", () => {
		expect(isOpenOnDay(unknownSchedule, new Date(), TZ)).toBe(false);
	});
});

// -------------------------------------------------------------------
// isOpenInRange
// -------------------------------------------------------------------
describe("isOpenInRange", () => {
	it("returns true when range covers an open day", () => {
		const start = pacificDate(2024, 0, 1, 10); // Monday
		const end = pacificDate(2024, 0, 5, 10); // Friday
		expect(isOpenInRange(weeklyOn("wednesday", 9, 12), start, end, TZ)).toBe(
			true,
		);
	});

	it("returns false when range does not cover any open day", () => {
		const start = pacificDate(2024, 0, 4, 10); // Thursday
		const end = pacificDate(2024, 0, 5, 10); // Friday
		expect(isOpenInRange(weeklyOn("wednesday", 9, 12), start, end, TZ)).toBe(
			false,
		);
	});
});
