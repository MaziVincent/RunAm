import React from "react";
import OnboardingScreen from "@runam/shared/components/OnboardingScreen";
import type { OnboardingSlide } from "@runam/shared/components/OnboardingScreen";
import { useOnboardingStore } from "@runam/shared/stores/onboarding-store";

const slides: OnboardingSlide[] = [
	{
		id: "1",
		emoji: "🏍️",
		secondaryEmojis: ["💰", "📦", "🗺️"],
		headline: "Deliver & Earn",
		description:
			"Accept errands near you, navigate to pickups, and earn on every completed delivery.",
		backgroundColor: "#2F8F4E",
	},
	{
		id: "2",
		emoji: "📊",
		secondaryEmojis: ["🏆", "⭐", "💵"],
		headline: "Grow Your Earnings",
		description:
			"Track your performance, climb leaderboards, and withdraw your earnings anytime.",
		backgroundColor: "#F59E0B",
	},
];

export default function RiderOnboarding() {
	const { completeOnboarding } = useOnboardingStore();

	return (
		<OnboardingScreen
			slides={slides}
			onComplete={completeOnboarding}
			accentColor="#2F8F4E"
		/>
	);
}
