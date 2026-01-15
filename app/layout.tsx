import type { Metadata } from "next";
import { DM_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
	subsets: ["latin"],
	variable: "--font-sans",
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "Find Food Now",
	description: "Free food distribution finder for San Diego",
	icons: {
		icon: [
			{ url: "/favicon.svg", type: "image/svg+xml" },
			{ url: "/favicon-96x96.png", type: "image/png", sizes: "96x96" },
		],
		apple: "/apple-touch-icon.png",
	},
	manifest: "/manifest.webmanifest",
	openGraph: {
		title: "Find Food Now",
		description: "Free food distribution finder for San Diego",
		type: "website",
		images: [{ url: "/web-app-manifest-512x512.png", width: 512, height: 512 }],
	},
	twitter: {
		card: "summary",
		title: "Find Food Now",
		description: "Free food distribution finder for San Diego",
		images: ["/web-app-manifest-512x512.png"],
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" className={dmSans.variable}>
			<body className={`${geistMono.variable} antialiased`}>{children}</body>
		</html>
	);
}
