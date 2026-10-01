"use client";

import { Fragment, useEffect, useState } from "react";
import { GlobeIcon, InfoIcon, MapPinIcon, PhoneIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Drawer,
	DrawerContent,
	DrawerDescription,
	DrawerHeader,
	DrawerTitle,
} from "@/components/ui/drawer";
import { parseHoursText } from "@/lib/format/hours";
import { describeSession, type SessionLabel } from "@/lib/format/session";
import { useTranslations } from "@/lib/i18n/use-translations";
import { getNextSession, getTimeInTimezone } from "@/lib/schedule/calculator";
import type { DisplayLocation } from "@/lib/types/location";
import { cn } from "@/lib/utils";
import { SessionStatus } from "./session-status";

function useIsMobile(breakpoint = 640) {
	const [isMobile, setIsMobile] = useState(true);

	useEffect(() => {
		const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
		setIsMobile(mql.matches);
		const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
		mql.addEventListener("change", handler);
		return () => mql.removeEventListener("change", handler);
	}, [breakpoint]);

	return isMobile;
}

interface LocationDetailSheetProps {
	location: DisplayLocation | null;
	now: Date;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function LocationDetailSheet({
	location,
	now,
	open,
	onOpenChange,
}: LocationDetailSheetProps) {
	const { t, tBilingual, locale } = useTranslations();
	const isMobile = useIsMobile();

	if (!location) return null;

	const name = tBilingual(location.name);
	const description = tBilingual(location.description);
	const eligibility = tBilingual(location.eligibility);
	const scheduleText = tBilingual(location.rawScheduleText);
	const hoursRows = parseHoursText(scheduleText, locale);
	const today = getTimeInTimezone(now, location.timezone).dayOfWeek;

	// The real next session, independent of which filter the list was showing
	const session = getNextSession(location.schedule, now, location.timezone, {
		fromDay: 0,
		toDay: 7,
	});
	const statusLabel: SessionLabel = session
		? describeSession(session, now, location.timezone, { t, locale, mode: "full" })
		: {
				tone: "later",
				text:
					location.schedule.type === "unknown"
						? t("callForHours")
						: t("statusClosed"),
			};
	const status = <SessionStatus label={statusLabel} className="text-sm" />;

	const fullAddress = `${location.address}, ${location.city}, ${location.state} ${location.postcode}`;
	const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(fullAddress)}`;
	const phoneUrl = location.phone
		? `tel:${location.phone.replace(/[^0-9+]/g, "")}`
		: null;

	const detailBody = (
		<div className="space-y-5">
			<div className="space-y-3">
				{/* Primary action */}
				<Button asChild className="w-full">
					<a href={mapsUrl} target="_blank" rel="noopener noreferrer">
						<MapPinIcon className="mr-2 h-4 w-4" />
						{t("directions")}
					</a>
				</Button>

				{/* Secondary actions */}
				{(phoneUrl || location.website) && (
					<div className="flex gap-3">
						{phoneUrl && (
							<Button variant="outline" asChild className="flex-1">
								<a href={phoneUrl}>
									<PhoneIcon className="mr-2 h-4 w-4" />
									{location.phone}
								</a>
							</Button>
						)}
						{location.website && (
							<Button variant="outline" asChild className="flex-1">
								<a
									href={location.website}
									target="_blank"
									rel="noopener noreferrer"
								>
									<GlobeIcon className="mr-2 h-4 w-4" />
									{t("website")}
								</a>
							</Button>
						)}
					</div>
				)}
			</div>

			{/* Eligibility */}
			{eligibility && (
				<section className="flex gap-3 rounded-lg bg-caution/15 p-3 text-caution-foreground">
					<InfoIcon aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
					<div>
						<h3 className="font-semibold">{t("beforeYouGo")}</h3>
						<p className="mt-0.5">{eligibility}</p>
					</div>
				</section>
			)}

			{/* Hours */}
			{scheduleText && (
				<section>
					<h3 className="mb-1.5 font-semibold text-foreground">{t("hours")}</h3>
					{hoursRows ? (
						<dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-muted-foreground">
							{hoursRows.map((row) => {
								const isToday = row.days.includes(today);
								return (
									<Fragment key={row.label}>
										<dt className={cn(isToday && "font-medium text-foreground")}>
											{row.label}
										</dt>
										<dd className={cn("flex flex-wrap items-baseline gap-x-2", isToday && "font-medium text-foreground")}>
											{row.hours}
											{isToday && (
												<span className="rounded-full bg-primary/10 px-1.5 text-xs font-medium text-brand-green">
													{t("today")}
												</span>
											)}
										</dd>
									</Fragment>
								);
							})}
						</dl>
					) : (
						<p className="text-muted-foreground">{scheduleText}</p>
					)}
				</section>
			)}

			{/* Description */}
			{description && <p className="text-foreground/70">{description}</p>}

			{/* Address */}
			<p className="text-muted-foreground">{fullAddress}</p>
		</div>
	);

	return (
		<>
			{/* Mobile: swipeable drawer */}
			<Drawer open={open && isMobile} onOpenChange={onOpenChange}>
				<DrawerContent>
					<DrawerHeader className="text-left">
						<DrawerTitle className="text-xl font-semibold leading-tight pr-8">
							{name}
						</DrawerTitle>
						<DrawerDescription>{status}</DrawerDescription>
					</DrawerHeader>
					<div className="px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
						{detailBody}
					</div>
				</DrawerContent>
			</Drawer>

			{/* Desktop: centered dialog */}
			<Dialog open={open && !isMobile} onOpenChange={onOpenChange}>
				<DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
					<DialogHeader>
						<DialogTitle className="text-xl font-semibold leading-tight pr-8">
							{name}
						</DialogTitle>
						<DialogDescription>{status}</DialogDescription>
					</DialogHeader>
					{detailBody}
				</DialogContent>
			</Dialog>
		</>
	);
}
