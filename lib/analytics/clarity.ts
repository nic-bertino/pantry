/**
 * Thin wrapper around the Microsoft Clarity tag loaded in app/layout.tsx.
 * No-ops when Clarity isn't configured (no NEXT_PUBLIC_CLARITY_PROJECT_ID).
 */

type ClarityFn = (command: string, ...args: string[]) => void;

/**
 * Record a custom event, optionally tagging the session so it can be
 * filtered by value in the Clarity dashboard.
 */
export function trackClarityEvent(
	name: string,
	tags: Record<string, string> = {},
): void {
	if (typeof window === "undefined") return;
	const clarity = (window as Window & { clarity?: ClarityFn }).clarity;
	if (typeof clarity !== "function") return;

	for (const [key, value] of Object.entries(tags)) {
		clarity("set", key, value);
	}
	clarity("event", name);
}
