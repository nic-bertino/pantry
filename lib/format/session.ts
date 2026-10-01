import type { TranslationKey } from "@/lib/i18n/use-translations";
import { getTimeInTimezone } from "@/lib/schedule/calculator";
import { formatTime } from "@/lib/schedule/parser";
import type { Locale, Session } from "@/lib/types/location";

export type Translate = (
	key: TranslationKey,
	vars?: Record<string, string | number>,
) => string;

/** Visual weight of a session label: open now, opening within the hour, or later */
export type SessionTone = "open" | "soon" | "later";

export interface SessionLabel {
	tone: SessionTone;
	text: string;
}

/** Sessions starting within this many minutes read as "Opens in N min" */
const SOON_MINUTES = 60;

export function intlLocale(locale: Locale): string {
	return locale === "es" ? "es-US" : "en-US";
}

const dateFormatters = new Map<string, Intl.DateTimeFormat>();

/** Locale-aware date formatting with formatters cached per locale/zone/options */
export function formatDateInZone(
	date: Date,
	timezone: string,
	locale: Locale,
	options: Pick<Intl.DateTimeFormatOptions, "weekday" | "month" | "day">,
): string {
	const key = `${locale}|${timezone}|${options.weekday}|${options.month}|${options.day}`;
	let formatter = dateFormatters.get(key);
	if (!formatter) {
		formatter = new Intl.DateTimeFormat(intlLocale(locale), {
			...options,
			timeZone: timezone,
		});
		dateFormatters.set(key, formatter);
	}
	return formatter.format(date);
}

function clockTime(date: Date, timezone: string): string {
	const local = getTimeInTimezone(date, timezone);
	return formatTime({ hour: local.hour, minute: local.minute });
}

/**
 * Template variables for a clock time. Spanish needs "la 1" but "las 2",
 * so its templates take the article as {art}; English templates ignore it.
 */
function timeVars(date: Date, timezone: string): { time: string; art: string } {
	const { hour } = getTimeInTimezone(date, timezone);
	return { time: clockTime(date, timezone), art: hour % 12 === 1 ? "la" : "las" };
}

/** "9 AM – 12:30 PM" */
export function formatSessionHours(session: Session, timezone: string): string {
	return `${clockTime(session.opensAt, timezone)} – ${clockTime(session.closesAt, timezone)}`;
}

/**
 * Describe a session relative to now.
 *
 * - `compact` is for list rows that sit under a day heading, so it omits the
 *   day: "Open until 6 PM", "Opens in 25 min", "Opens 7 PM", "9 AM – 12 PM".
 * - `full` stands alone (detail view, suggestions) and names the day:
 *   "Opens tomorrow at 9 AM", "Opens Friday at 9 AM".
 * - `underOpenHeading` drops the redundant "Open" when the row already sits
 *   under an "Open now" heading: "Until 6 PM".
 */
export function describeSession(
	session: Session,
	now: Date,
	timezone: string,
	{
		t,
		locale,
		mode,
		underOpenHeading = false,
	}: {
		t: Translate;
		locale: Locale;
		mode: "compact" | "full";
		underOpenHeading?: boolean;
	},
): SessionLabel {
	if (session.opensAt <= now) {
		return {
			tone: "open",
			text: t(underOpenHeading ? "openUntilShort" : "openUntil", timeVars(session.closesAt, timezone)),
		};
	}

	const minutesUntil = Math.ceil(
		(session.opensAt.getTime() - now.getTime()) / 60000,
	);
	if (session.dayOffset === 0 && minutesUntil <= SOON_MINUTES) {
		return { tone: "soon", text: t("opensIn", { minutes: minutesUntil }) };
	}

	const opens = timeVars(session.opensAt, timezone);

	if (mode === "compact") {
		return session.dayOffset === 0
			? { tone: "later", text: t("opensAt", opens) }
			: { tone: "later", text: formatSessionHours(session, timezone) };
	}

	if (session.dayOffset === 0) {
		return { tone: "later", text: t("opensTodayAt", opens) };
	}
	if (session.dayOffset === 1) {
		return { tone: "later", text: t("opensTomorrowAt", opens) };
	}
	const day = formatDateInZone(session.opensAt, timezone, locale, { weekday: "long" });
	return { tone: "later", text: t("opensDayAt", { ...opens, day }) };
}
