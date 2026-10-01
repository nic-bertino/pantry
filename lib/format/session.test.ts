import { describe, expect, it } from "vitest";
import translations from "@/lib/data/translations.json";
import type { TranslationKey } from "@/lib/i18n/use-translations";
import type { Locale, Session } from "@/lib/types/location";
import { describeSession, formatSessionHours } from "./session";

const TZ = "America/Los_Angeles";

function translator(locale: Locale) {
	return (key: TranslationKey, vars?: Record<string, string | number>) => {
		let text: string = translations[locale][key];
		for (const [k, v] of Object.entries(vars ?? {})) {
			text = text.replaceAll(`{${k}}`, String(v));
		}
		return text;
	};
}

// Wed Jan 3 2024 (PST, UTC-8)
const at = (day: number, hour: number, minute = 0) =>
	new Date(Date.UTC(2024, 0, day, hour + 8, minute));

const now = at(3, 17, 0); // Wed 5:00 PM

function session(day: number, open: number, close: number, dayOffset: number): Session {
	return { opensAt: at(day, open), closesAt: at(day, close), dayOffset };
}

describe("describeSession", () => {
	const en = { t: translator("en"), locale: "en" as const };
	const es = { t: translator("es"), locale: "es" as const };

	it("labels an open session with its closing time", () => {
		const label = describeSession(session(3, 16, 18, 0), now, TZ, { ...en, mode: "compact" });
		expect(label).toEqual({ tone: "open", text: "Open until 6 PM" });
	});

	it("drops the redundant 'Open' under an Open now heading", () => {
		const s = session(3, 16, 18, 0);
		expect(
			describeSession(s, now, TZ, { ...en, mode: "compact", underOpenHeading: true }).text,
		).toBe("Until 6 PM");
		expect(
			describeSession(s, now, TZ, { ...es, mode: "compact", underOpenHeading: true }).text,
		).toBe("Hasta las 6 PM");
	});

	it("uses 'la' for 1 o'clock in Spanish", () => {
		expect(describeSession(session(3, 12, 13, 0), at(3, 12, 30), TZ, { ...es, mode: "compact" }).text).toBe(
			"Abierto hasta la 1 PM",
		);
		expect(describeSession(session(4, 13, 15, 1), now, TZ, { ...es, mode: "full" }).text).toBe(
			"Abre mañana a la 1 PM",
		);
		expect(describeSession(session(4, 14, 15, 1), now, TZ, { ...es, mode: "full" }).text).toBe(
			"Abre mañana a las 2 PM",
		);
	});

	it("uses relative minutes within the hour", () => {
		const s = { opensAt: at(3, 17, 25), closesAt: at(3, 19), dayOffset: 0 };
		expect(describeSession(s, now, TZ, { ...en, mode: "compact" })).toEqual({
			tone: "soon",
			text: "Opens in 25 min",
		});
		expect(describeSession(s, now, TZ, { ...es, mode: "compact" }).text).toBe(
			"Abre en 25 min",
		);
	});

	it("shows a clock time for later today", () => {
		const s = session(3, 19, 20, 0);
		expect(describeSession(s, now, TZ, { ...en, mode: "compact" }).text).toBe("Opens 7 PM");
		expect(describeSession(s, now, TZ, { ...en, mode: "full" }).text).toBe(
			"Opens today at 7 PM",
		);
	});

	it("shows hours only for future days in compact mode", () => {
		const s = session(5, 9, 12, 2);
		expect(describeSession(s, now, TZ, { ...en, mode: "compact" })).toEqual({
			tone: "later",
			text: "9 AM – 12 PM",
		});
	});

	it("names the day in full mode, localized", () => {
		expect(describeSession(session(4, 9, 12, 1), now, TZ, { ...en, mode: "full" }).text).toBe(
			"Opens tomorrow at 9 AM",
		);
		expect(describeSession(session(5, 9, 12, 2), now, TZ, { ...en, mode: "full" }).text).toBe(
			"Opens Friday at 9 AM",
		);
		expect(describeSession(session(5, 9, 12, 2), now, TZ, { ...es, mode: "full" }).text).toBe(
			"Abre el viernes a las 9 AM",
		);
	});
});

describe("formatSessionHours", () => {
	it("formats with minutes when present", () => {
		const s = { opensAt: at(3, 9, 30), closesAt: at(3, 12, 30), dayOffset: 0 };
		expect(formatSessionHours(s, TZ)).toBe("9:30 AM – 12:30 PM");
	});
});
