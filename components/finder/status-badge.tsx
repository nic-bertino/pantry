"use client";

import { Badge } from "@/components/ui/badge";
import { useTranslations } from "@/lib/i18n/use-translations";
import { formatTime } from "@/lib/schedule/parser";
import type { AvailabilityStatus } from "@/lib/types/location";

interface StatusBadgeProps {
	availability: AvailabilityStatus;
	variant?: "badge" | "text";
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
			const label = t("opensIn", { minutes: availability.minutesUntil });
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
				const isToday =
					availability.opensAt.toDateString() === new Date().toDateString();
				const isTomorrow =
					availability.opensAt.toDateString() ===
					new Date(Date.now() + 86400000).toDateString();

				let timeLabel: string;
				if (isToday) {
					timeLabel = formatTime({
						hour: availability.opensAt.getHours(),
						minute: availability.opensAt.getMinutes(),
					});
				} else if (isTomorrow) {
					timeLabel = `${t("tomorrow")} ${formatTime({
						hour: availability.opensAt.getHours(),
						minute: availability.opensAt.getMinutes(),
					})}`;
				} else {
					const dayName = availability.opensAt.toLocaleDateString("en-US", {
						weekday: "short",
					});
					timeLabel = `${dayName} ${formatTime({
						hour: availability.opensAt.getHours(),
						minute: availability.opensAt.getMinutes(),
					})}`;
				}

				const label = t("opensAt", { time: timeLabel });
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
