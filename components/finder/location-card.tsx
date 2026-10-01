"use client";

import { memo } from "react";
import { ChevronRightIcon } from "lucide-react";
import { describeSession, type SessionLabel } from "@/lib/format/session";
import { useTranslations } from "@/lib/i18n/use-translations";
import type { DisplayLocation } from "@/lib/types/location";
import { RequirementTag } from "./requirement-tag";
import { SessionStatus } from "./session-status";

interface LocationCardProps {
	location: DisplayLocation;
	now: Date;
	/**
	 * `compact` omits the day because the card sits under a day heading;
	 * `full` names it, for cards shown outside a grouped list.
	 */
	statusMode?: "compact" | "full";
	/** Card sits under an "Open now" heading, so the status can drop "Open" */
	underOpenHeading?: boolean;
	onClick?: () => void;
}

export const LocationCard = memo(function LocationCard({
	location,
	now,
	statusMode = "compact",
	underOpenHeading = false,
	onClick,
}: LocationCardProps) {
	const { t, tBilingual, locale } = useTranslations();

	const name = tBilingual(location.name);
	const eligibility = tBilingual(location.eligibility);
	const label: SessionLabel = location.session
		? describeSession(location.session, now, location.timezone, {
				t,
				locale,
				mode: statusMode,
				underOpenHeading,
			})
		: { tone: "later", text: t("callForHours") };

	// The heading holds the only interactive element; its ::after stretches
	// over the card so the whole surface is clickable without nesting block
	// content inside a <button>.
	return (
		<article className="relative flex items-start gap-3 rounded-lg bg-card p-4 transition-colors hover:bg-muted has-[button:active]:bg-muted has-[button:focus-visible]:ring-2 has-[button:focus-visible]:ring-ring sm:py-3">
			<div className="min-w-0 flex-1">
				<h3 className="font-medium leading-snug">
					<button
						type="button"
						onClick={onClick}
						className="line-clamp-2 text-left outline-none after:absolute after:inset-0 after:rounded-lg"
					>
						{name}
					</button>
				</h3>
				<p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm">
					<SessionStatus label={label} />
					<span className="text-muted-foreground">
						{location.city}
						{location.distance !== undefined &&
							` · ${t("milesAway", { miles: location.distance.toFixed(1) })}`}
					</span>
				</p>
				{eligibility && (
					<p className="mt-2 flex">
						<RequirementTag text={eligibility} />
					</p>
				)}
			</div>
			<ChevronRightIcon
				aria-hidden="true"
				className="mt-1 h-4 w-4 shrink-0 text-muted-foreground"
			/>
		</article>
	);
});
