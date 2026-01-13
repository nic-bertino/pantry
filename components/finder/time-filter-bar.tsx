"use client";

import { Button } from "@/components/ui/button";
import { useTranslations } from "@/lib/i18n/use-translations";
import type { TimeFilter } from "@/lib/types/location";

interface TimeFilterBarProps {
	activeFilter: TimeFilter;
	onFilterChange: (filter: TimeFilter) => void;
	counts?: Record<TimeFilter, number>;
	secondaryFilters?: React.ReactNode;
	locationInput?: React.ReactNode;
}

const FILTERS: TimeFilter[] = ["open-now", "today", "tomorrow", "this-week"];

export function TimeFilterBar({
	activeFilter,
	onFilterChange,
	counts,
	secondaryFilters,
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
		<div className="sticky top-[73px] z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<div className="container mx-auto px-4 py-2">
				<div className="flex items-center gap-3">
					{/* Primary time filters */}
					<div className="flex gap-2 overflow-x-auto scrollbar-hide">
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
										<span className="ml-1.5 text-xs opacity-70">{count}</span>
									)}
								</Button>
							);
						})}
					</div>

					{/* Separator and secondary filters */}
					{secondaryFilters && (
						<>
							<div className="h-5 w-px bg-border shrink-0" />
							{secondaryFilters}
						</>
					)}

					{/* Spacer to push location to right */}
					<div className="flex-1" />

					{/* Location input */}
					{locationInput}
				</div>
			</div>
		</div>
	);
}
