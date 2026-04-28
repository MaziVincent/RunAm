import {
	Image,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
	type StyleProp,
	type ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { Vendor } from "@runam/shared/types";
import { colors, radii } from "../lib/design";

type VendorCardProps = {
	vendor: Vendor;
	onPress: () => void;
	style?: StyleProp<ViewStyle>;
	showDescription?: boolean;
	showBanner?: boolean;
	distanceKm?: number | null;
	rankingLabel?: string;
	tags?: string[];
};

function formatDistance(distanceKm?: number | null): string | null {
	if (distanceKm == null || Number.isNaN(distanceKm)) {
		return null;
	}

	if (distanceKm < 1) {
		return `${Math.round(distanceKm * 1000)} m`;
	}

	return `${distanceKm.toFixed(distanceKm < 10 ? 1 : 0)} km`;
}

export default function VendorCard({
	vendor,
	onPress,
	style,
	showDescription = true,
	showBanner = true,
	distanceKm,
	rankingLabel,
	tags,
}: VendorCardProps) {
	const distanceLabel = formatDistance(distanceKm);
	const displayTags =
		tags ?? vendor.serviceCategories.map((category) => category.name);
	const rankingCopy =
		rankingLabel ?? (vendor.rating >= 4.6 ? "Top rated nearby" : undefined);
	const isClosed = !vendor.isOpen;

	return (
		<TouchableOpacity
			style={[styles.card, style]}
			activeOpacity={0.85}
			onPress={onPress}>
			{showBanner ? (
				<View style={styles.bannerWrap}>
					{vendor.bannerUrl ? (
						<Image source={{ uri: vendor.bannerUrl }} style={styles.banner} />
					) : (
						<View style={styles.bannerFallback}>
							<Ionicons
								name="storefront-outline"
								size={28}
								color={colors.brandAccent}
							/>
						</View>
					)}

					{isClosed ? (
						<View style={styles.closedOverlay}>
							<Text style={styles.closedText}>Closed for now</Text>
						</View>
					) : null}

					<View style={styles.bannerLeftPills}>
						<View style={styles.timePill}>
							<Ionicons name="time-outline" size={12} color={colors.white} />
							<Text style={styles.timePillText}>
								{vendor.estimatedPrepTimeMinutes} min
							</Text>
						</View>
						{distanceLabel ? (
							<View style={styles.distancePill}>
								<Text style={styles.distancePillText}>{distanceLabel}</Text>
							</View>
						) : null}
					</View>

					<View style={styles.logoWrap}>
						{vendor.logoUrl ? (
							<Image source={{ uri: vendor.logoUrl }} style={styles.logo} />
						) : (
							<View style={styles.logoFallback}>
								<Ionicons
									name="storefront"
									size={18}
									color={colors.brandAccent}
								/>
							</View>
						)}
					</View>
				</View>
			) : null}

			<View style={styles.body}>
				<View style={styles.headerRow}>
					<Text style={styles.name} numberOfLines={1}>
						{vendor.businessName}
					</Text>
					<View style={styles.ratingChip}>
						<Ionicons name="star" size={12} color="#F4B400" />
						<Text style={styles.ratingText}>{vendor.rating.toFixed(1)}</Text>
					</View>
				</View>

				{rankingCopy ? (
					<View style={styles.rankingRow}>
						<Ionicons
							name="sparkles-outline"
							size={12}
							color={colors.brandAccent}
						/>
						<Text style={styles.rankingText}>{rankingCopy}</Text>
					</View>
				) : null}

				{showDescription && vendor.description ? (
					<Text style={styles.description} numberOfLines={1}>
						{vendor.description}
					</Text>
				) : null}

				{displayTags.length > 0 ? (
					<View style={styles.tagRow}>
						{displayTags.slice(0, 3).map((tag) => (
							<View key={tag} style={styles.tag}>
								<Text style={styles.tagText}>{tag}</Text>
							</View>
						))}
					</View>
				) : null}
			</View>
		</TouchableOpacity>
	);
}

const styles = StyleSheet.create({
	card: {
		backgroundColor: colors.surface,
		borderRadius: radii.xl,
		overflow: "hidden",
		borderWidth: 1,
		borderColor: colors.border,
	},
	bannerWrap: {
		position: "relative",
	},
	banner: {
		width: "100%",
		height: 130,
	},
	bannerFallback: {
		width: "100%",
		height: 130,
		backgroundColor: colors.brandSoft,
		alignItems: "center",
		justifyContent: "center",
	},
	closedOverlay: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: "rgba(20,32,19,0.55)",
		alignItems: "center",
		justifyContent: "center",
	},
	closedText: {
		fontSize: 13,
		fontWeight: "800",
		color: colors.white,
		letterSpacing: 0.4,
		textTransform: "uppercase",
	},
	bannerLeftPills: {
		position: "absolute",
		top: 10,
		left: 10,
		flexDirection: "row",
		gap: 6,
	},
	bannerRightPills: {
		position: "absolute",
		top: 10,
		right: 10,
		flexDirection: "row",
		gap: 6,
	},
	deliveryPill: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
		backgroundColor: "rgba(255,255,255,0.94)",
		paddingHorizontal: 8,
		paddingVertical: 5,
		borderRadius: 999,
	},
	deliveryPillText: {
		fontSize: 11,
		fontWeight: "800",
		color: colors.brand,
	},
	logoWrap: {
		position: "absolute",
		bottom: -22,
		right: 14,
	},
	logo: {
		width: 48,
		height: 48,
		borderRadius: 16,
		borderWidth: 3,
		borderColor: colors.surface,
		backgroundColor: colors.surface,
	},
	logoFallback: {
		width: 48,
		height: 48,
		borderRadius: 16,
		borderWidth: 3,
		borderColor: colors.surface,
		backgroundColor: colors.brandSoft,
		alignItems: "center",
		justifyContent: "center",
	},
	timePill: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
		backgroundColor: "rgba(20,32,19,0.78)",
		paddingHorizontal: 8,
		paddingVertical: 5,
		borderRadius: 999,
	},
	timePillText: {
		fontSize: 11,
		fontWeight: "800",
		color: colors.white,
	},
	distancePill: {
		backgroundColor: "rgba(20,32,19,0.78)",
		paddingHorizontal: 8,
		paddingVertical: 5,
		borderRadius: 999,
	},
	distancePillText: {
		fontSize: 11,
		fontWeight: "800",
		color: colors.white,
	},
	body: {
		paddingHorizontal: 14,
		paddingTop: 18,
		paddingBottom: 14,
	},
	headerRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: 8,
	},
	name: {
		flex: 1,
		fontSize: 16,
		fontWeight: "800",
		color: colors.textPrimary,
	},
	ratingChip: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
		backgroundColor: colors.background,
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 999,
	},
	ratingText: {
		fontSize: 12,
		fontWeight: "800",
		color: colors.textPrimary,
	},
	rankingRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
		marginTop: 5,
	},
	rankingText: {
		fontSize: 12,
		fontWeight: "800",
		color: colors.brandAccent,
	},
	description: {
		fontSize: 13,
		lineHeight: 18,
		color: colors.textSecondary,
		marginTop: 4,
	},
	tagRow: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 6,
		marginTop: 10,
	},
	tag: {
		backgroundColor: colors.brandSoft,
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 8,
	},
	tagText: {
		fontSize: 11,
		fontWeight: "700",
		color: colors.brandAccent,
	},
});
