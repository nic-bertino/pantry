"use client";

import { Badge } from "@/components/ui/badge";
import { useTranslations } from "@/lib/i18n/use-translations";
import { formatTimeWithTimezone } from "@/lib/schedule/parser";
import { getTimeInTimezone } from "@/lib/schedule/calculator";
import type { AvailabilityStatus } from "@/lib/types/location";

interface StatusBadgeProps {
	availability: AvailabilityStatus;
	timezone: string;
	variant?: "badge" | "text";
}

/**
 * Format relative time (e.g., "in 45m", "in 3h")
 */
function formatRelativeTime(minutes: number): string {
	if (minutes < 60) return `in ${minutes}m`;
	const hours = Math.floor(minutes / 60);
	return `in ${hours}h`;
}

export function StatusBadge({
	availability,
	timezone,
	variant = "badge",
}: StatusBadgeProps) {
	const { t } = useTranslations();

	// Text color classes for plain text variant
	const textColors = {
		open: "text-brand-green",
		"opening-soon": "text-brand-green",
		closed: "text-muted-foreground",
		unknown: "text-muted-foreground",
	};

	switch (availability.status) {
		case "open": {
			// Get closing time in the location's timezone
			const localClose = getTimeInTimezone(availability.closesAt, timezone);
			const closeTime = formatTimeWithTimezone(
				{ hour: localClose.hour, minute: localClose.minute },
				timezone,
			);
			const label = t("openUntil", { time: closeTime });
			return variant === "text" ? (
				<span className={`text-sm ${textColors.open}`}>{label}</span>
			) : (
				<Badge className="bg-primary/15 text-primary border-primary/20">
					{label}
				</Badge>
			);
		}

		case "opening-soon": {
			// Opening soon always uses relative time
			const label = `${t("opens")} ${formatRelativeTime(availability.minutesUntil)}`;
			return variant === "text" ? (
				<span className={`text-sm ${textColors["opening-soon"]}`}>{label}</span>
			) : (
				<Badge className="bg-primary/15 text-primary border-primary/20">
					{label}
				</Badge>
			);
		}

		case "closed": {
			if (availability.opensAt) {
				const now = new Date();
				const opensAt = availability.opensAt;
				const minutesUntil = Math.floor(
					(opensAt.getTime() - now.getTime()) / (1000 * 60),
				);

				// Get times in the location's timezone for comparison
				const nowLocal = getTimeInTimezone(now, timezone);
				const opensLocal = getTimeInTimezone(opensAt, timezone);

				let timeLabel: string;

				// Use relative time if same calendar day in the location's timezone
				const isSameDayInTz =
					nowLocal.year === opensLocal.year &&
					nowLocal.month === opensLocal.month &&
					nowLocal.dayOfMonth === opensLocal.dayOfMonth;

				if (isSameDayInTz) {
					// Same day: use relative time (e.g., "Opens in 3h")
					timeLabel = formatRelativeTime(minutesUntil);
				} else {
					// Different day: use absolute time with day context
					const tomorrow = new Date(now.getTime() + 86400000);
					const tomorrowLocal = getTimeInTimezone(tomorrow, timezone);
					const isTomorrowInTz =
						tomorrowLocal.year === opensLocal.year &&
						tomorrowLocal.month === opensLocal.month &&
						tomorrowLocal.dayOfMonth === opensLocal.dayOfMonth;

					const time = formatTimeWithTimezone(
						{ hour: opensLocal.hour, minute: opensLocal.minute },
						timezone,
					);

					if (isTomorrowInTz) {
						timeLabel = `${t("tomorrow")} ${time}`;
					} else {
						// Get weekday name in the location's timezone
						const dayFormatter = new Intl.DateTimeFormat("en-US", {
							timeZone: timezone,
							weekday: "short",
						});
						const dayName = dayFormatter.format(opensAt);
						timeLabel = `${dayName} ${time}`;
					}
				}

				const label = `${t("opens")} ${timeLabel}`;
				return variant === "text" ? (
					<span className={`text-sm ${textColors.closed}`}>{label}</span>
				) : (
					<Badge variant="secondary">{label}</Badge>
				);
			}
			return variant === "text" ? (
				<span className={`text-sm ${textColors.closed}`}>
					{t("statusClosed")}
				</span>
			) : (
				<Badge variant="secondary">{t("statusClosed")}</Badge>
			);
		}

		case "unknown":
			return variant === "text" ? (
				<span className={`text-sm ${textColors.unknown}`}>
					{t("statusUnknown")}
				</span>
			) : (
				<Badge variant="outline">{t("statusUnknown")}</Badge>
			);

		default:
			return null;
	}
}
