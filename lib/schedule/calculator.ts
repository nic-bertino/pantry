import type {
	AvailabilityStatus,
	DayOfWeek,
	SchedulePattern,
	SpecialPattern,
	TimeRange,
	WeeklySchedule,
} from "@/lib/types/location";
import { DAY_NAMES } from "@/lib/types/location";

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
): AvailabilityStatus {
	const dayOfWeek = now.getDay();
	const dayName = DAY_NAMES[dayOfWeek];
	const todaySchedule = schedule[dayName];
	const currentHour = now.getHours();
	const currentMinute = now.getMinutes();

	// Check if open right now
	if (
		todaySchedule &&
		isTimeInRange(currentHour, currentMinute, todaySchedule)
	) {
		const closesAt = new Date(now);
		closesAt.setHours(
			todaySchedule.close.hour,
			todaySchedule.close.minute,
			0,
			0,
		);
		return { status: "open", closesAt };
	}

	// Check if opening soon today (within 30 minutes)
	if (todaySchedule) {
		const openMinutes =
			todaySchedule.open.hour * 60 + todaySchedule.open.minute;
		const currentMinutes = currentHour * 60 + currentMinute;
		const minutesUntilOpen = openMinutes - currentMinutes;

		if (minutesUntilOpen > 0 && minutesUntilOpen <= 30) {
			const opensAt = new Date(now);
			opensAt.setHours(
				todaySchedule.open.hour,
				todaySchedule.open.minute,
				0,
				0,
			);
			return {
				status: "opening-soon",
				opensAt,
				minutesUntil: minutesUntilOpen,
			};
		}
	}

	// Find next opening time
	const opensAt = findNextWeeklyOpening(schedule, now);
	return { status: "closed", opensAt };
}

/**
 * Find the next opening time for a weekly schedule
 */
function findNextWeeklyOpening(
	schedule: WeeklySchedule,
	now: Date,
): Date | null {
	const currentDay = now.getDay();
	const currentHour = now.getHours();
	const currentMinute = now.getMinutes();

	// Check remaining time today and next 7 days
	for (let offset = 0; offset < 7; offset++) {
		const checkDay = (currentDay + offset) % 7;
		const dayName = DAY_NAMES[checkDay];
		const daySchedule = schedule[dayName];

		if (daySchedule) {
			// If today, check if we haven't passed the opening time
			if (offset === 0) {
				const openMinutes =
					daySchedule.open.hour * 60 + daySchedule.open.minute;
				const currentMinutes = currentHour * 60 + currentMinute;
				if (openMinutes > currentMinutes) {
					const opensAt = new Date(now);
					opensAt.setHours(
						daySchedule.open.hour,
						daySchedule.open.minute,
						0,
						0,
					);
					return opensAt;
				}
			} else {
				// Future day
				const opensAt = new Date(now);
				opensAt.setDate(opensAt.getDate() + offset);
				opensAt.setHours(daySchedule.open.hour, daySchedule.open.minute, 0, 0);
				return opensAt;
			}
		}
	}

	return null;
}

/**
 * Calculate availability for a special schedule pattern
 */
function calculateSpecialAvailability(
	pattern: SpecialPattern,
	now: Date,
): AvailabilityStatus {
	const currentHour = now.getHours();
	const currentMinute = now.getMinutes();

	// Check if today is one of the special days and we're in the time range
	const today = now.getDate();
	const month = now.getMonth();
	const year = now.getFullYear();

	for (const nth of pattern.occurrences) {
		const specialDate = getNthWeekdayOfMonth(year, month, pattern.weekday, nth);
		if (specialDate && specialDate.getDate() === today) {
			if (isTimeInRange(currentHour, currentMinute, pattern.timeRange)) {
				const closesAt = new Date(now);
				closesAt.setHours(
					pattern.timeRange.close.hour,
					pattern.timeRange.close.minute,
					0,
					0,
				);
				return { status: "open", closesAt };
			}

			// Check if opening soon
			const openMinutes =
				pattern.timeRange.open.hour * 60 + pattern.timeRange.open.minute;
			const currentMinutes = currentHour * 60 + currentMinute;
			const minutesUntilOpen = openMinutes - currentMinutes;

			if (minutesUntilOpen > 0 && minutesUntilOpen <= 30) {
				const opensAt = new Date(now);
				opensAt.setHours(
					pattern.timeRange.open.hour,
					pattern.timeRange.open.minute,
					0,
					0,
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
	const opensAt = findNextSpecialOpening(pattern, now);
	return { status: "closed", opensAt };
}

/**
 * Find the next opening time for a special schedule pattern
 */
function findNextSpecialOpening(
	pattern: SpecialPattern,
	now: Date,
): Date | null {
	const year = now.getFullYear();
	const month = now.getMonth();
	const today = now.getDate();
	const currentHour = now.getHours();
	const currentMinute = now.getMinutes();

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

			// Check if this date is in the future
			if (
				specialDate.getFullYear() > year ||
				(specialDate.getFullYear() === year &&
					specialDate.getMonth() > month) ||
				(specialDate.getFullYear() === year &&
					specialDate.getMonth() === month &&
					specialDate.getDate() > today)
			) {
				specialDate.setHours(
					pattern.timeRange.open.hour,
					pattern.timeRange.open.minute,
					0,
					0,
				);
				return specialDate;
			}

			// If today, check if opening time hasn't passed
			if (
				specialDate.getFullYear() === year &&
				specialDate.getMonth() === month &&
				specialDate.getDate() === today
			) {
				const openMinutes =
					pattern.timeRange.open.hour * 60 + pattern.timeRange.open.minute;
				const currentMinutes = currentHour * 60 + currentMinute;
				if (openMinutes > currentMinutes) {
					specialDate.setHours(
						pattern.timeRange.open.hour,
						pattern.timeRange.open.minute,
						0,
						0,
					);
					return specialDate;
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
): AvailabilityStatus {
	switch (schedule.type) {
		case "weekly":
			return calculateWeeklyAvailability(schedule.schedule, now);
		case "special":
			return calculateSpecialAvailability(schedule.pattern, now);
		case "unknown":
			return { status: "unknown" };
	}
}

/**
 * Check if a location is open during a specific day
 */
export function isOpenOnDay(schedule: SchedulePattern, date: Date): boolean {
	const dayOfWeek = date.getDay() as DayOfWeek;

	switch (schedule.type) {
		case "weekly": {
			const dayName = DAY_NAMES[dayOfWeek];
			return schedule.schedule[dayName] !== null;
		}
		case "special": {
			if (schedule.pattern.weekday !== dayOfWeek) return false;
			const month = date.getMonth();
			const year = date.getFullYear();
			const dayOfMonth = date.getDate();

			for (const nth of schedule.pattern.occurrences) {
				const specialDate = getNthWeekdayOfMonth(
					year,
					month,
					schedule.pattern.weekday,
					nth,
				);
				if (specialDate && specialDate.getDate() === dayOfMonth) {
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
): boolean {
	const current = new Date(startDate);
	while (current <= endDate) {
		if (isOpenOnDay(schedule, current)) return true;
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
): boolean {
	const status = calculateAvailability(schedule, now);
	return status.status === "open";
}

export function isOpenToday(
	schedule: SchedulePattern,
	now: Date = new Date(),
): boolean {
	return isOpenOnDay(schedule, now);
}

export function isOpenTomorrow(
	schedule: SchedulePattern,
	now: Date = new Date(),
): boolean {
	const tomorrow = new Date(now);
	tomorrow.setDate(tomorrow.getDate() + 1);
	return isOpenOnDay(schedule, tomorrow);
}

export function isOpenThisWeek(
	schedule: SchedulePattern,
	now: Date = new Date(),
): boolean {
	const endOfWeek = new Date(now);
	endOfWeek.setDate(endOfWeek.getDate() + 7);
	return isOpenInRange(schedule, now, endOfWeek);
}
