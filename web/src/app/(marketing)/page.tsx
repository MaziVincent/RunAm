import type { Metadata } from "next";
import {
	Hero,
	HowItWorks,
	ServiceCategories,
	FeaturedVendors,
	ValueProps,
	StatsCounter,
	Testimonials,
	CTASection,
} from "@/components/marketing";

export const metadata: Metadata = {
	title: "RunAm — Your Errands, Delivered. Your City, Connected.",
	description:
		"Nigeria's on-demand delivery and marketplace platform. Send packages, order from local shops, or get anything delivered. Fast, reliable, and affordable.",
	openGraph: {
		title: "RunAm — Your Errands, Delivered",
		description:
			"Nigeria's on-demand delivery and marketplace platform. Send packages, order from local shops, or get anything delivered.",
		url: "https://runam.ng",
		type: "website",
	},
};

// JSON-LD structured data for SEO
const jsonLd = {
	"@context": "https://schema.org",
	"@type": "WebApplication",
	name: "RunAm",
	url: "https://runam.ng",
	description:
		"Nigeria's on-demand delivery and marketplace platform. Send packages, order from local shops, or get anything delivered.",
	applicationCategory: "BusinessApplication",
	operatingSystem: "Web, iOS, Android",
	offers: {
		"@type": "Offer",
		price: "0",
		priceCurrency: "NGN",
		description: "Free to sign up",
	},
	aggregateRating: {
		"@type": "AggregateRating",
		ratingValue: "4.7",
		reviewCount: "10000",
		bestRating: "5",
		worstRating: "1",
	},
	areaServed: {
		"@type": "Country",
		name: "Nigeria",
	},
	provider: {
		"@type": "Organization",
		name: "RunAm",
		url: "https://runam.ng",
		logo: "https://runam.ng/logo.png",
		sameAs: [
			"https://twitter.com/runam_ng",
			"https://instagram.com/runam.ng",
			"https://facebook.com/runam.ng",
		],
	},
};

export default function HomePage() {
	return (
		<>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
			/>
			<Hero />
			<HowItWorks />
			<ServiceCategories />
			<FeaturedVendors />
			<ValueProps />
			<StatsCounter />
			<Testimonials />
			<CTASection />
		</>
	);
}
