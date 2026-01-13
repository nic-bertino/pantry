"use client";

import { InfoIcon, MapPinIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
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

	const fullAddress = `${location.address}, ${location.city}, ${location.state} ${location.postcode}`;
	const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(fullAddress)}`;

	// Only show Drive-through as exceptional (Walk-up is default)
	const showDriveThrough = location.tags.includes("Drive-through");

	// Check if location has requirements
	const hasRequirements = location.eligibility !== null;

	// Stop propagation so action buttons don't trigger row click
	const handleActionClick = (e: React.MouseEvent) => {
		e.stopPropagation();
	};

	// Handle requirements button click - opens modal
	const handleRequirementsClick = (e: React.MouseEvent) => {
		e.stopPropagation();
		onClick?.();
	};

	return (
		<article className="group">
			{/* Desktop: Clean row layout */}
			{/* biome-ignore lint/a11y/useSemanticElements: div with role="button" needed for nested interactive content */}
			<div
				className="hidden sm:flex sm:items-center sm:gap-4 sm:py-3 sm:cursor-pointer sm:rounded-lg sm:-mx-2 sm:px-2 hover:bg-muted/50 transition-colors"
				onClick={onClick}
				role="button"
				tabIndex={0}
				onKeyDown={(e) => e.key === "Enter" && onClick?.()}
			>
				{/* Name and location */}
				<div className="min-w-0 flex-1">
					<h3 className="font-medium truncate">{name}</h3>
					<p className="text-sm text-muted-foreground">
						{location.city}
						{location.distance !== undefined && (
							<span>
								{" "}
								· {t("milesAway", { miles: location.distance.toFixed(1) })}
							</span>
						)}
						{showDriveThrough && <span> · {t("driveThrough")}</span>}
						<span className="ml-2">
							<StatusBadge availability={location.availability} variant="text" />
						</span>
					</p>
				</div>

				{/* Action - stopPropagation wrapper */}
				<div className="shrink-0">
					{hasRequirements ? (
						<Button variant="ghost" size="sm" onClick={handleRequirementsClick}>
							{t("seeRequirements")}
						</Button>
					) : (
						// biome-ignore lint/a11y/useKeyWithClickEvents lint/a11y/noStaticElementInteractions: event delegation only
						<div onClick={handleActionClick}>
							<Button variant="ghost" size="sm" asChild>
								<a href={mapsUrl} target="_blank" rel="noopener noreferrer">
									{t("directions")}
								</a>
							</Button>
						</div>
					)}
				</div>
			</div>

			{/* Mobile: Card layout */}
			{/* biome-ignore lint/a11y/useSemanticElements: div with role="button" needed for nested interactive content */}
			<div
				className="sm:hidden rounded-lg border border-border bg-card p-4 active:bg-muted/50 transition-colors"
				onClick={onClick}
				role="button"
				tabIndex={0}
				onKeyDown={(e) => e.key === "Enter" && onClick?.()}
			>
				<div className="min-w-0">
					<h3 className="font-medium leading-tight">{name}</h3>
					<p className="mt-0.5 text-sm text-muted-foreground">
						{location.city}
						{location.distance !== undefined && (
							<span>
								{" "}
								· {t("milesAway", { miles: location.distance.toFixed(1) })}
							</span>
						)}
						{showDriveThrough && <span> · {t("driveThrough")}</span>}
						<span className="ml-2">
							<StatusBadge availability={location.availability} variant="text" />
						</span>
					</p>
				</div>

				{/* Action - stopPropagation wrapper */}
				<div className="mt-3">
					{hasRequirements ? (
						<Button
							variant="outline"
							size="sm"
							onClick={handleRequirementsClick}
						>
							<InfoIcon className="mr-1.5 h-4 w-4" />
							{t("seeRequirements")}
						</Button>
					) : (
						// biome-ignore lint/a11y/useKeyWithClickEvents lint/a11y/noStaticElementInteractions: event delegation only
						<div onClick={handleActionClick}>
							<Button variant="outline" size="sm" asChild>
								<a href={mapsUrl} target="_blank" rel="noopener noreferrer">
									<MapPinIcon className="mr-1.5 h-4 w-4" />
									{t("directions")}
								</a>
							</Button>
						</div>
					)}
				</div>
			</div>
		</article>
	);
}
