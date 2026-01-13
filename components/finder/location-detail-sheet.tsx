"use client";

import { GlobeIcon, MapPinIcon, PhoneIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
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

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
				<SheetHeader className="text-left">
					<div className="flex items-start justify-between gap-4 pr-8">
						<SheetTitle className="text-xl font-semibold leading-tight">
							{name}
						</SheetTitle>
						<StatusBadge availability={location.availability} />
					</div>
					<SheetDescription className="text-base text-muted-foreground">
						{location.city}
						{location.distance !== undefined && (
							<span>
								{" "}
								· {t("milesAway", { miles: location.distance.toFixed(1) })}
							</span>
						)}
					</SheetDescription>
				</SheetHeader>

				<div className="px-6 pb-6 space-y-4">
					{/* Eligibility warning */}
					{eligibility && (
						<p className="text-amber-600 dark:text-amber-400">{eligibility}</p>
					)}

					{/* Description */}
					{description && (
						<p className="text-muted-foreground">{description}</p>
					)}

					{/* Schedule */}
					{scheduleText && (
						<div>
							<h4 className="font-medium mb-1">{t("schedule")}</h4>
							<p className="text-muted-foreground">{scheduleText}</p>
						</div>
					)}

					{/* Address */}
					<div>
						<p className="text-muted-foreground">{fullAddress}</p>
					</div>

					{/* Actions */}
					<div className="flex gap-3 pt-2">
						<Button asChild className="flex-1">
							<a href={mapsUrl} target="_blank" rel="noopener noreferrer">
								<MapPinIcon className="mr-2 h-4 w-4" />
								{t("directions")}
							</a>
						</Button>
						{phoneUrl && (
							<Button variant="outline" asChild className="flex-1">
								<a href={phoneUrl}>
									<PhoneIcon className="mr-2 h-4 w-4" />
									{t("call")}
								</a>
							</Button>
						)}
					</div>

					{/* Website if available */}
					{location.website && (
						<Button variant="ghost" asChild className="w-full">
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
			</SheetContent>
		</Sheet>
	);
}
