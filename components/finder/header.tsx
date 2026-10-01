"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LanguagesIcon } from "lucide-react";
import { useTranslations } from "@/lib/i18n/use-translations";
import type { Locale } from "@/lib/types/location";

export function Header() {
	const { t, locale } = useTranslations();
	const router = useRouter();
	const pathname = usePathname();
	const otherLocale: Locale = locale === "en" ? "es" : "en";

	const toggleLocale = () => {
		// Keep filter/region params so switching language doesn't reset the view
		router.push(
			`${pathname.replace(`/${locale}`, `/${otherLocale}`)}${window.location.search}`,
		);
	};

	return (
		<header className="bg-primary text-primary-foreground">
			<div className="container mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-0.5">
				<div className="flex min-w-0 items-center gap-2">
					<h1 className="min-w-0 text-sm font-medium">
						<Link
							href={`/${locale}`}
							className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
						>
							<Image
								src="/pantry-app.svg"
								alt=""
								width={20}
								height={20}
								className="w-5 h-5 shrink-0 brightness-0 invert"
								priority
							/>
							<span className="truncate">{t("appTitle")}</span>
						</Link>
					</h1>
					{/* On small screens this moves to the footer */}
					<span className="hidden text-sm text-primary-foreground/90 sm:inline">
						{t("poweredBy")}{" "}
						<a
							href="https://www.feedingsandiego.com"
							className="underline underline-offset-2"
						>
							Feeding San Diego
						</a>
					</span>
				</div>
				<button
					type="button"
					onClick={toggleLocale}
					lang={otherLocale}
					className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-md px-2 text-sm text-primary-foreground hover:bg-primary-foreground/10 transition-colors"
				>
					<LanguagesIcon className="h-4 w-4" aria-hidden="true" />
					{otherLocale === "es" ? "Español" : "English"}
				</button>
			</div>
		</header>
	);
}
