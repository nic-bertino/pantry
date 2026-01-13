import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function RootPage() {
	const headersList = await headers();
	const acceptLanguage = headersList.get("accept-language") || "";

	// Check if Spanish is preferred
	const prefersSpanish = acceptLanguage.toLowerCase().startsWith("es");

	redirect(prefersSpanish ? "/es" : "/en");
}
