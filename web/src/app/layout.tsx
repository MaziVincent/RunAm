import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

export const runtime = "edge";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
	title: {
		default: "RunAm — Errands Done. Deliveries Made. Life Simplified.",
		template: "%s | RunAm",
	},
	description:
		"RunAm is Nigeria's fastest errand and logistics platform. Send packages, order food, shop from vendors, and get anything delivered — all in one app.",
	keywords: [
		"errands",
		"delivery",
		"logistics",
		"Nigeria",
		"food delivery",
		"package delivery",
		"same-day delivery",
		"RunAm",
	],
	authors: [{ name: "RunAm" }],
	openGraph: {
		type: "website",
		locale: "en_NG",
		url: "https://runam.com",
		siteName: "RunAm",
		title: "RunAm — Errands Done. Deliveries Made. Life Simplified.",
		description:
			"Nigeria's fastest errand and logistics platform. Send packages, order food, shop from vendors, and get anything delivered.",
	},
	twitter: {
		card: "summary_large_image",
		title: "RunAm — Errands Done. Deliveries Made. Life Simplified.",
		description:
			"Nigeria's fastest errand and logistics platform. Send packages, order food, shop from vendors, and get anything delivered.",
	},
	robots: {
		index: true,
		follow: true,
	},
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en" className={inter.variable} suppressHydrationWarning>
			<body className="font-sans">
				<Providers>{children}</Providers>
			</body>
		</html>
	);
}
