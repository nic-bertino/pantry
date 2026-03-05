"use client";

import { memo } from "react";
import { ChevronRightIcon } from "lucide-react";
import { useTranslations } from "@/lib/i18n/use-translations";
import type { DisplayLocation } from "@/lib/types/location";
import { StatusBadge } from "./status-badge";

interface LocationCardProps {
	location: DisplayLocation;
	onClick?: () => void;
}

export const LocationCard = memo(function LocationCard({ location, onClick }: LocationCardProps) {
	const { t, tBilingual } = useTranslations();

	const name = tBilingual(location.name);

	// Check if location has requirements
	const hasRequirements = location.eligibility !== null;

	return (
		<article className="group">
			{/* Desktop: Row — name/city left, status + chevron right */}
			<button
				type="button"
				className="hidden w-full text-left sm:flex sm:items-center sm:gap-4 sm:py-3 sm:px-2 sm:cursor-pointer sm:rounded-lg hover:bg-muted transition-colors"
				onClick={onClick}
			>
				<div className="min-w-0 flex-1">
					<h3 className="font-medium truncate">{name}</h3>
					<p className="text-sm text-muted-foreground">
						{hasRequirements && (
							<span className="text-caution-foreground mr-1.5" title={t("hasRequirements")}>●</span>
						)}
						{location.city}
						{location.distance !== undefined && (
							<span>
								{" "}
								· {t("milesAway", { miles: location.distance.toFixed(1) })}
							</span>
						)}
					</p>
				</div>
				<span className="shrink-0 flex items-center gap-1.5 text-muted-foreground">
					<StatusBadge
						availability={location.availability}
						timezone={location.timezone}
						variant="text"
					/>
					<ChevronRightIcon className="h-4 w-4" />
				</span>
			</button>

			{/* Mobile: Card layout */}
			<button
				type="button"
				className="sm:hidden w-full text-left rounded-lg border border-border bg-card p-4 hover:bg-muted active:bg-muted transition-colors"
				onClick={onClick}
			>
				<div className="flex items-baseline justify-between gap-3">
					<h3 className="font-medium leading-tight truncate">{name}</h3>
					<ChevronRightIcon className="h-4 w-4 shrink-0 text-muted-foreground translate-y-0.5" />
				</div>
				<p className="mt-0.5 text-sm text-muted-foreground">
					{hasRequirements && (
						<span className="text-caution-foreground mr-1.5" title={t("hasRequirements")}>●</span>
					)}
					{location.city}
					{location.distance !== undefined && (
						<span>
							{" "}
							· {t("milesAway", { miles: location.distance.toFixed(1) })}
						</span>
					)}
					<span className="ml-2">
						<StatusBadge
							availability={location.availability}
							timezone={location.timezone}
							variant="text"
						/>
					</span>
				</p>
			</button>
		</article>
	);
});
