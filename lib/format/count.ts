/**
 * Format a count as an approximate value for display
 * Reduces cognitive load by avoiding precise large numbers
 *
 * Examples:
 *   7 → "7"
 *   42 → "40+"
 *   359 → "350+"
 *   383 → "350+"
 */
export function approximateCount(count: number): string {
	if (count < 10) return String(count);
	if (count < 100) {
		const rounded = Math.floor(count / 10) * 10;
		return `${rounded}+`;
	}
	const rounded = Math.floor(count / 50) * 50;
	return `${rounded}+`;
}
