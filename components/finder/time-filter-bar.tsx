"use client";

import { Button } from "@/components/ui/button";
import { approximateCount } from "@/lib/format/count";
import { useTranslations } from "@/lib/i18n/use-translations";
import type { TimeFilter } from "@/lib/types/location";

interface TimeFilterBarProps {
	activeFilter: TimeFilter;
	onFilterChange: (filter: TimeFilter) => void;
	counts?: Record<TimeFilter, number>;
	locationInput?: React.ReactNode;
}

const FILTERS: TimeFilter[] = ["open-now", "today", "tomorrow", "this-week"];

export function TimeFilterBar({
	activeFilter,
	onFilterChange,
	counts,
	locationInput,
}: TimeFilterBarProps) {
	const { t } = useTranslations();

	const filterLabels: Record<TimeFilter, string> = {
		"open-now": t("filterOpenNow"),
		today: t("filterToday"),
		tomorrow: t("filterTomorrow"),
		"this-week": t("filterThisWeek"),
	};

	return (
		<div className="border-b border-border">
			<div className="container mx-auto px-4 py-3">
				<div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
					{locationInput}
					<div className="h-4 w-px bg-border shrink-0" />
					{FILTERS.map((filter) => {
						const isActive = activeFilter === filter;
						const count = counts?.[filter];

						return (
							<Button
								key={filter}
								variant={isActive ? "default" : "outline"}
								size="sm"
								onClick={() => onFilterChange(filter)}
								className="shrink-0"
							>
								{filterLabels[filter]}
								{count !== undefined && (
									<span className="ml-1.5 text-xs opacity-70">{approximateCount(count)}</span>
								)}
							</Button>
						);
					})}
				</div>
			</div>
		</div>
	);
}
