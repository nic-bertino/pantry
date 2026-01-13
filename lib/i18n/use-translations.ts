"use client";

import { useParams } from "next/navigation";
import translations from "@/lib/data/translations.json";
import type { BilingualText, Locale } from "@/lib/types/location";

type TranslationKey = keyof typeof translations.en;

export function useTranslations() {
	const params = useParams();
	const locale = (params?.locale as Locale) || "en";

	/**
	 * Get translated UI string with optional variable interpolation
	 */
	const t = (
		key: TranslationKey,
		vars?: Record<string, string | number>,
	): string => {
		const dict = translations[locale] || translations.en;
		let text = dict[key] || translations.en[key] || key;

		// Replace template variables like {time}, {count}, etc.
		if (vars) {
			Object.entries(vars).forEach(([k, v]) => {
				text = text.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
			});
		}

		return text;
	};

	/**
	 * Get localized text from a BilingualText object
	 */
	const tBilingual = (content: BilingualText | null | undefined): string => {
		if (!content) return "";
		return content[locale] || content.en || "";
	};

	return { t, tBilingual, locale };
}

export type { TranslationKey, Locale };
