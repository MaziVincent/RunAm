import { useState, useEffect, useCallback, useRef } from "react";
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	ActivityIndicator,
	Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getErrandById } from "@runam/shared/api/errands";
import { updateTaskStatus } from "@runam/shared/api/rider";

interface ActiveErrand {
	id: string;
	status: string;
	pickupAddress: string;
	dropoffAddress: string;
	customerName: string;
	totalAmount: number;
	currency: string;
	vendorId?: string;
	vendorName?: string;
	vendorAddress?: string;
	vendorPhone?: string;
	vendorOrderStatus?: string;
	orderItems?: {
		id: string;
		productName: string;
		quantity: number;
		unitPrice: number;
		totalPrice: number;
		status: string;
	}[];
}

const statusFlow = [
	"AcceptedByRider",
	"EnRouteToPickup",
	"ArrivedAtPickup",
	"Collected",
	"InTransit",
	"ArrivedAtDropoff",
	"Delivered",
];

const statusLabels: Record<string, string> = {
	AcceptedByRider: "Accepted",
	EnRouteToPickup: "Heading to pickup",
	ArrivedAtPickup: "At pickup",
	Collected: "Package collected",
	InTransit: "In transit",
	ArrivedAtDropoff: "At dropoff",
	Delivered: "Delivered",
};

export default function RiderActiveErrandScreen() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const router = useRouter();
	const queryClient = useQueryClient();

	const { data: errandData, isLoading } = useQuery<ActiveErrand>({
		queryKey: ["rider-errand", id],
		queryFn: () => getErrandById(id!) as unknown as Promise<ActiveErrand>,
		refetchInterval: 15000,
	});

	const currentStatusIdx = statusFlow.indexOf(errandData?.status ?? "");

	const updateStatusMutation = useMutation({
		mutationFn: (newStatus: string) =>
			updateTaskStatus(id!, { status: newStatus }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["rider-errand", id] });
		},
		onError: (err: Error) => {
			Alert.alert("Error", err.message);
		},
	});

	const handleNextStatus = () => {
		if (currentStatusIdx < 0 || currentStatusIdx >= statusFlow.length - 1)
			return;
		const nextStatus = statusFlow[currentStatusIdx + 1];
		Alert.alert("Update Status", `Mark as "${statusLabels[nextStatus]}"?`, [
			{ text: "Cancel", style: "cancel" },
			{
				text: "Confirm",
				onPress: () => updateStatusMutation.mutate(nextStatus),
			},
		]);
	};

	if (isLoading) {
		return (
			<View style={styles.centered}>
				<ActivityIndicator size="large" color="#2F8F4E" />
			</View>
		);
	}

	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			{/* Map placeholder */}
			<View style={styles.mapArea}>
				<View style={styles.mapPlaceholder}>
					<Text style={styles.mapIcon}>🗺️</Text>
					<Text style={styles.mapLabel}>Live Navigation</Text>
				</View>
			</View>

			{/* Status / Action panel */}
			<View style={styles.panel}>
				{/* Status bar */}
				<View style={styles.statusBar}>
					{statusFlow.map((status, idx) => (
						<View key={status} style={styles.statusStep}>
							<View
								style={[
									styles.stepDot,
									idx <= currentStatusIdx
										? styles.stepDotActive
										: styles.stepDotInactive,
								]}
							/>
							{idx < statusFlow.length - 1 && (
								<View
									style={[
										styles.stepLine,
										idx < currentStatusIdx
											? styles.stepLineActive
											: styles.stepLineInactive,
									]}
								/>
							)}
						</View>
					))}
				</View>

				<Text style={styles.currentStatus}>
					{statusLabels[errandData?.status ?? ""] ?? errandData?.status}
				</Text>

				{/* Errand Info */}
				<View style={styles.errandInfo}>
					<View style={styles.infoRow}>
						<Text style={styles.infoIcon}>📦</Text>
						<Text style={styles.infoText} numberOfLines={1}>
							{errandData?.pickupAddress ?? "N/A"}
						</Text>
					</View>
					<View style={styles.infoRow}>
						<Text style={styles.infoIcon}>📍</Text>
						<Text style={styles.infoText} numberOfLines={1}>
							{errandData?.dropoffAddress ?? "N/A"}
						</Text>
					</View>
					<View style={styles.infoRow}>
						<Text style={styles.infoIcon}>💰</Text>
						<Text style={styles.infoText}>
							{errandData?.currency ?? "NGN"}{" "}
							{(errandData?.totalAmount ?? 0).toLocaleString()}
						</Text>
					</View>
				</View>

				{/* Vendor Info (marketplace orders) */}
				{errandData?.vendorId && (
					<View style={styles.vendorSection}>
						<View style={styles.vendorHeader}>
							<Text style={styles.vendorIcon}>🏪</Text>
							<Text style={styles.vendorName}>
								{errandData.vendorName ?? "Vendor"}
							</Text>
							{errandData.vendorOrderStatus && (
								<View style={styles.vendorStatusBadge}>
									<Text style={styles.vendorStatusText}>
										{errandData.vendorOrderStatus}
									</Text>
								</View>
							)}
						</View>
						{errandData.vendorAddress && (
							<View style={styles.infoRow}>
								<Text style={styles.infoIcon}>📍</Text>
								<Text style={styles.infoText} numberOfLines={1}>
									{errandData.vendorAddress}
								</Text>
							</View>
						)}
						{errandData.vendorPhone && (
							<View style={styles.infoRow}>
								<Text style={styles.infoIcon}>📞</Text>
								<Text style={styles.infoText}>{errandData.vendorPhone}</Text>
							</View>
						)}
						{errandData.orderItems && errandData.orderItems.length > 0 && (
							<View style={styles.orderItemsList}>
								<Text style={styles.orderItemsTitle}>
									Order Items ({errandData.orderItems.length})
								</Text>
								{errandData.orderItems.map((oi) => (
									<View key={oi.id} style={styles.orderItemRow}>
										<Text style={styles.orderItemName} numberOfLines={1}>
											{oi.quantity}× {oi.productName}
										</Text>
										<Text style={styles.orderItemPrice}>
											₦{oi.totalPrice.toLocaleString()}
										</Text>
									</View>
								))}
							</View>
						)}
					</View>
				)}

				{/* Actions */}
				<View style={styles.actions}>
					<TouchableOpacity
						style={styles.chatBtn}
						onPress={() => router.push(`/errand/chat?id=${id}` as never)}>
						<Text style={styles.chatBtnText}>💬 Chat</Text>
					</TouchableOpacity>

					{currentStatusIdx >= 0 &&
						currentStatusIdx < statusFlow.length - 1 && (
							<TouchableOpacity
								style={styles.nextBtn}
								onPress={handleNextStatus}
								disabled={updateStatusMutation.isPending}>
								<Text style={styles.nextBtnText}>
									{updateStatusMutation.isPending
										? "Updating..."
										: `→ ${statusLabels[statusFlow[currentStatusIdx + 1]]}`}
								</Text>
							</TouchableOpacity>
						)}
				</View>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: "#F8FAFC" },
	centered: { flex: 1, justifyContent: "center", alignItems: "center" },
	mapArea: { flex: 1 },
	mapPlaceholder: {
		flex: 1,
		backgroundColor: "#E2E8F0",
		justifyContent: "center",
		alignItems: "center",
	},
	mapIcon: { fontSize: 48 },
	mapLabel: { fontSize: 16, color: "#64748B", marginTop: 8 },
	panel: {
		backgroundColor: "#FFFFFF",
		borderTopLeftRadius: 24,
		borderTopRightRadius: 24,
		padding: 20,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: -4 },
		shadowOpacity: 0.1,
		shadowRadius: 12,
		elevation: 8,
	},
	statusBar: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 12,
	},
	statusStep: { flexDirection: "row", alignItems: "center" },
	stepDot: { width: 10, height: 10, borderRadius: 5 },
	stepDotActive: { backgroundColor: "#2F8F4E" },
	stepDotInactive: { backgroundColor: "#CBD5E1" },
	stepLine: { width: 28, height: 2, marginHorizontal: 2 },
	stepLineActive: { backgroundColor: "#2F8F4E" },
	stepLineInactive: { backgroundColor: "#CBD5E1" },
	currentStatus: {
		fontSize: 20,
		fontWeight: "700",
		color: "#1E293B",
		textAlign: "center",
		marginBottom: 16,
	},
	errandInfo: {
		backgroundColor: "#F8FAFC",
		borderRadius: 12,
		padding: 14,
		marginBottom: 16,
		gap: 10,
	},
	infoRow: { flexDirection: "row", alignItems: "center" },
	infoIcon: { fontSize: 16, marginRight: 10, width: 24, textAlign: "center" },
	infoText: { fontSize: 14, color: "#334155", flex: 1 },
	actions: { flexDirection: "row", gap: 12 },
	chatBtn: {
		flex: 1,
		backgroundColor: "#F1F5F9",
		borderRadius: 14,
		paddingVertical: 14,
		alignItems: "center",
	},
	chatBtnText: { fontSize: 15, fontWeight: "600", color: "#1E293B" },
	nextBtn: {
		flex: 2,
		backgroundColor: "#2F8F4E",
		borderRadius: 14,
		paddingVertical: 14,
		alignItems: "center",
	},
	nextBtnText: { fontSize: 15, fontWeight: "600", color: "#FFFFFF" },
	vendorSection: {
		backgroundColor: "#FFFBEB",
		borderRadius: 12,
		padding: 14,
		marginBottom: 16,
		gap: 8,
		borderWidth: 1,
		borderColor: "#FDE68A",
	},
	vendorHeader: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		marginBottom: 4,
	},
	vendorIcon: { fontSize: 18 },
	vendorName: { fontSize: 15, fontWeight: "700", color: "#92400E", flex: 1 },
	vendorStatusBadge: {
		backgroundColor: "#FDE68A",
		paddingHorizontal: 8,
		paddingVertical: 3,
		borderRadius: 8,
	},
	vendorStatusText: { fontSize: 11, fontWeight: "600", color: "#92400E" },
	orderItemsList: { marginTop: 8 },
	orderItemsTitle: {
		fontSize: 13,
		fontWeight: "700",
		color: "#92400E",
		marginBottom: 6,
	},
	orderItemRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		paddingVertical: 3,
	},
	orderItemName: { fontSize: 13, color: "#78350F", flex: 1 },
	orderItemPrice: {
		fontSize: 13,
		fontWeight: "600",
		color: "#78350F",
		marginLeft: 8,
	},
});
