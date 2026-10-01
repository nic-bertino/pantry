"use client";

import { useEffect, useRef, useState } from "react";
import { approximateCount } from "@/lib/format/count";
import { useTranslations } from "@/lib/i18n/use-translations";
import type { TimeFilter } from "@/lib/types/location";
import { cn } from "@/lib/utils";

/** Shared pill style for every filter chip in the bar */
export function chipClassName(isActive: boolean): string {
	return cn(
		"h-10 shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3.5 text-sm transition-colors",
		isActive
			? "border-primary bg-primary font-medium text-primary-foreground"
			: "border-border text-muted-foreground hover:text-foreground hover:bg-muted/50 active:bg-muted",
	);
}

interface TimeFilterBarProps {
	activeFilter: TimeFilter;
	onFilterChange: (filter: TimeFilter) => void;
	counts?: Record<TimeFilter, number>;
}

const FILTERS: TimeFilter[] = ["open-now", "today", "tomorrow", "this-week"];

/** Width of the fade that hints more chips are scrolled out of view */
const FADE = "1.5rem";

export function TimeFilterBar({
	activeFilter,
	onFilterChange,
	counts,
}: TimeFilterBarProps) {
	const { t, locale } = useTranslations();
	const scrollerRef = useRef<HTMLDivElement>(null);
	const [overflow, setOverflow] = useState({ start: false, end: false });

	const filterLabels: Record<TimeFilter, string> = {
		"open-now": t("filterOpenNow"),
		today: t("filterToday"),
		tomorrow: t("filterTomorrow"),
		"this-week": t("filterThisWeek"),
	};

	// Track whether chips are hidden off either edge
	// biome-ignore lint/correctness/useExhaustiveDependencies: counts change chip widths
	useEffect(() => {
		const el = scrollerRef.current;
		if (!el) return;

		// Return the previous object when nothing changed so scrolling doesn't re-render
		const update = () => {
			const start = el.scrollLeft > 1;
			const end = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
			setOverflow((prev) =>
				prev.start === start && prev.end === end ? prev : { start, end },
			);
		};

		update();
		el.addEventListener("scroll", update, { passive: true });
		const observer = new ResizeObserver(update);
		observer.observe(el);
		return () => {
			el.removeEventListener("scroll", update);
			observer.disconnect();
		};
	}, [counts, locale]);

	// Keep the active chip visible so the current filter is never off-screen
	// biome-ignore lint/correctness/useExhaustiveDependencies: re-run when the active chip or its width changes
	useEffect(() => {
		const el = scrollerRef.current;
		const chip = el?.querySelector<HTMLElement>('[aria-pressed="true"]');
		if (!el || !chip) return;

		const start = chip.offsetLeft;
		const end = start + chip.offsetWidth;
		if (start >= el.scrollLeft && end <= el.scrollLeft + el.clientWidth) return;

		const reduceMotion = window.matchMedia(
			"(prefers-reduced-motion: reduce)",
		).matches;
		el.scrollTo({
			left: end > el.scrollLeft + el.clientWidth ? end - el.clientWidth + 24 : start - 24,
			behavior: reduceMotion ? "auto" : "smooth",
		});
	}, [activeFilter, counts]);

	const maskImage = `linear-gradient(to right, ${overflow.start ? "transparent" : "black"}, black ${FADE}, black calc(100% - ${FADE}), ${overflow.end ? "transparent" : "black"})`;

	return (
		<nav
			aria-label={locale === "es" ? "Filtros" : "Filters"}
			className="border-b border-border"
		>
			<div className="container mx-auto flex max-w-3xl items-center px-4 py-2">
				<div
					ref={scrollerRef}
					className="scrollbar-hide relative flex min-w-0 flex-1 items-center gap-1 overflow-x-auto"
					style={{ maskImage, WebkitMaskImage: maskImage }}
				>
					{FILTERS.map((filter) => {
						const isActive = activeFilter === filter;
						const count = counts?.[filter];
						// Always shown so the set of filters never shifts; an empty
						// one gets a lighter border, but its text keeps AA contrast
						const isEmpty = !isActive && count === 0;

						return (
							<button
								key={filter}
								type="button"
								onClick={() => onFilterChange(filter)}
								aria-pressed={isActive}
								className={cn(chipClassName(isActive), isEmpty && "border-border/60")}
							>
								{filterLabels[filter]}
								{count !== undefined && (
									<span className="font-normal tabular-nums">
										{approximateCount(count)}
									</span>
								)}
							</button>
						);
					})}
				</div>
			</div>
		</nav>
	);
}
