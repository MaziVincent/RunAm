import { useEffect, useState } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuthStore } from "@runam/shared/stores/auth-store";
import { useOnboardingStore } from "@runam/shared/stores/onboarding-store";
import SplashScreen from "@runam/shared/components/SplashScreen";

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			retry: 2,
			staleTime: 1000 * 60 * 5,
		},
	},
});

function AuthGuard({ children }: { children: React.ReactNode }) {
	const { isAuthenticated, isHydrated } = useAuthStore();
	const { hasSeenOnboarding, isHydrated: onboardingHydrated } =
		useOnboardingStore();
	const segments = useSegments();
	const router = useRouter();

	useEffect(() => {
		if (!isHydrated || !onboardingHydrated) return;

		const inAuthGroup = segments[0] === "(auth)";
		const inOnboarding = segments[0] === "onboarding";
		const inRiderOnboarding = segments[0] === "(onboarding)";

		// First-time user → show welcome onboarding
		if (!hasSeenOnboarding && !inOnboarding) {
			router.replace("/onboarding");
			return;
		}

		// Already onboarded → normal auth flow
		if (hasSeenOnboarding) {
			if (!isAuthenticated && !inAuthGroup) {
				router.replace("/(auth)/login");
			} else if (isAuthenticated && inAuthGroup) {
				router.replace("/(tabs)");
			}
		}
	}, [
		isAuthenticated,
		isHydrated,
		hasSeenOnboarding,
		onboardingHydrated,
		segments,
	]);

	return <>{children}</>;
}

export default function RootLayout() {
	const { hydrate } = useAuthStore();
	const { hydrate: hydrateOnboarding } = useOnboardingStore();
	const [showSplash, setShowSplash] = useState(true);

	useEffect(() => {
		hydrate();
		hydrateOnboarding();
	}, []);

	return (
		<QueryClientProvider client={queryClient}>
			{showSplash && (
				<SplashScreen
					onFinish={() => setShowSplash(false)}
					appName="RunAm"
					tagline="Deliver errands, earn more."
					accentColor="#3B82F6"
				/>
			)}
			{!showSplash && (
				<AuthGuard>
					<Stack screenOptions={{ headerShown: false }}>
						<Stack.Screen name="onboarding" options={{ headerShown: false }} />
						<Stack.Screen name="(auth)" />
						<Stack.Screen name="(tabs)" />
						<Stack.Screen
							name="(onboarding)"
							options={{
								headerShown: true,
								title: "Get Started",
								presentation: "modal",
							}}
						/>
						<Stack.Screen
							name="errand/active"
							options={{ headerShown: true, title: "Active Delivery" }}
						/>
						<Stack.Screen
							name="errand/chat"
							options={{ headerShown: true, title: "Chat" }}
						/>
						<Stack.Screen
							name="notifications"
							options={{ headerShown: false }}
						/>
						<Stack.Screen name="ratings" options={{ headerShown: false }} />
						<Stack.Screen name="performance" options={{ headerShown: false }} />
						<Stack.Screen name="leaderboard" options={{ headerShown: false }} />
						<Stack.Screen
							name="bank-accounts"
							options={{ headerShown: false }}
						/>
					</Stack>
					<StatusBar style="dark" />
				</AuthGuard>
			)}
		</QueryClientProvider>
	);
}
