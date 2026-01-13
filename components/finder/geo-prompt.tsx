"use client";

import { MapPinIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/lib/i18n/use-translations";

interface GeoPromptProps {
	onAllow: () => void;
	isLoading?: boolean;
}

export function GeoPrompt({ onAllow, isLoading }: GeoPromptProps) {
	const { t } = useTranslations();

	return (
		<Button variant="outline" size="sm" onClick={onAllow} disabled={isLoading}>
			<MapPinIcon className="mr-1.5 h-4 w-4" />
			{isLoading ? "..." : t("geoPromptInline")}
		</Button>
	);
}
