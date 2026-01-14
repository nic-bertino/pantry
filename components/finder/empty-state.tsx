"use client";

import Image from "next/image";
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
			<Image
				src="/pantry-app.png"
				alt=""
				width={48}
				height={48}
				className="w-12 h-12 opacity-50"
			/>
			<h3 className="mt-4 font-semibold">{getMessage()}</h3>
			<p className="mt-1 text-sm text-muted-foreground">
				{t("tryDifferentFilter")}
			</p>
		</div>
	);
}
