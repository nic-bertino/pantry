"use client";

import { InfoIcon } from "lucide-react";
import { useTranslations } from "@/lib/i18n/use-translations";

/** One-line eligibility summary for list rows; full text lives in the detail view */
export function RequirementTag({ text }: { text: string }) {
	const { t } = useTranslations();

	return (
		<span className="inline-flex max-w-full items-center gap-1 rounded-md bg-caution/15 px-1.5 py-0.5 text-xs font-medium text-caution-foreground">
			<InfoIcon aria-hidden="true" className="size-3 shrink-0" />
			<span className="sr-only">{t("hasRequirements")}: </span>
			<span className="truncate">{text}</span>
		</span>
	);
}
