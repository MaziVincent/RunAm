import React from "react";
import OnboardingScreen from "@runam/shared/components/OnboardingScreen";
import type { OnboardingSlide } from "@runam/shared/components/OnboardingScreen";
import { useOnboardingStore } from "@runam/shared/stores/onboarding-store";

const slides: OnboardingSlide[] = [
	{
		id: "1",
		emoji: "📦",
		secondaryEmojis: ["🏍️", "⚡", "📍"],
		headline: "Send Anything, Anywhere",
		description:
			"From packages to groceries — place an errand and a nearby rider picks it up in minutes.",
		backgroundColor: "#2F8F4E",
	},
	{
		id: "2",
		emoji: "🗺️",
		secondaryEmojis: ["💬", "🔔", "⭐"],
		headline: "Track & Chat in Real-Time",
		description:
			"Follow your delivery live on the map, message your rider, and rate the experience.",
		backgroundColor: "#10B981",
	},
];

export default function UserOnboarding() {
	const { completeOnboarding } = useOnboardingStore();

	return (
		<OnboardingScreen
			slides={slides}
			onComplete={completeOnboarding}
			accentColor="#2F8F4E"
		/>
	);
}
