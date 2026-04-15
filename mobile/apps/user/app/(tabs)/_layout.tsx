import { Tabs } from "expo-router";
import { Text, StyleSheet, View } from "react-native";

type TabIconProps = {
	icon: string;
	color: string;
	focused: boolean;
};

function TabIcon({ icon, color }: TabIconProps) {
	return <Text style={[styles.icon, { color }]}>{icon}</Text>;
}

export default function TabsLayout() {
	return (
		<Tabs
			screenOptions={{
				tabBarActiveTintColor: "#2F8F4E",
				tabBarInactiveTintColor: "#9CA3AF",
				tabBarStyle: styles.tabBar,
				tabBarLabelStyle: styles.tabLabel,
				headerStyle: styles.header,
				headerTitleStyle: styles.headerTitle,
				headerShadowVisible: false,
			}}>
			<Tabs.Screen
				name="index"
				options={{
					title: "Home",
					headerShown: false,
					tabBarIcon: ({ color, focused }) => (
						<TabIcon icon="🏠" color={color} focused={focused} />
					),
				}}
			/>
			<Tabs.Screen
				name="services"
				options={{
					title: "Services",
					headerShown: false,
					tabBarIcon: ({ color, focused }) => (
						<TabIcon icon="🧭" color={color} focused={focused} />
					),
				}}
			/>
			<Tabs.Screen name="activity" options={{ href: null }} />
			<Tabs.Screen
				name="wallet"
				options={{
					title: "Wallet",
					tabBarIcon: ({ color, focused }) => (
						<TabIcon icon="💳" color={color} focused={focused} />
					),
				}}
			/>
			<Tabs.Screen
				name="profile"
				options={{
					title: "Profile",
					tabBarIcon: ({ color, focused }) => (
						<TabIcon icon="👤" color={color} focused={focused} />
					),
				}}
			/>
		</Tabs>
	);
}

const styles = StyleSheet.create({
	tabBar: {
		backgroundColor: "#FFFFFF",
		borderTopWidth: 1,
		borderTopColor: "#F3F4F6",
		paddingBottom: 4,
		paddingTop: 8,
		height: 88,
	},
	tabLabel: {
		fontSize: 12,
		fontWeight: "600",
	},
	icon: {
		fontSize: 22,
	},
	header: {
		backgroundColor: "#FFFFFF",
	},
	headerTitle: {
		fontSize: 18,
		fontWeight: "700",
		color: "#111827",
	},
});
