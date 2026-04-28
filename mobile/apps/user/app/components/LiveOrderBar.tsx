import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { getErrands } from "@runam/shared/api/errands";
import { useAuthStore } from "@runam/shared/stores/auth-store";
import type { Errand } from "@runam/shared/types";
import { colors, radii } from "../lib/design";

const ACTIVE_STATUSES = [
	"Pending",
	"PendingPayment",
	"Matched",
	"AcceptedByRider",
	"EnRouteToPickup",
	"ArrivedAtPickup",
	"Collected",
	"InTransit",
	"ArrivedAtDropoff",
];

const statusLabels: Record<string, string> = {
	Pending: "Finding rider",
	PendingPayment: "Awaiting payment",
	Matched: "Rider matched",
	AcceptedByRider: "Accepted",
	EnRouteToPickup: "Heading to pickup",
	ArrivedAtPickup: "At pickup",
	Collected: "Collected",
	InTransit: "On the way",
	ArrivedAtDropoff: "Arriving",
};

type LiveOrderBarProps = {
	bottomOffset?: number;
};

function getStatusIcon(status: string): keyof typeof Ionicons.glyphMap {
	if (status === "Pending" || status === "PendingPayment") {
		return "time-outline";
	}
	if (status === "Matched" || status === "AcceptedByRider") {
		return "person-outline";
	}
	if (status === "ArrivedAtDropoff") {
		return "flag-outline";
	}
	return "bicycle-outline";
}

export default function LiveOrderBar({ bottomOffset = 96 }: LiveOrderBarProps) {
	const router = useRouter();
	const { isAuthenticated } = useAuthStore();

	const { data } = useQuery({
		queryKey: ["live-order-bar", "active"],
		queryFn: () => getErrands({ page: 1, pageSize: 6 }),
		enabled: isAuthenticated,
		refetchInterval: 30000,
	});

	const active: Errand | null =
		data?.items.find((order) => ACTIVE_STATUSES.includes(order.status)) ?? null;

	if (!active) return null;

	const label = statusLabels[active.status] ?? active.status;
	const icon = getStatusIcon(active.status);

	return (
		<View
			style={[styles.wrap, { bottom: bottomOffset }]}
			pointerEvents="box-none">
			<TouchableOpacity
				style={styles.bar}
				activeOpacity={0.88}
				onPress={() =>
					router.push({
						pathname: "/errand/tracking",
						params: { id: active.id },
					})
				}>
				<View style={styles.iconWrap}>
					<Ionicons name={icon} size={18} color={colors.white} />
				</View>
				<View style={styles.copy}>
					<Text style={styles.title} numberOfLines={1}>
						{label}
					</Text>
					<Text style={styles.meta} numberOfLines={1}>
						#{active.trackingNumber} · Tap to track live
					</Text>
				</View>
				<Ionicons name="chevron-forward" size={18} color={colors.white} />
			</TouchableOpacity>
		</View>
	);
}

const styles = StyleSheet.create({
	wrap: {
		position: "absolute",
		left: 16,
		right: 16,
	},
	bar: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		backgroundColor: colors.brandAccent,
		paddingVertical: 12,
		paddingHorizontal: 14,
		borderRadius: radii.lg,
		shadowColor: "#000000",
		shadowOpacity: 0.18,
		shadowOffset: { width: 0, height: 6 },
		shadowRadius: 12,
		elevation: 5,
	},
	iconWrap: {
		width: 36,
		height: 36,
		borderRadius: 18,
		backgroundColor: "rgba(255,255,255,0.18)",
		alignItems: "center",
		justifyContent: "center",
	},
	copy: {
		flex: 1,
	},
	title: {
		fontSize: 14,
		fontWeight: "800",
		color: colors.white,
		letterSpacing: -0.2,
	},
	meta: {
		fontSize: 12,
		color: "rgba(255,255,255,0.85)",
		marginTop: 2,
	},
});
