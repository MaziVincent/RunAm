import {
	Image,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { ServiceCategory } from "@runam/shared/types";
import { colors, radii } from "../lib/design";

type CategoryTile = {
	id: string;
	title: string;
	icon: keyof typeof Ionicons.glyphMap;
	accent: string;
	onPress: () => void;
	imageUrl?: string | null;
};

type CategoryRailProps = {
	tiles: CategoryTile[];
};

export default function CategoryRail({ tiles }: CategoryRailProps) {
	return (
		<ScrollView
			horizontal
			showsHorizontalScrollIndicator={false}
			contentContainerStyle={styles.row}>
			{tiles.map((tile) => (
				<TouchableOpacity
					key={tile.id}
					style={styles.tile}
					onPress={tile.onPress}
					activeOpacity={0.85}>
					<View style={[styles.iconWrap, { backgroundColor: tile.accent }]}>
						{tile.imageUrl ? (
							<Image source={{ uri: tile.imageUrl }} style={styles.image} />
						) : (
							<Ionicons name={tile.icon} size={26} color={colors.brand} />
						)}
					</View>
					<Text style={styles.title} numberOfLines={2}>
						{tile.title}
					</Text>
				</TouchableOpacity>
			))}
		</ScrollView>
	);
}

export function buildVendorCategoryTiles(
	categories: ServiceCategory[],
	openCategory: (category: ServiceCategory) => void,
): CategoryTile[] {
	const palette = [
		"#FFE3D6",
		"#DDF3E7",
		"#E6E1FA",
		"#FBE5EE",
		"#E5F1FB",
		"#F5ECD8",
		"#E8F4D7",
	];
	const iconForName: Record<string, keyof typeof Ionicons.glyphMap> = {
		Food: "restaurant-outline",
		Restaurants: "restaurant-outline",
		Groceries: "basket-outline",
		Pharmacy: "medkit-outline",
		Drinks: "wine-outline",
		Markets: "storefront-outline",
		Snacks: "fast-food-outline",
	};

	return categories.map((category, index) => {
		const accent = palette[index % palette.length];
		const matchedKey = Object.keys(iconForName).find((key) =>
			category.name.toLowerCase().includes(key.toLowerCase()),
		);
		return {
			id: category.id,
			title: category.name,
			accent,
			icon: matchedKey ? iconForName[matchedKey] : "storefront-outline",
			imageUrl: category.iconUrl,
			onPress: () => openCategory(category),
		};
	});
}

const styles = StyleSheet.create({
	row: {
		gap: 14,
		paddingVertical: 4,
		paddingHorizontal: 2,
	},
	tile: {
		alignItems: "center",
		width: 78,
	},
	iconWrap: {
		width: 70,
		height: 70,
		borderRadius: radii.xl,
		alignItems: "center",
		justifyContent: "center",
		overflow: "hidden",
	},
	image: {
		width: 70,
		height: 70,
	},
	title: {
		fontSize: 12,
		fontWeight: "700",
		color: colors.textPrimary,
		marginTop: 8,
		textAlign: "center",
	},
});
