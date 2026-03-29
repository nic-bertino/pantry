"use client";

import { useEffect, useRef, useState } from "react";
import {
	CheckIcon,
	ChevronDownIcon,
	LoaderCircleIcon,
	MapPinIcon,
	NavigationIcon,
	XIcon,
} from "lucide-react";
import { Popover as PopoverPrimitive } from "@base-ui/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslations } from "@/lib/i18n/use-translations";
import { getCoordinatesForZip, isValidZipFormat } from "@/lib/geo/zip-lookup";
import { cn } from "@/lib/utils";

interface Coordinates {
	lat: number;
	lng: number;
}

type FeedbackType = "idle" | "loading" | "success" | "error";

interface LocationInputProps {
	coordinates: Coordinates | null;
	source: "browser" | "zip" | null;
	zipCode: string | null;
	permissionState: "prompt" | "granted" | "denied" | "unavailable";
	isLoading: boolean;
	error: string | null;
	onRequestBrowserLocation: () => void;
	onSetZipLocation: (zip: string, coordinates: Coordinates) => void;
	onClearLocation: () => void;
}

/** Map English error strings from the hook to translation keys */
function errorToTranslationKey(
	error: string,
): "locationDenied" | "locationUnavailable" | "locationTimedOut" | "geoError" {
	if (error.includes("denied")) return "locationDenied";
	if (error.includes("unavailable")) return "locationUnavailable";
	if (error.includes("timed out")) return "locationTimedOut";
	return "geoError";
}

export function LocationInput({
	coordinates,
	source,
	zipCode,
	permissionState,
	isLoading,
	error,
	onRequestBrowserLocation,
	onSetZipLocation,
	onClearLocation,
}: LocationInputProps) {
	const { t } = useTranslations();
	const [open, setOpen] = useState(false);
	const [zipInput, setZipInput] = useState(zipCode ?? "");
	const [zipError, setZipError] = useState<string | null>(null);
	const [feedback, setFeedback] = useState<FeedbackType>("idle");
	const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	// Track loading → success/error transitions for browser geolocation
	useEffect(() => {
		if (feedback !== "loading") return;

		if (!isLoading && coordinates) {
			setFeedback("success");
		} else if (!isLoading && error) {
			setFeedback("error");
		}
	}, [feedback, isLoading, coordinates, error]);

	// Auto-close popover after success
	useEffect(() => {
		if (feedback !== "success") return;

		successTimerRef.current = setTimeout(() => {
			setOpen(false);
		}, 1500);

		return () => {
			if (successTimerRef.current) {
				clearTimeout(successTimerRef.current);
			}
		};
	}, [feedback]);

	// Reset feedback when popover reopens
	const handleOpenChange = (nextOpen: boolean) => {
		setOpen(nextOpen);
		if (nextOpen) {
			setFeedback("idle");
		}
	};

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
		setFeedback("loading");
		onRequestBrowserLocation();
		// Do NOT close popover — stay open to show progress
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
		setFeedback("success");
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			e.preventDefault();
			handleZipSubmit();
		}
	};

	const handleClear = () => {
		onClearLocation();
		setOpen(false);
	};

	const showBrowserOption = permissionState !== "denied";
	const hasLocation = !!coordinates;
	const canRetry = error && !error.includes("denied");

	return (
		<PopoverPrimitive.Root open={open} onOpenChange={handleOpenChange}>
			<PopoverPrimitive.Trigger
				aria-label={isLoading ? t("locatingYou") : undefined}
				className={cn(
					"inline-flex items-center gap-1.5 whitespace-nowrap rounded-full text-sm px-3 py-1.5 transition-colors",
					hasLocation
						? "border border-border text-foreground hover:bg-muted/50"
						: "bg-primary text-primary-foreground hover:bg-primary/90",
				)}
			>
				{isLoading ? (
					<LoaderCircleIcon
						aria-hidden="true"
						className={cn(
							"h-3.5 w-3.5 shrink-0 animate-spin motion-reduce:animate-none",
							hasLocation && "text-muted-foreground",
						)}
					/>
				) : (
					<MapPinIcon
						aria-hidden="true"
						className={cn(
							"h-3.5 w-3.5 shrink-0",
							hasLocation && "text-muted-foreground",
						)}
					/>
				)}
				{getTriggerLabel()}
				<ChevronDownIcon
					aria-hidden="true"
					className={cn(
						"h-3 w-3",
						hasLocation ? "text-muted-foreground" : "opacity-70",
					)}
				/>
			</PopoverPrimitive.Trigger>

			<PopoverPrimitive.Portal>
				<PopoverPrimitive.Positioner align="start" sideOffset={8}>
					<PopoverPrimitive.Popup
						className={cn(
							"z-50 w-72 rounded-2xl bg-popover p-4 shadow-2xl ring-1 ring-foreground/5",
							"data-open:animate-in data-closed:animate-out",
							"data-closed:fade-out-0 data-open:fade-in-0",
							"data-closed:zoom-out-95 data-open:zoom-in-95",
							"data-[side=bottom]:slide-in-from-top-2",
						)}
					>
						{feedback !== "idle" && (
							<div
								key={feedback}
								role="status"
								aria-live="polite"
								className="animate-in fade-in-0 duration-150"
							>
								{feedback === "loading" && (
									<div className="flex flex-col items-center gap-2 py-4">
										<LoaderCircleIcon aria-hidden="true" className="h-5 w-5 animate-spin motion-reduce:animate-none text-primary" />
										<p className="text-sm text-muted-foreground">
											{t("locatingYou")}
										</p>
									</div>
								)}

								{feedback === "success" && (
									<div className="flex flex-col items-center gap-2 py-4">
										<CheckIcon aria-hidden="true" className="h-5 w-5 text-primary" />
										<p className="text-sm text-muted-foreground">
											{t("locationSet")}
										</p>
									</div>
								)}

								{feedback === "error" && (
									<div className="flex flex-col items-center gap-2 py-4">
										<XIcon aria-hidden="true" className="h-5 w-5 text-destructive" />
										<p className="text-sm text-destructive">
											{t(errorToTranslationKey(error ?? ""))}
										</p>
										{canRetry ? (
											<Button
												size="sm"
												variant="outline"
												onClick={handleBrowserLocation}
											>
												{t("retry")}
											</Button>
										) : (
											<p className="text-xs text-muted-foreground">
												{t("enableInSettings")}
											</p>
										)}
									</div>
								)}
							</div>
						)}

						{feedback === "idle" && (
							<div
								key="idle"
								className="animate-in fade-in-0 duration-150"
							>
								{/* Browser location option */}
								{showBrowserOption && (
									<button
										type="button"
										onClick={handleBrowserLocation}
										disabled={isLoading}
										className="w-full flex items-start gap-3 p-2 -m-2 mb-3 rounded-xl hover:bg-muted/50 transition-colors text-left"
									>
										<div className="mt-0.5 p-1.5 rounded-full bg-primary/10" aria-hidden="true">
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
									<div className="h-px bg-border/50 my-3" aria-hidden="true" />
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
											aria-describedby={zipError ? "zip-error" : undefined}
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
										<p id="zip-error" role="alert" className="text-xs text-destructive">{zipError}</p>
									)}
								</div>

								{/* Clear location */}
								{hasLocation && (
									<>
										<div className="h-px bg-border/50 my-3" aria-hidden="true" />
										<button
											type="button"
											onClick={handleClear}
											className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
										>
											{t("clearLocation")}
										</button>
									</>
								)}
							</div>
						)}
					</PopoverPrimitive.Popup>
				</PopoverPrimitive.Positioner>
			</PopoverPrimitive.Portal>
		</PopoverPrimitive.Root>
	);
}
