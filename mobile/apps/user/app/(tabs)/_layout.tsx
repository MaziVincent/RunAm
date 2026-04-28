import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Platform, StyleSheet } from "react-native";
import { colors } from "../lib/design";

type TabIconProps = {
	activeIcon: keyof typeof Ionicons.glyphMap;
	inactiveIcon: keyof typeof Ionicons.glyphMap;
	color: string;
	focused: boolean;
};

function TabIcon({ activeIcon, inactiveIcon, color, focused }: TabIconProps) {
	return (
		<Ionicons
			name={focused ? activeIcon : inactiveIcon}
			size={22}
			color={color}
		/>
	);
}

export default function TabsLayout() {
	return (
		<Tabs
			screenOptions={{
				tabBarActiveTintColor: colors.brandAccent,
				tabBarInactiveTintColor: colors.brandTabInactive,
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
						<TabIcon
							activeIcon="home"
							inactiveIcon="home-outline"
							color={color}
							focused={focused}
						/>
					),
				}}
			/>
			<Tabs.Screen
				name="services"
				options={{
					title: "Explore",
					headerShown: false,
					tabBarIcon: ({ color, focused }) => (
						<TabIcon
							activeIcon="compass"
							inactiveIcon="compass-outline"
							color={color}
							focused={focused}
						/>
					),
				}}
			/>
			<Tabs.Screen
				name="activity"
				options={{
					title: "Orders",
					headerShown: false,
					tabBarIcon: ({ color, focused }) => (
						<TabIcon
							activeIcon="receipt"
							inactiveIcon="receipt-outline"
							color={color}
							focused={focused}
						/>
					),
				}}
			/>
			<Tabs.Screen
				name="wallet"
				options={{
					title: "Wallet",
					headerShown: false,
					tabBarIcon: ({ color, focused }) => (
						<TabIcon
							activeIcon="wallet"
							inactiveIcon="wallet-outline"
							color={color}
							focused={focused}
						/>
					),
				}}
			/>
			<Tabs.Screen
				name="profile"
				options={{
					title: "Account",
					tabBarIcon: ({ color, focused }) => (
						<TabIcon
							activeIcon="person"
							inactiveIcon="person-outline"
							color={color}
							focused={focused}
						/>
					),
				}}
			/>
		</Tabs>
	);
}

const styles = StyleSheet.create({
	tabBar: {
		backgroundColor: colors.surface,
		borderTopWidth: 1,
		borderTopColor: "#F3F4F6",
		...Platform.select({
			ios: {
				paddingBottom: 4,
				paddingTop: 8,
				height: 88,
			},
			android: {
				paddingBottom: 6,
				paddingTop: 6,
				height: 64,
			},
			default: {
				paddingBottom: 6,
				paddingTop: 6,
				height: 70,
			},
		}),
	},
	tabLabel: {
		fontSize: 12,
		fontWeight: "600",
	},
	header: {
		backgroundColor: colors.surface,
	},
	headerTitle: {
		fontSize: 18,
		fontWeight: "700",
		color: colors.textPrimary,
	},
});
