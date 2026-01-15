import type {
	DayOfWeek,
	SchedulePattern,
	SpecialPattern,
	TimeRange,
	WeeklySchedule,
} from "@/lib/types/location";

/**
 * Parse a time string like "9:00", "9:00 AM", "14:00" into hour/minute
 */
function parseTime(timeStr: string): { hour: number; minute: number } | null {
	const cleaned = timeStr.trim().toLowerCase();

	// Match patterns like "9:00", "9:00 am", "14:00", "9 am"
	const match = cleaned.match(
		/^(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)?$/,
	);
	if (!match) return null;

	let hour = parseInt(match[1], 10);
	const minute = match[2] ? parseInt(match[2], 10) : 0;
	const period = match[3]?.replace(/\./g, "");

	// Convert 12-hour to 24-hour
	if (period === "pm" && hour < 12) hour += 12;
	if (period === "am" && hour === 12) hour = 0;

	// Validate
	if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;

	return { hour, minute };
}

/**
 * Parse a time range string like "9:00 - 12:00" or "9:00 AM - 2:00 PM"
 */
export function parseTimeRange(rangeStr: string): TimeRange | null {
	if (!rangeStr || rangeStr.trim() === "") return null;

	// Handle multiple time ranges (take the first one)
	const firstRange = rangeStr.split(",")[0].trim();

	// Split on various dash characters
	const parts = firstRange.split(/\s*[-–—]\s*/);
	if (parts.length !== 2) return null;

	const open = parseTime(parts[0]);
	const close = parseTime(parts[1]);

	if (!open || !close) return null;

	return { open, close };
}

/**
 * Parse weekly schedule from day columns
 */
export function parseWeeklySchedule(
	dayData: Record<string, string>,
): WeeklySchedule {
	return {
		monday: parseTimeRange(dayData.monday || ""),
		tuesday: parseTimeRange(dayData.tuesday || ""),
		wednesday: parseTimeRange(dayData.wednesday || ""),
		thursday: parseTimeRange(dayData.thursday || ""),
		friday: parseTimeRange(dayData.friday || ""),
		saturday: parseTimeRange(dayData.saturday || ""),
		sunday: parseTimeRange(dayData.sunday || ""),
	};
}

/**
 * Check if a weekly schedule has any hours
 */
export function hasWeeklyHours(schedule: WeeklySchedule): boolean {
	return Object.values(schedule).some((day) => day !== null);
}

/**
 * Map day name to day of week number
 */
const DAY_NAME_TO_NUMBER: Record<string, DayOfWeek> = {
	sunday: 0,
	sun: 0,
	monday: 1,
	mon: 1,
	tuesday: 2,
	tue: 2,
	tues: 2,
	wednesday: 3,
	wed: 3,
	thursday: 4,
	thu: 4,
	thur: 4,
	thurs: 4,
	friday: 5,
	fri: 5,
	saturday: 6,
	sat: 6,
};

/**
 * Parse ordinal like "1st", "2nd", "3rd", "4th" to number
 */
function parseOrdinal(ordinal: string): number | null {
	const match = ordinal.match(/^(\d+)(?:st|nd|rd|th)$/i);
	if (!match) return null;
	const num = parseInt(match[1], 10);
	return num >= 1 && num <= 5 ? num : null;
}

/**
 * Parse special schedule patterns like "1st and 3rd Wednesday of the month from 12:00 - 2:00 p.m."
 */
export function parseSpecialPattern(text: string): SpecialPattern | null {
	const _lower = text.toLowerCase();

	// Pattern: "1st and 3rd Wednesday" or "2nd and 4th Friday"
	const ordinalPattern =
		/(\d+(?:st|nd|rd|th))(?:\s*(?:and|&|,)\s*(\d+(?:st|nd|rd|th)))?(?:\s*(?:and|&|,)\s*(\d+(?:st|nd|rd|th)))?\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday|sun|mon|tue|tues|wed|thu|thur|thurs|fri|sat)/i;

	const ordinalMatch = text.match(ordinalPattern);
	if (!ordinalMatch) return null;

	const occurrences: number[] = [];
	[ordinalMatch[1], ordinalMatch[2], ordinalMatch[3]].forEach((ord) => {
		if (ord) {
			const num = parseOrdinal(ord);
			if (num) occurrences.push(num);
		}
	});

	if (occurrences.length === 0) return null;

	const dayName = ordinalMatch[4].toLowerCase();
	const weekday = DAY_NAME_TO_NUMBER[dayName];
	if (weekday === undefined) return null;

	// Extract time range from the text
	const timePattern =
		/(\d{1,2}(?::\d{2})?\s*(?:am|pm|a\.m\.|p\.m\.)?)\s*[-–—]\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm|a\.m\.|p\.m\.)?)/i;
	const timeMatch = text.match(timePattern);

	let timeRange: TimeRange;
	if (timeMatch) {
		const parsed = parseTimeRange(`${timeMatch[1]} - ${timeMatch[2]}`);
		if (parsed) {
			timeRange = parsed;
		} else {
			// Default time range if parsing fails
			timeRange = {
				open: { hour: 9, minute: 0 },
				close: { hour: 12, minute: 0 },
			};
		}
	} else {
		// Default time range if not found
		timeRange = {
			open: { hour: 9, minute: 0 },
			close: { hour: 12, minute: 0 },
		};
	}

	return { weekday, occurrences, timeRange };
}

/**
 * Main schedule parser - determines schedule type and parses accordingly
 */
export function parseSchedule(
	scheduleText: string,
	dayData: Record<string, string>,
): SchedulePattern {
	const weekly = parseWeeklySchedule(dayData);

	// If we have weekly hours in the day columns, use those
	if (hasWeeklyHours(weekly)) {
		return { type: "weekly", schedule: weekly };
	}

	// Try to parse special patterns from schedule text
	if (scheduleText) {
		const special = parseSpecialPattern(scheduleText);
		if (special) {
			return { type: "special", pattern: special };
		}
	}

	// Fallback to unknown with raw text
	return { type: "unknown", rawText: scheduleText || "Schedule not available" };
}

/**
 * Format time for display
 */
export function formatTime(time: { hour: number; minute: number }): string {
	const hour12 = time.hour % 12 || 12;
	const period = time.hour < 12 ? "AM" : "PM";
	const minutes =
		time.minute > 0 ? `:${time.minute.toString().padStart(2, "0")}` : "";
	return `${hour12}${minutes} ${period}`;
}

/**
 * Format time range for display
 */
export function formatTimeRange(range: TimeRange): string {
	return `${formatTime(range.open)} - ${formatTime(range.close)}`;
}

/**
 * Get short timezone abbreviation (PT, MT, CT, ET, etc.)
 */
export function getTimezoneAbbreviation(timezone: string): string {
	const formatter = new Intl.DateTimeFormat("en-US", {
		timeZone: timezone,
		timeZoneName: "short",
	});
	const parts = formatter.formatToParts(new Date());
	const tzPart = parts.find((p) => p.type === "timeZoneName");
	return tzPart?.value || "";
}

/**
 * Format time for display with timezone indicator
 */
export function formatTimeWithTimezone(
	time: { hour: number; minute: number },
	timezone: string,
): string {
	const hour12 = time.hour % 12 || 12;
	const period = time.hour < 12 ? "AM" : "PM";
	const minutes =
		time.minute > 0 ? `:${time.minute.toString().padStart(2, "0")}` : "";
	const tzAbbr = getTimezoneAbbreviation(timezone);
	return `${hour12}${minutes} ${period} ${tzAbbr}`;
}
