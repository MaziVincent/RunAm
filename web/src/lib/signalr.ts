import * as signalR from "@microsoft/signalr";
import { useAuthStore } from "@/lib/stores/auth-store";

const HUB_BASE_URL =
	process.env.NEXT_PUBLIC_HUB_URL ?? "http://localhost:5001/hubs";

function getToken(): string | null {
	if (typeof window === "undefined") return null;
	return useAuthStore.getState().token;
}

function createConnection(hubPath: string): signalR.HubConnection {
	return new signalR.HubConnectionBuilder()
		.withUrl(`${HUB_BASE_URL}${hubPath}`, {
			accessTokenFactory: () => getToken() ?? "",
		})
		.withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
		.configureLogging(signalR.LogLevel.Warning)
		.build();
}

// Singleton connections
let trackingConnection: signalR.HubConnection | null = null;
let chatConnection: signalR.HubConnection | null = null;
let notificationConnection: signalR.HubConnection | null = null;
let adminConnection: signalR.HubConnection | null = null;

export async function getTrackingConnection(): Promise<signalR.HubConnection> {
	if (!trackingConnection) {
		trackingConnection = createConnection("/tracking");
	}
	if (trackingConnection.state === signalR.HubConnectionState.Disconnected) {
		await trackingConnection.start();
	}
	return trackingConnection;
}

export async function getChatConnection(): Promise<signalR.HubConnection> {
	if (!chatConnection) {
		chatConnection = createConnection("/chat");
	}
	if (chatConnection.state === signalR.HubConnectionState.Disconnected) {
		await chatConnection.start();
	}
	return chatConnection;
}

export async function getNotificationConnection(): Promise<signalR.HubConnection> {
	if (!notificationConnection) {
		notificationConnection = createConnection("/notifications");
	}
	if (
		notificationConnection.state === signalR.HubConnectionState.Disconnected
	) {
		await notificationConnection.start();
	}
	return notificationConnection;
}

export async function getAdminConnection(): Promise<signalR.HubConnection> {
	if (!adminConnection) {
		adminConnection = createConnection("/admin");
	}
	if (adminConnection.state === signalR.HubConnectionState.Disconnected) {
		await adminConnection.start();
	}
	return adminConnection;
}

export async function stopAllConnections(): Promise<void> {
	const connections = [
		trackingConnection,
		chatConnection,
		notificationConnection,
		adminConnection,
	];
	await Promise.allSettled(connections.filter(Boolean).map((c) => c!.stop()));
	trackingConnection = null;
	chatConnection = null;
	notificationConnection = null;
	adminConnection = null;
}
