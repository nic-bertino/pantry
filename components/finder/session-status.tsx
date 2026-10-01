import type { SessionLabel } from "@/lib/format/session";
import { cn } from "@/lib/utils";

const toneClasses: Record<SessionLabel["tone"], string> = {
	open: "font-medium text-brand-green",
	soon: "text-foreground",
	later: "text-muted-foreground",
};

/**
 * Session label with a shape cue that doesn't rely on color alone:
 * filled dot = open now, hollow ring = opening within the hour.
 */
export function SessionStatus({
	label,
	className,
}: {
	label: SessionLabel;
	className?: string;
}) {
	return (
		<span
			className={cn(
				"inline-flex items-center gap-1.5",
				toneClasses[label.tone],
				className,
			)}
		>
			{label.tone === "open" && (
				<span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-brand-green" />
			)}
			{label.tone === "soon" && (
				<span
					aria-hidden="true"
					className="size-2 shrink-0 rounded-full ring-[1.5px] ring-inset ring-brand-green"
				/>
			)}
			{label.text}
		</span>
	);
}
