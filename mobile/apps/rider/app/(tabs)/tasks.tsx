import { useState, useCallback } from "react";
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	TouchableOpacity,
	RefreshControl,
	Alert,
	ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
	getActiveTasks,
	updateTaskStatus as updateTaskStatusApi,
} from "@runam/shared/api/rider";
import type { Errand, ErrandStatus } from "@runam/shared/types";

type RiderAction =
	| "EnRouteToPickup"
	| "ArrivedAtPickup"
	| "Collected"
	| "InTransit"
	| "ArrivedAtDropoff"
	| "Delivered";

interface StatusStep {
	status: RiderAction;
	label: string;
	icon: string;
}

const statusFlow: StatusStep[] = [
	{ status: "EnRouteToPickup", label: "En Route to Pickup", icon: "🚗" },
	{ status: "ArrivedAtPickup", label: "Arrived at Pickup", icon: "📍" },
	{ status: "Collected", label: "Package Collected", icon: "📦" },
	{ status: "InTransit", label: "In Transit", icon: "🛣️" },
	{ status: "ArrivedAtDropoff", label: "Arrived at Dropoff", icon: "🏁" },
	{ status: "Delivered", label: "Delivered", icon: "✅" },
];

function getNextAction(currentStatus: ErrandStatus): RiderAction | null {
	const flow: Record<string, RiderAction> = {
		AcceptedByRider: "EnRouteToPickup",
		EnRouteToPickup: "ArrivedAtPickup",
		ArrivedAtPickup: "Collected",
		Collected: "InTransit",
		InTransit: "ArrivedAtDropoff",
		ArrivedAtDropoff: "Delivered",
	};
	return flow[currentStatus] || null;
}

function getNextActionLabel(currentStatus: ErrandStatus): string {
	const labels: Record<string, string> = {
		AcceptedByRider: "Start Route to Pickup",
		EnRouteToPickup: "Confirm Arrival at Pickup",
		ArrivedAtPickup: "Confirm Package Collected",
		Collected: "Start Delivery",
		InTransit: "Confirm Arrival at Dropoff",
		ArrivedAtDropoff: "Mark as Delivered",
	};
	return labels[currentStatus] || "Update Status";
}

export default function ActiveTasksScreen() {
	const queryClient = useQueryClient();
	const [refreshing, setRefreshing] = useState(false);

	const {
		data: activeTasks,
		refetch,
		isLoading,
	} = useQuery<Errand[]>({
		queryKey: ["rider", "active-tasks"],
		queryFn: () => getActiveTasks(),
	});

	const updateStatus = useMutation({
		mutationFn: ({
			errandId,
			status,
		}: {
			errandId: string;
			status: RiderAction;
		}) => updateTaskStatusApi(errandId, { status }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["rider"] });
		},
		onError: (error: any) => {
			Alert.alert("Error", error?.message || "Failed to update status");
		},
	});

	const onRefresh = useCallback(async () => {
		setRefreshing(true);
		await refetch();
		setRefreshing(false);
	}, [refetch]);

	const handleStatusUpdate = (errand: Errand) => {
		const nextAction = getNextAction(errand.status);
		if (!nextAction) return;

		const label = getNextActionLabel(errand.status);
		Alert.alert("Update Status", `Are you sure you want to: ${label}?`, [
			{ text: "Cancel", style: "cancel" },
			{
				text: "Confirm",
				onPress: () =>
					updateStatus.mutate({ errandId: errand.id, status: nextAction }),
			},
		]);
	};

	const currentStepIndex = (status: ErrandStatus): number => {
		return statusFlow.findIndex((s) => s.status === status);
	};

	if (isLoading) {
		return (
			<View style={styles.centered}>
				<ActivityIndicator size="large" color="#3B82F6" />
			</View>
		);
	}

	const activeTask = activeTasks?.[0];

	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<ScrollView
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={onRefresh}
						tintColor="#3B82F6"
					/>
				}>
				{activeTask ? (
					<>
						{/* Task Info */}
						<View style={styles.taskHeader}>
							<Text style={styles.trackingNumber}>
								#{activeTask.trackingNumber}
							</Text>
							<Text style={styles.category}>{activeTask.category}</Text>
						</View>

						{/* Route Info */}
						<View style={styles.routeCard}>
							{activeTask.stops?.map((stop, idx) => (
								<View key={stop.id} style={styles.stopRow}>
									<View
										style={[
											styles.stopDot,
											{
												backgroundColor:
													stop.stopType === "Pickup" ? "#3B82F6" : "#10B981",
											},
										]}
									/>
									<View style={styles.stopInfo}>
										<Text style={styles.stopType}>{stop.stopType}</Text>
										<Text style={styles.stopAddress}>{stop.address}</Text>
										{stop.contactName && (
											<Text style={styles.stopContact}>
												{stop.contactName} • {stop.contactPhone}
											</Text>
										)}
										{stop.instructions && (
											<Text style={styles.stopInstructions}>
												📝 {stop.instructions}
											</Text>
										)}
									</View>
								</View>
							))}
						</View>

						{/* Status Progress */}
						<View style={styles.progressCard}>
							<Text style={styles.progressTitle}>Delivery Progress</Text>
							{statusFlow.map((step, idx) => {
								const stepIdx = currentStepIndex(activeTask.status);
								const isCompleted = idx <= stepIdx;
								const isCurrent = idx === stepIdx;

								return (
									<View key={step.status} style={styles.progressRow}>
										<View style={styles.progressLineContainer}>
											<View
												style={[
													styles.progressDot,
													isCompleted && styles.progressDotCompleted,
													isCurrent && styles.progressDotCurrent,
												]}>
												<Text style={styles.progressDotIcon}>
													{isCompleted ? "✓" : step.icon}
												</Text>
											</View>
											{idx < statusFlow.length - 1 && (
												<View
													style={[
														styles.progressLine,
														isCompleted && styles.progressLineCompleted,
													]}
												/>
											)}
										</View>
										<Text
											style={[
												styles.progressLabel,
												isCompleted && styles.progressLabelCompleted,
												isCurrent && styles.progressLabelCurrent,
											]}>
											{step.label}
										</Text>
									</View>
								);
							})}
						</View>

						{/* Action Button */}
						{getNextAction(activeTask.status) && (
							<TouchableOpacity
								style={[
									styles.actionButton,
									updateStatus.isPending && styles.buttonDisabled,
								]}
								onPress={() => handleStatusUpdate(activeTask)}
								disabled={updateStatus.isPending}
								activeOpacity={0.8}>
								{updateStatus.isPending ? (
									<ActivityIndicator color="#FFFFFF" />
								) : (
									<Text style={styles.actionButtonText}>
										{getNextActionLabel(activeTask.status)}
									</Text>
								)}
							</TouchableOpacity>
						)}

						{/* Price */}
						<View style={styles.priceRow}>
							<Text style={styles.priceLabel}>Estimated Earnings</Text>
							<Text style={styles.priceValue}>
								{activeTask.currency}{" "}
								{activeTask.estimatedPrice.toLocaleString()}
							</Text>
						</View>
					</>
				) : (
					<View style={styles.emptyState}>
						<Text style={styles.emptyIcon}>📋</Text>
						<Text style={styles.emptyTitle}>No active tasks</Text>
						<Text style={styles.emptySubtitle}>
							Accept a task from the Home tab to get started
						</Text>
					</View>
				)}
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#F9FAFB",
	},
	centered: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "#F9FAFB",
	},
	content: {
		padding: 20,
		paddingBottom: 40,
	},
	taskHeader: {
		marginBottom: 20,
	},
	trackingNumber: {
		fontSize: 22,
		fontWeight: "800",
		color: "#111827",
	},
	category: {
		fontSize: 14,
		color: "#6B7280",
		marginTop: 4,
	},
	routeCard: {
		backgroundColor: "#FFFFFF",
		borderRadius: 14,
		padding: 18,
		marginBottom: 20,
		borderWidth: 1,
		borderColor: "#F3F4F6",
		gap: 20,
	},
	stopRow: {
		flexDirection: "row",
		gap: 14,
	},
	stopDot: {
		width: 12,
		height: 12,
		borderRadius: 6,
		marginTop: 4,
	},
	stopInfo: {
		flex: 1,
	},
	stopType: {
		fontSize: 12,
		fontWeight: "700",
		color: "#6B7280",
		textTransform: "uppercase",
		letterSpacing: 1,
		marginBottom: 4,
	},
	stopAddress: {
		fontSize: 15,
		fontWeight: "600",
		color: "#111827",
	},
	stopContact: {
		fontSize: 13,
		color: "#6B7280",
		marginTop: 4,
	},
	stopInstructions: {
		fontSize: 13,
		color: "#F59E0B",
		marginTop: 4,
		fontStyle: "italic",
	},
	progressCard: {
		backgroundColor: "#FFFFFF",
		borderRadius: 14,
		padding: 18,
		marginBottom: 20,
		borderWidth: 1,
		borderColor: "#F3F4F6",
	},
	progressTitle: {
		fontSize: 16,
		fontWeight: "700",
		color: "#111827",
		marginBottom: 16,
	},
	progressRow: {
		flexDirection: "row",
		alignItems: "flex-start",
		gap: 14,
	},
	progressLineContainer: {
		alignItems: "center",
		width: 28,
	},
	progressDot: {
		width: 28,
		height: 28,
		borderRadius: 14,
		backgroundColor: "#F3F4F6",
		alignItems: "center",
		justifyContent: "center",
	},
	progressDotCompleted: {
		backgroundColor: "#D1FAE5",
	},
	progressDotCurrent: {
		backgroundColor: "#DBEAFE",
		borderWidth: 2,
		borderColor: "#3B82F6",
	},
	progressDotIcon: {
		fontSize: 12,
	},
	progressLine: {
		width: 2,
		height: 24,
		backgroundColor: "#F3F4F6",
	},
	progressLineCompleted: {
		backgroundColor: "#10B981",
	},
	progressLabel: {
		fontSize: 14,
		color: "#9CA3AF",
		fontWeight: "500",
		paddingTop: 4,
	},
	progressLabelCompleted: {
		color: "#10B981",
	},
	progressLabelCurrent: {
		color: "#3B82F6",
		fontWeight: "700",
	},
	actionButton: {
		backgroundColor: "#3B82F6",
		borderRadius: 14,
		paddingVertical: 18,
		alignItems: "center",
		marginBottom: 20,
	},
	buttonDisabled: {
		opacity: 0.6,
	},
	actionButtonText: {
		fontSize: 17,
		fontWeight: "700",
		color: "#FFFFFF",
	},
	priceRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		backgroundColor: "#FFFFFF",
		borderRadius: 12,
		padding: 16,
		borderWidth: 1,
		borderColor: "#F3F4F6",
	},
	priceLabel: {
		fontSize: 14,
		color: "#6B7280",
		fontWeight: "500",
	},
	priceValue: {
		fontSize: 20,
		fontWeight: "800",
		color: "#10B981",
	},
	emptyState: {
		alignItems: "center",
		paddingTop: 100,
	},
	emptyIcon: {
		fontSize: 56,
		marginBottom: 16,
	},
	emptyTitle: {
		fontSize: 18,
		fontWeight: "600",
		color: "#374151",
	},
	emptySubtitle: {
		fontSize: 14,
		color: "#9CA3AF",
		marginTop: 6,
		textAlign: "center",
	},
});
