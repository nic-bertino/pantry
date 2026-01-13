"use client";

import { MapPinIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/lib/i18n/use-translations";

interface GeoPromptProps {
	onAllow: () => void;
	isLoading?: boolean;
	error?: string | null;
}

export function GeoPrompt({ onAllow, isLoading, error }: GeoPromptProps) {
	const { t } = useTranslations();

	return (
		<div className="flex items-center gap-2">
			<Button
				variant="outline"
				size="sm"
				onClick={onAllow}
				disabled={isLoading}
			>
				<MapPinIcon className="mr-1.5 h-4 w-4" />
				{isLoading ? "..." : error ? "Retry" : t("geoPromptInline")}
			</Button>
			{error && (
				<span className="text-sm text-muted-foreground">{error}</span>
			)}
		</div>
	);
}
