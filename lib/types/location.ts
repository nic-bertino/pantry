/**
 * Bilingual text content for English and Spanish
 */
export interface BilingualText {
	en: string;
	es: string;
}

/**
 * Parsed time range for schedule calculations
 */
export interface TimeRange {
	open: { hour: number; minute: number };
	close: { hour: number; minute: number };
}

/**
 * Weekly schedule with day-specific hours
 */
export interface WeeklySchedule {
	monday: TimeRange | null;
	tuesday: TimeRange | null;
	wednesday: TimeRange | null;
	thursday: TimeRange | null;
	friday: TimeRange | null;
	saturday: TimeRange | null;
	sunday: TimeRange | null;
}

/**
 * Day of week (0 = Sunday, 6 = Saturday)
 */
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Special schedule pattern like "1st and 3rd Wednesday"
 */
export interface SpecialPattern {
	weekday: DayOfWeek;
	occurrences: number[]; // e.g., [1, 3] for "1st and 3rd"
	timeRange: TimeRange;
}

/**
 * Union type for all schedule patterns
 */
export type SchedulePattern =
	| { type: "weekly"; schedule: WeeklySchedule }
	| { type: "special"; pattern: SpecialPattern }
	| { type: "unknown"; rawText: string };

/**
 * Service type tags
 */
export type ServiceTag = "Walk-up" | "Drive-through";

/**
 * Core food distribution location
 */
export interface FoodLocation {
	id: string;
	name: BilingualText;
	description: BilingualText;
	address: string;
	city: string;
	state: string;
	postcode: string;
	coordinates?: { lat: number; lng: number };
	phone: string | null;
	website: string | null;
	schedule: SchedulePattern;
	rawScheduleText: BilingualText;
	closures: BilingualText | null;
	eligibility: BilingualText | null;
	tags: ServiceTag[];
	hidden: boolean;
}

/**
 * Computed availability status
 */
export type AvailabilityStatus =
	| { status: "open"; closesAt: Date }
	| { status: "closed"; opensAt: Date | null }
	| { status: "opening-soon"; opensAt: Date; minutesUntil: number }
	| { status: "unknown" };

/**
 * Location with computed fields for display
 */
export interface DisplayLocation extends FoodLocation {
	availability: AvailabilityStatus;
	distance?: number; // Miles from user
}

/**
 * Time filter options
 */
export type TimeFilter = "open-now" | "today" | "tomorrow" | "this-week";

/**
 * App locale
 */
export type Locale = "en" | "es";

/**
 * Day names for lookup
 */
export const DAY_NAMES = [
	"sunday",
	"monday",
	"tuesday",
	"wednesday",
	"thursday",
	"friday",
	"saturday",
] as const;

export type DayName = (typeof DAY_NAMES)[number];
