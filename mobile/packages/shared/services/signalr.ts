import * as SignalR from "@microsoft/signalr";
import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "auth_token";

const BASE_URL = __DEV__ ? "http://localhost:5001" : "https://api.runam.com";

type ConnectionStatus =
	| "disconnected"
	| "connecting"
	| "connected"
	| "reconnecting";

class SignalRService {
	private connection: SignalR.HubConnection | null = null;
	private statusListeners: Set<(status: ConnectionStatus) => void> = new Set();
	private _status: ConnectionStatus = "disconnected";

	get status(): ConnectionStatus {
		return this._status;
	}

	private setStatus(status: ConnectionStatus) {
		this._status = status;
		this.statusListeners.forEach((fn) => fn(status));
	}

	onStatusChange(listener: (status: ConnectionStatus) => void) {
		this.statusListeners.add(listener);
		return () => {
			this.statusListeners.delete(listener);
		};
	}

	async connect(hubPath: string = "/hubs/tracking"): Promise<void> {
		if (this.connection?.state === SignalR.HubConnectionState.Connected) {
			return;
		}

		await this.disconnect();

		const token = await SecureStore.getItemAsync(TOKEN_KEY);
		if (!token) return;

		this.connection = new SignalR.HubConnectionBuilder()
			.withUrl(`${BASE_URL}${hubPath}`, {
				accessTokenFactory: () => token,
				transport:
					SignalR.HttpTransportType.WebSockets |
					SignalR.HttpTransportType.LongPolling,
			})
			.withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
			.configureLogging(SignalR.LogLevel.Warning)
			.build();

		this.connection.onreconnecting(() => this.setStatus("reconnecting"));
		this.connection.onreconnected(() => this.setStatus("connected"));
		this.connection.onclose(() => this.setStatus("disconnected"));

		try {
			this.setStatus("connecting");
			await this.connection.start();
			this.setStatus("connected");
		} catch (error) {
			this.setStatus("disconnected");
			console.warn("SignalR connection failed:", error);
		}
	}

	async disconnect(): Promise<void> {
		if (this.connection) {
			try {
				await this.connection.stop();
			} catch {
				// ignore
			}
			this.connection = null;
			this.setStatus("disconnected");
		}
	}

	on<T = any>(event: string, callback: (data: T) => void): void {
		this.connection?.on(event, callback);
	}

	off(event: string): void {
		this.connection?.off(event);
	}

	async invoke(method: string, ...args: any[]): Promise<any> {
		if (this.connection?.state === SignalR.HubConnectionState.Connected) {
			return this.connection.invoke(method, ...args);
		}
	}

	async send(method: string, ...args: any[]): Promise<void> {
		if (this.connection?.state === SignalR.HubConnectionState.Connected) {
			await this.connection.send(method, ...args);
		}
	}

	// ── Convenience: join an errand's tracking group ──
	async joinErrandGroup(errandId: string): Promise<void> {
		await this.invoke("JoinErrandGroup", errandId);
	}

	async leaveErrandGroup(errandId: string): Promise<void> {
		await this.invoke("LeaveErrandGroup", errandId);
	}

	// ── Convenience: send rider location ──
	async sendRiderLocation(
		lat: number,
		lng: number,
		heading: number | null,
		speed: number | null,
	): Promise<void> {
		await this.send("UpdateRiderLocation", {
			latitude: lat,
			longitude: lng,
			heading,
			speed,
		});
	}
}

export const signalRService = new SignalRService();
export default signalRService;
