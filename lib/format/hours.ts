import type { DayOfWeek, Locale } from "@/lib/types/location";

/** Day abbreviations as they appear in rawScheduleText, indexed Sun–Sat */
const DAY_ABBREVIATIONS: Record<Locale, string[]> = {
	en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
	es: ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"],
};

// Accept either language's abbreviation, since untranslated text falls back to English
const DAY_INDEX = new Map<string, DayOfWeek>(
	Object.values(DAY_ABBREVIATIONS).flatMap((names) =>
		names.map((name, i) => [name.toLowerCase(), i as DayOfWeek] as const),
	),
);

export interface HoursRow {
	days: DayOfWeek[];
	/** "Mon", or "Mon–Fri" for a run of consecutive days with identical hours */
	label: string;
	hours: string;
}

/**
 * Parse weekly schedule text like
 * "Mon: 9:00 AM - 12:00 PM, Tue: 9:00 AM - 12:00 PM, Fri: 9:00 AM - 12:00 PM, 4:00 PM - 6:00 PM"
 * into display rows, merging consecutive days that share hours.
 *
 * Returns null for anything that isn't a "Day: hours" list (monthly patterns,
 * free-form notes) so callers can show the original text instead.
 */
export function parseHoursText(text: string, locale: Locale): HoursRow[] | null {
	if (!text.trim()) return null;

	// Split before each "Day:" so multi-range days ("9-12, 4-6") stay intact
	const entries = text.split(/,\s*(?=\p{L}{3}\.?:)/u);
	const parsed: { day: DayOfWeek; hours: string }[] = [];

	for (const entry of entries) {
		const match = entry.trim().match(/^(\p{L}{3})\.?:\s*(.+)$/u);
		const day = match && DAY_INDEX.get(match[1].toLowerCase());
		if (!match || day === undefined || day === null) return null;
		parsed.push({ day, hours: match[2].trim().replace(/\s*-\s*/g, " – ") });
	}

	const names = DAY_ABBREVIATIONS[locale];
	const rows: HoursRow[] = [];

	for (const { day, hours } of parsed) {
		const last = rows.at(-1);
		const lastDay = last?.days.at(-1);
		if (last && last.hours === hours && lastDay !== undefined && (lastDay + 1) % 7 === day) {
			last.days.push(day);
		} else {
			rows.push({ days: [day], label: "", hours });
		}
	}

	for (const row of rows) {
		const first = names[row.days[0]];
		const end = names[row.days[row.days.length - 1]];
		row.label = row.days.length > 1 ? `${first}–${end}` : first;
	}

	return rows;
}
