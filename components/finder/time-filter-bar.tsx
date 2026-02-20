"use client";

import { approximateCount } from "@/lib/format/count";
import { useTranslations } from "@/lib/i18n/use-translations";
import type { TimeFilter } from "@/lib/types/location";

interface TimeFilterBarProps {
	activeFilter: TimeFilter;
	onFilterChange: (filter: TimeFilter) => void;
	counts?: Record<TimeFilter, number>;
	locationInput?: React.ReactNode;
	distanceChips?: React.ReactNode;
}

const FILTERS: TimeFilter[] = ["open-now", "today", "tomorrow", "this-week"];

export function TimeFilterBar({
	activeFilter,
	onFilterChange,
	counts,
	locationInput,
	distanceChips,
}: TimeFilterBarProps) {
	const { t, locale } = useTranslations();

	const filterLabels: Record<TimeFilter, string> = {
		"open-now": t("filterOpenNow"),
		today: t("filterToday"),
		tomorrow: t("filterTomorrow"),
		"this-week": t("filterThisWeek"),
	};

	return (
		<nav
			aria-label={locale === "es" ? "Filtros" : "Filters"}
			className="border-b border-border"
		>
			<div className="container mx-auto px-4 py-2">
				<div
					className="flex items-center gap-1 overflow-x-auto scrollbar-hide"
					role="toolbar"
				>
					{locationInput}
					<div
						className="h-4 w-px bg-border shrink-0 mx-1"
						aria-hidden="true"
					/>
					{FILTERS.map((filter) => {
						const isActive = activeFilter === filter;
						const count = counts?.[filter];

						if (!isActive && count === 0) return null;

						return (
							<button
								key={filter}
								type="button"
								onClick={() => onFilterChange(filter)}
								aria-pressed={isActive}
								className={
									isActive
										? "shrink-0 inline-flex items-center gap-1.5 rounded-full border border-primary bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors"
										: "shrink-0 inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 active:bg-muted transition-colors"
								}
							>
								{filterLabels[filter]}
								{count !== undefined && count > 0 && (
									<span className="font-normal tabular-nums opacity-50">
										{approximateCount(count)}
									</span>
								)}
							</button>
						);
					})}
					{distanceChips}
				</div>
			</div>
		</nav>
	);
}
