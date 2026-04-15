import { useEffect, useState } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuthStore } from "@runam/shared/stores/auth-store";
import { useLocationStore } from "@runam/shared/stores/location-store";
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

		// First-time user → show onboarding
		if (!hasSeenOnboarding && !inOnboarding) {
			router.replace("/onboarding");
			return;
		}

		// Already onboarded → normal auth flow
		if (hasSeenOnboarding && isAuthenticated && inAuthGroup) {
			router.replace("/(tabs)");
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
	const {
		hydrate: hydrateOnboarding,
		hasSeenOnboarding,
		isHydrated: onboardingHydrated,
	} = useOnboardingStore();
	const { request: requestLocation, hasRequested: hasRequestedLocation } =
		useLocationStore();
	const [showSplash, setShowSplash] = useState(true);

	useEffect(() => {
		hydrate();
		hydrateOnboarding();
	}, []);

	useEffect(() => {
		if (
			showSplash ||
			!onboardingHydrated ||
			!hasSeenOnboarding ||
			hasRequestedLocation
		) {
			return;
		}

		void requestLocation();
	}, [
		showSplash,
		onboardingHydrated,
		hasSeenOnboarding,
		hasRequestedLocation,
		requestLocation,
	]);

	return (
		<QueryClientProvider client={queryClient}>
			{showSplash && (
				<SplashScreen
					onFinish={() => setShowSplash(false)}
					appName="RunAm"
					tagline="Errands delivered, fast."
					accentColor="#2F8F4E"
				/>
			)}
			{!showSplash && (
				<AuthGuard>
					<Stack screenOptions={{ headerShown: false }}>
						<Stack.Screen name="onboarding" options={{ headerShown: false }} />
						<Stack.Screen name="(auth)" />
						<Stack.Screen name="(tabs)" />
						<Stack.Screen
							name="errand/new"
							options={{
								headerShown: true,
								title: "New Errand",
								presentation: "modal",
							}}
						/>
						<Stack.Screen
							name="errand/tracking"
							options={{ headerShown: true, title: "Track Errand" }}
						/>
						<Stack.Screen
							name="errand/chat"
							options={{ headerShown: true, title: "Chat" }}
						/>
						<Stack.Screen
							name="errand/rate"
							options={{
								headerShown: true,
								title: "Rate Delivery",
								presentation: "modal",
							}}
						/>
						<Stack.Screen
							name="vendors/categories"
							options={{ headerShown: false }}
						/>
						<Stack.Screen
							name="vendors/list"
							options={{ headerShown: false }}
						/>
						<Stack.Screen
							name="vendors/[id]"
							options={{ headerShown: false }}
						/>
						<Stack.Screen
							name="vendors/product"
							options={{
								headerShown: false,
								presentation: "modal",
							}}
						/>
						<Stack.Screen
							name="cart"
							options={{
								headerShown: false,
								presentation: "modal",
							}}
						/>
						<Stack.Screen name="checkout" options={{ headerShown: false }} />
						<Stack.Screen
							name="order-confirmation"
							options={{
								headerShown: false,
								gestureEnabled: false,
							}}
						/>
						<Stack.Screen
							name="notifications"
							options={{ headerShown: false }}
						/>
						<Stack.Screen
							name="settings/notification-preferences"
							options={{ headerShown: false }}
						/>
						<Stack.Screen name="support" options={{ headerShown: false }} />
						<Stack.Screen
							name="settings/payment-methods"
							options={{ headerShown: false }}
						/>
						<Stack.Screen
							name="settings/promo"
							options={{ headerShown: false }}
						/>
						<Stack.Screen
							name="settings/my-reviews"
							options={{ headerShown: false }}
						/>
						<Stack.Screen
							name="settings/change-password"
							options={{ headerShown: false }}
						/>
					</Stack>
					<StatusBar style="dark" />
				</AuthGuard>
			)}
		</QueryClientProvider>
	);
}
