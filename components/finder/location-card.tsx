"use client";

import { useTranslations } from "@/lib/i18n/use-translations";
import type { DisplayLocation } from "@/lib/types/location";
import { StatusBadge } from "./status-badge";

interface LocationCardProps {
	location: DisplayLocation;
	onClick?: () => void;
}

export function LocationCard({ location, onClick }: LocationCardProps) {
	const { t, tBilingual } = useTranslations();

	const name = tBilingual(location.name);

	// Check if location has requirements
	const hasRequirements = location.eligibility !== null;

	return (
		<article className="group">
			{/* Desktop: Clean row layout */}
			<button
				type="button"
				className="hidden w-full text-left sm:block sm:py-3 sm:cursor-pointer sm:rounded-lg sm:-mx-2 sm:px-2 hover:bg-muted/50 transition-colors"
				onClick={onClick}
			>
				<h3 className="font-medium truncate">{name}</h3>
				<p className="text-sm text-muted-foreground">
					{hasRequirements && (
						<span className="text-amber-500 mr-1.5">●</span>
					)}
					{location.city}
					{location.distance !== undefined && (
						<span>
							{" "}
							· {t("milesAway", { miles: location.distance.toFixed(1) })}
						</span>
					)}
					<span className="ml-2">
						<StatusBadge availability={location.availability} variant="text" />
					</span>
				</p>
			</button>

			{/* Mobile: Card layout */}
			<button
				type="button"
				className="sm:hidden w-full text-left rounded-lg border border-border bg-card p-4 active:bg-muted/50 transition-colors"
				onClick={onClick}
			>
				<h3 className="font-medium leading-tight">{name}</h3>
				<p className="mt-0.5 text-sm text-muted-foreground">
					{hasRequirements && (
						<span className="text-amber-500 mr-1.5">●</span>
					)}
					{location.city}
					{location.distance !== undefined && (
						<span>
							{" "}
							· {t("milesAway", { miles: location.distance.toFixed(1) })}
						</span>
					)}
					<span className="ml-2">
						<StatusBadge availability={location.availability} variant="text" />
					</span>
				</p>
			</button>
		</article>
	);
}
