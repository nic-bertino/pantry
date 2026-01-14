"use client";

import { Badge } from "@/components/ui/badge";
import { useTranslations } from "@/lib/i18n/use-translations";
import { formatTime } from "@/lib/schedule/parser";
import type { AvailabilityStatus } from "@/lib/types/location";

interface StatusBadgeProps {
	availability: AvailabilityStatus;
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

/**
 * Check if a date is on the same calendar day as now
 */
function isSameDay(date: Date, now: Date): boolean {
	return date.toDateString() === now.toDateString();
}

export function StatusBadge({
	availability,
	variant = "badge",
}: StatusBadgeProps) {
	const { t } = useTranslations();

	// Text color classes for plain text variant
	const textColors = {
		open: "text-emerald-600 dark:text-emerald-400",
		"opening-soon": "text-amber-600 dark:text-amber-400",
		closed: "text-muted-foreground",
		unknown: "text-muted-foreground",
	};

	switch (availability.status) {
		case "open": {
			const closeTime = formatTime({
				hour: availability.closesAt.getHours(),
				minute: availability.closesAt.getMinutes(),
			});
			const label = t("openUntil", { time: closeTime });
			return variant === "text" ? (
				<span className={`text-sm ${textColors.open}`}>{label}</span>
			) : (
				<Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20">
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
				<Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20">
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

				let timeLabel: string;

				// Use relative time if same calendar day, otherwise use absolute with day context
				if (isSameDay(opensAt, now)) {
					// Same day: use relative time (e.g., "Opens in 3h")
					timeLabel = formatRelativeTime(minutesUntil);
				} else {
					// Different day: use absolute time with day context
					const isTomorrow =
						opensAt.toDateString() ===
						new Date(Date.now() + 86400000).toDateString();

					const time = formatTime({
						hour: opensAt.getHours(),
						minute: opensAt.getMinutes(),
					});

					if (isTomorrow) {
						timeLabel = `${t("tomorrow")} ${time}`;
					} else {
						const dayName = opensAt.toLocaleDateString("en-US", {
							weekday: "short",
						});
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
