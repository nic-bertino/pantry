import type {
	AvailabilityStatus,
	DayOfWeek,
	SchedulePattern,
	Session,
	SpecialPattern,
	TimeRange,
	WeeklySchedule,
} from "@/lib/types/location";
import { DAY_NAMES } from "@/lib/types/location";

/**
 * Time components in a specific timezone
 */
interface LocalTimeComponents {
	hour: number;
	minute: number;
	dayOfWeek: DayOfWeek;
	dayOfMonth: number;
	month: number;
	year: number;
}

// Constructing Intl.DateTimeFormat is ~35x slower than reusing one, and
// schedule math calls this thousands of times per render pass
const formatterCache = new Map<string, Intl.DateTimeFormat>();

function getFormatter(timezone: string): Intl.DateTimeFormat {
	let formatter = formatterCache.get(timezone);
	if (!formatter) {
		formatter = new Intl.DateTimeFormat("en-US", {
			timeZone: timezone,
			hour: "numeric",
			minute: "numeric",
			weekday: "short",
			day: "numeric",
			month: "numeric",
			year: "numeric",
			hour12: false,
		});
		formatterCache.set(timezone, formatter);
	}
	return formatter;
}

/**
 * Get current time components in a specific timezone using Intl API
 */
function getTimeInTimezone(date: Date, timezone: string): LocalTimeComponents {
	const parts = getFormatter(timezone).formatToParts(date);
	const getPart = (type: string) =>
		parts.find((p) => p.type === type)?.value || "";

	// Some engines report midnight as "24" with hour12: false
	const hour = Number.parseInt(getPart("hour"), 10) % 24;
	const minute = Number.parseInt(getPart("minute"), 10);
	const dayOfMonth = Number.parseInt(getPart("day"), 10);
	const month = Number.parseInt(getPart("month"), 10) - 1; // 0-indexed
	const year = Number.parseInt(getPart("year"), 10);

	// Map weekday string to DayOfWeek number
	const weekdayMap: Record<string, DayOfWeek> = {
		Sun: 0,
		Mon: 1,
		Tue: 2,
		Wed: 3,
		Thu: 4,
		Fri: 5,
		Sat: 6,
	};
	const dayOfWeek = weekdayMap[getPart("weekday")] ?? 0;

	return { hour, minute, dayOfWeek, dayOfMonth, month, year };
}

/**
 * Create a Date object representing a specific local time in a timezone.
 * Returns a Date that, when displayed in the given timezone, shows the specified time.
 */
function createDateInTimezone(
	year: number,
	month: number,
	day: number,
	hour: number,
	minute: number,
	timezone: string,
): Date {
	// Create an initial guess date in local time
	const localGuess = new Date(year, month, day, hour, minute, 0, 0);

	// Get what time it would be in the target timezone at this UTC instant
	const targetTime = getTimeInTimezone(localGuess, timezone);

	// Calculate the difference between what we want and what we got
	const wantedMinutes = hour * 60 + minute;
	const gotMinutes = targetTime.hour * 60 + targetTime.minute;
	const diffMinutes = wantedMinutes - gotMinutes;

	// Adjust by the difference
	return new Date(localGuess.getTime() + diffMinutes * 60 * 1000);
}

/**
 * Get the nth occurrence of a weekday in a given month
 * e.g., getNthWeekdayOfMonth(2024, 0, 3, 1) = 1st Wednesday of January 2024
 */
export function getNthWeekdayOfMonth(
	year: number,
	month: number,
	weekday: DayOfWeek,
	nth: number,
): Date | null {
	if (nth < 1 || nth > 5) return null;

	const firstOfMonth = new Date(year, month, 1);
	const firstWeekday = firstOfMonth.getDay() as DayOfWeek;

	// Calculate the first occurrence of the target weekday
	let dayOffset = weekday - firstWeekday;
	if (dayOffset < 0) dayOffset += 7;

	const firstOccurrence = 1 + dayOffset;
	const targetDay = firstOccurrence + (nth - 1) * 7;

	// Check if the target day is still in the same month
	const result = new Date(year, month, targetDay);
	if (result.getMonth() !== month) return null;

	return result;
}

/**
 * Check if a time is within a time range
 */
function isTimeInRange(
	hour: number,
	minute: number,
	range: TimeRange,
): boolean {
	const currentMinutes = hour * 60 + minute;
	const openMinutes = range.open.hour * 60 + range.open.minute;
	const closeMinutes = range.close.hour * 60 + range.close.minute;

	return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
}

/**
 * Calculate availability for a weekly schedule
 */
function calculateWeeklyAvailability(
	schedule: WeeklySchedule,
	now: Date,
	timezone: string,
): AvailabilityStatus {
	const localTime = getTimeInTimezone(now, timezone);
	const dayName = DAY_NAMES[localTime.dayOfWeek];
	const todaySchedule = schedule[dayName];

	// Check if open right now
	if (
		todaySchedule &&
		isTimeInRange(localTime.hour, localTime.minute, todaySchedule)
	) {
		const closesAt = createDateInTimezone(
			localTime.year,
			localTime.month,
			localTime.dayOfMonth,
			todaySchedule.close.hour,
			todaySchedule.close.minute,
			timezone,
		);
		return { status: "open", closesAt };
	}

	// Check if opening soon today (within 30 minutes)
	if (todaySchedule) {
		const openMinutes =
			todaySchedule.open.hour * 60 + todaySchedule.open.minute;
		const currentMinutes = localTime.hour * 60 + localTime.minute;
		const minutesUntilOpen = openMinutes - currentMinutes;

		if (minutesUntilOpen > 0 && minutesUntilOpen <= 30) {
			const opensAt = createDateInTimezone(
				localTime.year,
				localTime.month,
				localTime.dayOfMonth,
				todaySchedule.open.hour,
				todaySchedule.open.minute,
				timezone,
			);
			return {
				status: "opening-soon",
				opensAt,
				minutesUntil: minutesUntilOpen,
			};
		}
	}

	// Find next opening time
	const opensAt = findNextWeeklyOpening(schedule, now, timezone);
	return { status: "closed", opensAt };
}

/**
 * Find the next opening time for a weekly schedule.
 * Looks a full week ahead so once-a-week locations resolve to next week's
 * session after today's has passed.
 */
function findNextWeeklyOpening(
	schedule: WeeklySchedule,
	now: Date,
	timezone: string,
): Date | null {
	for (let offset = 0; offset <= 7; offset++) {
		const session = getNextSession(
			{ type: "weekly", schedule },
			now,
			timezone,
			{ fromDay: offset, toDay: offset },
		);
		if (session && session.opensAt > now) return session.opensAt;
	}
	return null;
}

/**
 * Calculate availability for a special schedule pattern
 */
function calculateSpecialAvailability(
	pattern: SpecialPattern,
	now: Date,
	timezone: string,
): AvailabilityStatus {
	const localTime = getTimeInTimezone(now, timezone);

	// Check if today is one of the special days and we're in the time range
	for (const nth of pattern.occurrences) {
		const specialDate = getNthWeekdayOfMonth(
			localTime.year,
			localTime.month,
			pattern.weekday,
			nth,
		);
		if (specialDate && specialDate.getDate() === localTime.dayOfMonth) {
			if (isTimeInRange(localTime.hour, localTime.minute, pattern.timeRange)) {
				const closesAt = createDateInTimezone(
					localTime.year,
					localTime.month,
					localTime.dayOfMonth,
					pattern.timeRange.close.hour,
					pattern.timeRange.close.minute,
					timezone,
				);
				return { status: "open", closesAt };
			}

			// Check if opening soon
			const openMinutes =
				pattern.timeRange.open.hour * 60 + pattern.timeRange.open.minute;
			const currentMinutes = localTime.hour * 60 + localTime.minute;
			const minutesUntilOpen = openMinutes - currentMinutes;

			if (minutesUntilOpen > 0 && minutesUntilOpen <= 30) {
				const opensAt = createDateInTimezone(
					localTime.year,
					localTime.month,
					localTime.dayOfMonth,
					pattern.timeRange.open.hour,
					pattern.timeRange.open.minute,
					timezone,
				);
				return {
					status: "opening-soon",
					opensAt,
					minutesUntil: minutesUntilOpen,
				};
			}
		}
	}

	// Find next special date
	const opensAt = findNextSpecialOpening(pattern, now, timezone);
	return { status: "closed", opensAt };
}

/**
 * Find the next opening time for a special schedule pattern
 */
function findNextSpecialOpening(
	pattern: SpecialPattern,
	now: Date,
	timezone: string,
): Date | null {
	const localTime = getTimeInTimezone(now, timezone);
	const { year, month, dayOfMonth } = localTime;

	// Check this month and next month
	for (let monthOffset = 0; monthOffset < 2; monthOffset++) {
		const checkMonth = (month + monthOffset) % 12;
		const checkYear = month + monthOffset > 11 ? year + 1 : year;

		for (const nth of pattern.occurrences) {
			const specialDate = getNthWeekdayOfMonth(
				checkYear,
				checkMonth,
				pattern.weekday,
				nth,
			);
			if (!specialDate) continue;

			const specialDay = specialDate.getDate();
			const specialMonth = specialDate.getMonth();
			const specialYear = specialDate.getFullYear();

			// Check if this date is in the future
			if (
				specialYear > year ||
				(specialYear === year && specialMonth > month) ||
				(specialYear === year && specialMonth === month && specialDay > dayOfMonth)
			) {
				return createDateInTimezone(
					specialYear,
					specialMonth,
					specialDay,
					pattern.timeRange.open.hour,
					pattern.timeRange.open.minute,
					timezone,
				);
			}

			// If today, check if opening time hasn't passed
			if (
				specialYear === year &&
				specialMonth === month &&
				specialDay === dayOfMonth
			) {
				const openMinutes =
					pattern.timeRange.open.hour * 60 + pattern.timeRange.open.minute;
				const currentMinutes = localTime.hour * 60 + localTime.minute;
				if (openMinutes > currentMinutes) {
					return createDateInTimezone(
						specialYear,
						specialMonth,
						specialDay,
						pattern.timeRange.open.hour,
						pattern.timeRange.open.minute,
						timezone,
					);
				}
			}
		}
	}

	return null;
}

/**
 * Calculate current availability status for a location
 */
export function calculateAvailability(
	schedule: SchedulePattern,
	now: Date = new Date(),
	timezone = "America/Los_Angeles",
): AvailabilityStatus {
	switch (schedule.type) {
		case "weekly":
			return calculateWeeklyAvailability(schedule.schedule, now, timezone);
		case "special":
			return calculateSpecialAvailability(schedule.pattern, now, timezone);
		case "unknown":
			return { status: "unknown" };
	}
}

/**
 * Check if a location is open during a specific day
 */
export function isOpenOnDay(
	schedule: SchedulePattern,
	date: Date,
	timezone = "America/Los_Angeles",
): boolean {
	const localTime = getTimeInTimezone(date, timezone);
	const dayOfWeek = localTime.dayOfWeek;

	switch (schedule.type) {
		case "weekly": {
			const dayName = DAY_NAMES[dayOfWeek];
			return schedule.schedule[dayName] !== null;
		}
		case "special": {
			if (schedule.pattern.weekday !== dayOfWeek) return false;

			for (const nth of schedule.pattern.occurrences) {
				const specialDate = getNthWeekdayOfMonth(
					localTime.year,
					localTime.month,
					schedule.pattern.weekday,
					nth,
				);
				if (specialDate && specialDate.getDate() === localTime.dayOfMonth) {
					return true;
				}
			}
			return false;
		}
		case "unknown":
			return false;
	}
}

/**
 * Check if a location is open within a date range
 */
export function isOpenInRange(
	schedule: SchedulePattern,
	startDate: Date,
	endDate: Date,
	timezone = "America/Los_Angeles",
): boolean {
	const current = new Date(startDate);
	while (current <= endDate) {
		if (isOpenOnDay(schedule, current, timezone)) return true;
		current.setDate(current.getDate() + 1);
	}
	return false;
}

/**
 * Filter helpers for time-based filters
 */
export function isOpenNow(
	schedule: SchedulePattern,
	now: Date = new Date(),
	timezone = "America/Los_Angeles",
): boolean {
	const status = calculateAvailability(schedule, now, timezone);
	return status.status === "open";
}

export function isOpenToday(
	schedule: SchedulePattern,
	now: Date = new Date(),
	timezone = "America/Los_Angeles",
): boolean {
	return getNextSession(schedule, now, timezone, { fromDay: 0, toDay: 0 }) !== null;
}

export function isOpenTomorrow(
	schedule: SchedulePattern,
	now: Date = new Date(),
	timezone = "America/Los_Angeles",
): boolean {
	return getNextSession(schedule, now, timezone, { fromDay: 1, toDay: 1 }) !== null;
}

/**
 * Open at some point in the next 7 days (today through 6 days out).
 * Matches the window used to label sessions, so nothing in "This Week"
 * resolves to a session that's actually a week or more away.
 */
export function isOpenThisWeek(
	schedule: SchedulePattern,
	now: Date = new Date(),
	timezone = "America/Los_Angeles",
): boolean {
	// Include unknown schedules - we can't determine they're NOT open this week
	if (schedule.type === "unknown") return true;
	return getNextSession(schedule, now, timezone, { fromDay: 0, toDay: 6 }) !== null;
}

/**
 * Build the instant at which the wall clock in `timezone` reads the given
 * local date and time. Day overflow (e.g. day 32) rolls into the next month.
 */
function dateAtLocalTime(
	year: number,
	month: number,
	day: number,
	hour: number,
	minute: number,
	timezone: string,
): Date {
	const wanted = Date.UTC(year, month, day, hour, minute);
	let guess = wanted;
	// Two passes settle the offset, including across DST transitions
	for (let i = 0; i < 2; i++) {
		const local = getTimeInTimezone(new Date(guess), timezone);
		const got = Date.UTC(
			local.year,
			local.month,
			local.dayOfMonth,
			local.hour,
			local.minute,
		);
		guess += wanted - got;
	}
	return new Date(guess);
}

/**
 * Hours on a specific calendar date, or null when closed that day
 */
function hoursOnDate(
	schedule: SchedulePattern,
	year: number,
	month: number,
	day: number,
	dayOfWeek: DayOfWeek,
): TimeRange | null {
	switch (schedule.type) {
		case "weekly":
			return schedule.schedule[DAY_NAMES[dayOfWeek]];
		case "special": {
			const { pattern } = schedule;
			if (pattern.weekday !== dayOfWeek) return null;
			const matches = pattern.occurrences.some(
				(nth) =>
					getNthWeekdayOfMonth(year, month, pattern.weekday, nth)?.getDate() ===
					day,
			);
			return matches ? pattern.timeRange : null;
		}
		case "unknown":
			return null;
	}
}

/**
 * Find the first session that hasn't ended yet, searching calendar days
 * `fromDay` through `toDay` (inclusive) relative to today in `timezone`.
 */
export function getNextSession(
	schedule: SchedulePattern,
	now: Date,
	timezone: string,
	{ fromDay = 0, toDay = 6 }: { fromDay?: number; toDay?: number } = {},
): Session | null {
	if (schedule.type === "unknown") return null;

	const today = getTimeInTimezone(now, timezone);

	for (let offset = fromDay; offset <= toDay; offset++) {
		const date = new Date(
			Date.UTC(today.year, today.month, today.dayOfMonth + offset),
		);
		const year = date.getUTCFullYear();
		const month = date.getUTCMonth();
		const day = date.getUTCDate();
		const range = hoursOnDate(
			schedule,
			year,
			month,
			day,
			date.getUTCDay() as DayOfWeek,
		);
		if (!range) continue;

		const opensAt = dateAtLocalTime(
			year,
			month,
			day,
			range.open.hour,
			range.open.minute,
			timezone,
		);
		const closesAt = dateAtLocalTime(
			year,
			month,
			day,
			range.close.hour,
			range.close.minute,
			timezone,
		);
		if (closesAt <= now) continue;

		return { opensAt, closesAt, dayOffset: offset };
	}

	return null;
}

/**
 * Export timezone helper for use in display components
 */
export { getTimeInTimezone };
