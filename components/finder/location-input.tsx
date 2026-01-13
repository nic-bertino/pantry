"use client";

import { useState } from "react";
import { ChevronDownIcon, MapPinIcon, NavigationIcon } from "lucide-react";
import { Popover as PopoverPrimitive } from "radix-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslations } from "@/lib/i18n/use-translations";
import { getCoordinatesForZip, isValidZipFormat } from "@/lib/geo/zip-lookup";
import { cn } from "@/lib/utils";

interface Coordinates {
	lat: number;
	lng: number;
}

interface LocationInputProps {
	coordinates: Coordinates | null;
	source: "browser" | "zip" | null;
	zipCode: string | null;
	permissionState: "prompt" | "granted" | "denied" | "unavailable";
	isLoading: boolean;
	onRequestBrowserLocation: () => void;
	onSetZipLocation: (zip: string, coordinates: Coordinates) => void;
}

export function LocationInput({
	coordinates,
	source,
	zipCode,
	permissionState,
	isLoading,
	onRequestBrowserLocation,
	onSetZipLocation,
}: LocationInputProps) {
	const { t } = useTranslations();
	const [open, setOpen] = useState(false);
	const [zipInput, setZipInput] = useState(zipCode ?? "");
	const [zipError, setZipError] = useState<string | null>(null);

	// Determine trigger label
	const getTriggerLabel = () => {
		if (isLoading) return "...";
		if (coordinates) {
			if (source === "browser") return t("nearYou");
			if (source === "zip" && zipCode) return t("nearZip", { zip: zipCode });
		}
		return t("setLocation");
	};

	const handleBrowserLocation = () => {
		onRequestBrowserLocation();
		setOpen(false);
	};

	const handleZipSubmit = () => {
		const cleaned = zipInput.trim();

		if (!isValidZipFormat(cleaned)) {
			setZipError(t("invalidZip"));
			return;
		}

		const coords = getCoordinatesForZip(cleaned);
		if (!coords) {
			setZipError(t("invalidZip"));
			return;
		}

		setZipError(null);
		onSetZipLocation(cleaned, coords);
		setOpen(false);
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			e.preventDefault();
			handleZipSubmit();
		}
	};

	const showBrowserOption = permissionState !== "denied";

	const hasLocation = !!coordinates;

	return (
		<PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
			<PopoverPrimitive.Trigger asChild>
				<button
					type="button"
					className="flex items-center gap-1.5 text-sm text-left hover:opacity-70 transition-opacity"
				>
					<MapPinIcon className="h-4 w-4 text-muted-foreground shrink-0" />
					<span className={hasLocation ? "text-foreground" : "text-muted-foreground"}>
						{getTriggerLabel()}
					</span>
					{hasLocation && (
						<span className="text-muted-foreground">· {t("change")}</span>
					)}
					{!hasLocation && (
						<ChevronDownIcon className="h-3 w-3 text-muted-foreground" />
					)}
				</button>
			</PopoverPrimitive.Trigger>

			<PopoverPrimitive.Portal>
				<PopoverPrimitive.Content
					align="start"
					sideOffset={8}
					className={cn(
						"z-50 w-72 rounded-2xl bg-popover p-4 shadow-2xl ring-1 ring-foreground/5",
						"data-[state=open]:animate-in data-[state=closed]:animate-out",
						"data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
						"data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
						"data-[side=bottom]:slide-in-from-top-2",
					)}
				>
					{/* Browser location option */}
					{showBrowserOption && (
						<button
							type="button"
							onClick={handleBrowserLocation}
							disabled={isLoading}
							className="w-full flex items-start gap-3 p-2 -m-2 mb-3 rounded-xl hover:bg-muted/50 transition-colors text-left"
						>
							<div className="mt-0.5 p-1.5 rounded-full bg-primary/10">
								<NavigationIcon className="h-4 w-4 text-primary" />
							</div>
							<div>
								<div className="font-medium text-sm">
									{t("useMyLocation")}
								</div>
								<div className="text-xs text-muted-foreground">
									{t("useMyLocationDesc")}
								</div>
							</div>
						</button>
					)}

					{/* Divider */}
					{showBrowserOption && (
						<div className="h-px bg-border/50 my-3" />
					)}

					{/* ZIP code input */}
					<div className="space-y-2">
						<label
							htmlFor="zip-input"
							className="text-sm font-medium"
						>
							{t("zipCode")}
						</label>
						<div className="flex gap-2">
							<Input
								id="zip-input"
								type="text"
								inputMode="numeric"
								pattern="[0-9]*"
								maxLength={5}
								placeholder="92101"
								value={zipInput}
								onChange={(e) => {
									setZipInput(e.target.value);
									setZipError(null);
								}}
								onKeyDown={handleKeyDown}
								aria-invalid={!!zipError}
								className="flex-1"
							/>
							<Button
								size="sm"
								onClick={handleZipSubmit}
								className="shrink-0"
							>
								{t("update")}
							</Button>
						</div>
						{zipError && (
							<p className="text-xs text-destructive">{zipError}</p>
						)}
					</div>
				</PopoverPrimitive.Content>
			</PopoverPrimitive.Portal>
		</PopoverPrimitive.Root>
	);
}
