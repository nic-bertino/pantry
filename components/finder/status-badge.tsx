"use client";

import { Badge } from "@/components/ui/badge";
import { useTranslations } from "@/lib/i18n/use-translations";
import { formatTime } from "@/lib/schedule/parser";
import type { AvailabilityStatus } from "@/lib/types/location";

interface StatusBadgeProps {
	availability: AvailabilityStatus;
}

export function StatusBadge({ availability }: StatusBadgeProps) {
	const { t } = useTranslations();

	switch (availability.status) {
		case "open": {
			const closeTime = formatTime({
				hour: availability.closesAt.getHours(),
				minute: availability.closesAt.getMinutes(),
			});
			return (
				<Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20">
					{t("openUntil", { time: closeTime })}
				</Badge>
			);
		}

		case "opening-soon": {
			return (
				<Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20">
					{t("opensIn", { minutes: availability.minutesUntil })}
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

				return (
					<Badge variant="secondary">{t("opensAt", { time: timeLabel })}</Badge>
				);
			}
			return <Badge variant="secondary">{t("statusClosed")}</Badge>;
		}

		case "unknown":
			return <Badge variant="outline">{t("statusUnknown")}</Badge>;

		default:
			return null;
	}
}
