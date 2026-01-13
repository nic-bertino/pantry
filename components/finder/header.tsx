"use client";

import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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
		<header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<div className="container mx-auto flex items-center justify-between px-4 py-3">
				<div>
					<h1 className="text-xl font-semibold tracking-tight">
						{t("appTitle")}
					</h1>
					<p className="text-sm text-muted-foreground">{t("appSubtitle")}</p>
				</div>
				<Button
					variant="outline"
					size="sm"
					onClick={toggleLocale}
					className="font-medium"
				>
					{locale === "en" ? "ES" : "EN"}
				</Button>
			</div>
		</header>
	);
}
