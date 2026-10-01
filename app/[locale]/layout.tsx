import type { Metadata } from "next";
import { redirect } from "next/navigation";
import translations from "@/lib/data/translations.json";
import type { Locale } from "@/lib/types/location";

const SUPPORTED_LOCALES: Locale[] = ["en", "es"];

export function generateStaticParams() {
	return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ locale: string }>;
}): Promise<Metadata> {
	const { locale } = await params;
	if (locale !== "es") return {};
	return { title: translations.es.appTitle };
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
