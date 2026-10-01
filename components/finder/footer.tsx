"use client";

import Image from "next/image";
import { useTranslations } from "@/lib/i18n/use-translations";

export function Footer() {
	const { t } = useTranslations();
	const [beforeName, afterName] = t("openSourceProject").split("{name}");

	return (
		<footer className="border-t border-border bg-background mt-8">
			<div className="container mx-auto flex max-w-3xl flex-col items-center gap-2 px-4 py-6 text-sm text-muted-foreground">
				{/* Shown in the header from sm up */}
				<p className="sm:hidden">
					{t("poweredBy")}{" "}
					<a
						href="https://www.feedingsandiego.com"
						className="underline underline-offset-2 hover:text-foreground transition-colors"
					>
						Feeding San Diego
					</a>
				</p>
				<p className="flex items-center gap-2">
					<Image
						src="/pantry-app.svg"
						alt=""
						width={16}
						height={16}
						className="w-4 h-4 opacity-60"
					/>
					<span>
						{beforeName}
						<a
							href="https://github.com/nic-bertino/pantry"
							target="_blank"
							rel="noopener noreferrer"
							className="underline underline-offset-2 hover:text-foreground transition-colors"
						>
							Pantry
						</a>
						{afterName}
					</span>
				</p>
			</div>
		</footer>
	);
}
