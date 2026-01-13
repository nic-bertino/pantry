import { redirect } from "next/navigation";
import type { Locale } from "@/lib/types/location";

const SUPPORTED_LOCALES: Locale[] = ["en", "es"];

export function generateStaticParams() {
	return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
	children,
	params,
}: {
	children: React.ReactNode;
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await params;

	// Validate locale
	if (!SUPPORTED_LOCALES.includes(locale as Locale)) {
		redirect("/en");
	}

	return children;
}
