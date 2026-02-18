"use client";

import { useEffect, useState } from "react";
import { GlobeIcon, MapPinIcon, PhoneIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { useTranslations } from "@/lib/i18n/use-translations";
import type { DisplayLocation } from "@/lib/types/location";
import { StatusBadge } from "./status-badge";

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
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function LocationDetailSheet({
	location,
	open,
	onOpenChange,
}: LocationDetailSheetProps) {
	const { t, tBilingual } = useTranslations();
	const isMobile = useIsMobile();

	if (!location) return null;

	const name = tBilingual(location.name);
	const description = tBilingual(location.description);
	const eligibility = tBilingual(location.eligibility);
	const scheduleText = tBilingual(location.rawScheduleText);

	const fullAddress = `${location.address}, ${location.city}, ${location.state} ${location.postcode}`;
	const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(fullAddress)}`;
	const phoneUrl = location.phone
		? `tel:${location.phone.replace(/[^0-9+]/g, "")}`
		: null;

	const detailBody = (
		<div className="space-y-4">
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

			{/* Eligibility warning */}
			{eligibility && (
				<p className="text-amber-600 dark:text-amber-400">{eligibility}</p>
			)}

			{/* Description */}
			{description && (
				<p className="text-foreground/70">{description}</p>
			)}

			{/* Schedule & Address */}
			<div className="text-muted-foreground">
				{scheduleText && <p>{scheduleText}</p>}
				<p>{fullAddress}</p>
			</div>
		</div>
	);

	return (
		<>
			{/* Mobile: bottom sheet */}
			<Sheet open={open && isMobile} onOpenChange={onOpenChange}>
				<SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
					<SheetHeader className="text-left">
						<SheetTitle className="text-xl font-semibold leading-tight pr-8">
							{name}
						</SheetTitle>
						<SheetDescription>
							<StatusBadge
								availability={location.availability}
								timezone={location.timezone}
								variant="text"
							/>
						</SheetDescription>
					</SheetHeader>
					<div className="px-6 pb-6">{detailBody}</div>
				</SheetContent>
			</Sheet>

			{/* Desktop: centered dialog */}
			<Dialog open={open && !isMobile} onOpenChange={onOpenChange}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle className="text-xl font-semibold leading-tight pr-8">
							{name}
						</DialogTitle>
						<DialogDescription>
							<StatusBadge
								availability={location.availability}
								timezone={location.timezone}
								variant="text"
							/>
						</DialogDescription>
					</DialogHeader>
					{detailBody}
				</DialogContent>
			</Dialog>
		</>
	);
}
