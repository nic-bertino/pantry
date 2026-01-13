"use client";

import { useMemo } from "react";
import { ClockIcon, MapPinIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/lib/i18n/use-translations";
import type { DisplayLocation, TimeFilter } from "@/lib/types/location";

interface NextAvailableTimelineProps {
	locations: DisplayLocation[];
	onLocationClick?: (location: DisplayLocation) => void;
	limit?: number;
	currentFilter?: TimeFilter;
}

interface UpcomingOpening {
	location: DisplayLocation;
	opensAt: Date;
	minutesUntil: number;
}

/**
 * Format time relative to now
 */
function formatRelativeTime(minutes: number): { key: "statusOpen" | "inMinutes" | "inHours"; vars?: Record<string, number> } {
	if (minutes <= 0) return { key: "statusOpen" };
	if (minutes < 60) return { key: "inMinutes", vars: { minutes } };
	const hours = Math.floor(minutes / 60);
	return { key: "inHours", vars: { hours } };
}

/**
 * Format absolute time (e.g., "2:30 PM")
 */
function formatTime(date: Date): string {
	return date.toLocaleTimeString("en-US", {
		hour: "numeric",
		minute: "2-digit",
		hour12: true,
	});
}

export function NextAvailableTimeline({
	locations,
	onLocationClick,
	limit = 5,
	currentFilter = "open-now",
}: NextAvailableTimelineProps) {
	const { t, tBilingual } = useTranslations();

	// Don't show when "Open Now" is active - the list already answers this question
	if (currentFilter === "open-now") {
		return null;
	}

	const upcomingOpenings = useMemo(() => {
		const now = new Date();
		const openings: UpcomingOpening[] = [];

		for (const location of locations) {
			const { availability } = location;

			// Currently open locations
			if (availability.status === "open") {
				openings.push({
					location,
					opensAt: now,
					minutesUntil: 0,
				});
			}
			// Opening soon
			else if (availability.status === "opening-soon") {
				openings.push({
					location,
					opensAt: availability.opensAt,
					minutesUntil: availability.minutesUntil,
				});
			}
			// Closed but has next opening
			else if (availability.status === "closed" && availability.opensAt) {
				const minutesUntil = Math.floor(
					(availability.opensAt.getTime() - now.getTime()) / (1000 * 60),
				);
				// Only show if opening within next 24 hours
				if (minutesUntil > 0 && minutesUntil <= 24 * 60) {
					openings.push({
						location,
						opensAt: availability.opensAt,
						minutesUntil,
					});
				}
			}
		}

		// Sort by time (open now first, then by minutes until open)
		return openings
			.sort((a, b) => a.minutesUntil - b.minutesUntil)
			.slice(0, limit);
	}, [locations, limit]);

	if (upcomingOpenings.length === 0) {
		return null;
	}

	return (
		<div className="space-y-2">
			<h3 className="text-sm font-medium text-muted-foreground">
				{t("nextAvailable")}
			</h3>
			<div className="space-y-1.5">
				{upcomingOpenings.map(({ location, opensAt, minutesUntil }) => {
					const isOpen = minutesUntil === 0;
					const isOpeningSoon = minutesUntil > 0 && minutesUntil <= 30;

					return (
						<button
							key={location.id}
							type="button"
							onClick={() => onLocationClick?.(location)}
							className={cn(
								"w-full flex items-center gap-3 p-2 rounded-lg border transition-colors text-left",
								isOpen
									? "border-green-500/50 bg-green-500/5 hover:bg-green-500/10"
									: isOpeningSoon
										? "border-yellow-500/50 bg-yellow-500/5 hover:bg-yellow-500/10"
										: "border-border bg-card hover:bg-muted/50",
							)}
						>
							{/* Time indicator */}
							<div
								className={cn(
									"shrink-0 flex flex-col items-center justify-center w-12 h-10 rounded-md text-xs font-medium",
									isOpen
										? "bg-green-500/20 text-green-700 dark:text-green-400"
										: isOpeningSoon
											? "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400"
											: "bg-muted text-muted-foreground",
								)}
							>
								{isOpen ? (
									<span className="text-[10px] uppercase">{t("statusOpen")}</span>
								) : (
									<>
										<span>{formatTime(opensAt)}</span>
									</>
								)}
							</div>

							{/* Location info */}
							<div className="flex-1 min-w-0">
								<p className="font-medium text-sm truncate">
									{tBilingual(location.name)}
								</p>
								<div className="flex items-center gap-2 text-xs text-muted-foreground">
									<span>{location.city}</span>
									{location.distance !== undefined && (
										<>
											<span>·</span>
											<span className="flex items-center gap-0.5">
												<MapPinIcon className="h-3 w-3" />
												{location.distance.toFixed(1)} mi
											</span>
										</>
									)}
								</div>
							</div>

							{/* Relative time badge */}
							{!isOpen && (
								<div className="shrink-0">
									<span
										className={cn(
											"inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs",
											isOpeningSoon
												? "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400"
												: "bg-muted text-muted-foreground",
										)}
									>
										<ClockIcon className="h-3 w-3" />
										{(() => {
											const { key, vars } = formatRelativeTime(minutesUntil);
											return t(key, vars);
										})()}
									</span>
								</div>
							)}
						</button>
					);
				})}
			</div>
		</div>
	);
}
