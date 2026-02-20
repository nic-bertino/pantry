"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDownIcon } from "lucide-react";
import { useTranslations } from "@/lib/i18n/use-translations";
import type { Locale } from "@/lib/types/location";

export function Header() {
	const { t, locale } = useTranslations();
	const router = useRouter();
	const pathname = usePathname();

	const toggleLocale = () => {
		const newLocale: Locale = locale === "en" ? "es" : "en";
		const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
		router.push(newPath);
	};

	return (
		<header className="border-b border-border">
			<div className="container mx-auto px-4 py-2">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-1.5">
						<Link
							href={`/${locale}`}
							className="shrink-0 hover:opacity-80 transition-opacity"
							aria-label="Home"
						>
							<Image
								src="/pantry-app.svg"
								alt=""
								width={20}
								height={20}
								className="w-5 h-5"
								priority
							/>
						</Link>
						<span className="text-sm font-medium">{t("appTitle")}</span>
						<span className="text-sm text-muted-foreground">
							Powered by{" "}
							<a href="https://www.feedingsandiego.com" className="underline">
								Feeding San Diego
							</a>
						</span>
					</div>
					<button
						type="button"
						onClick={toggleLocale}
						aria-label={
							locale === "en" ? "Switch to Spanish" : "Cambiar a inglés"
						}
						className="inline-flex items-center gap-0.5 text-sm text-muted-foreground hover:text-foreground transition-colors px-1 py-1"
					>
						{locale === "en" ? "ES" : "EN"}
						<ChevronDownIcon className="h-3 w-3" aria-hidden="true" />
					</button>
				</div>
			</div>
		</header>
	);
}
