"use client";

import { useTranslations } from "@/lib/i18n/use-translations";
import type { TimeFilter } from "@/lib/types/location";

interface EmptyStateProps {
	filter: TimeFilter;
}

export function EmptyState({ filter }: EmptyStateProps) {
	const { t } = useTranslations();

	const getMessage = () => {
		switch (filter) {
			case "open-now":
				return t("noLocationsOpenNow");
			case "today":
				return t("noLocationsToday");
			default:
				return t("noLocationsFound");
		}
	};

	return (
		<div className="flex flex-col items-center justify-center py-16 text-center px-4">
			<h3 className="font-semibold">{getMessage()}</h3>
			<p className="mt-1 text-sm text-muted-foreground">
				{t("tryDifferentFilter")}
			</p>
		</div>
	);
}
