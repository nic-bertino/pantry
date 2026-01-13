import type { Metadata } from "next";
import { DM_Sans, Geist_Mono } from "next/font/google";
import Script from "next/script";
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
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" className={dmSans.variable}>
			<body className={`${geistMono.variable} antialiased`}>
				{children}
				<Script
					id="clarity-script"
					strategy="afterInteractive"
					dangerouslySetInnerHTML={{
						__html: `
							(function(c,l,a,r,i,t,y){
								c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
								t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
								y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
							})(window, document, "clarity", "script", "v0yhu0nkez");
						`,
					}}
				/>
			</body>
		</html>
	);
}
