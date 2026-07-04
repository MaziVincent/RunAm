import 'package:signalr_netcore/signalr_client.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../auth/providers/auth_provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

final signalRServiceProvider = Provider<SignalRService>((ref) {
  return SignalRService(ref);
});

class SignalRService {
  HubConnection? _hubConnection;
  final Ref _ref;
  
  SignalRService(this._ref);

  Future<void> connect(String hubUrl) async {
    if (_hubConnection != null && _hubConnection!.state == HubConnectionState.Connected) {
      return;
    }

    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('access_token') ?? '';

    _hubConnection = HubConnectionBuilder()
        .withUrl(hubUrl, options: HttpConnectionOptions(
          accessTokenFactory: () async => token,
        ))
        .withAutomaticReconnect()
        .build();

    await _hubConnection!.start();
  }

  Future<void> joinErrandChat(String errandId) async {
    if (_hubConnection?.state == HubConnectionState.Connected) {
      await _hubConnection!.invoke("JoinErrandChat", args: [errandId]);
    }
  }

  Future<void> leaveErrandChat(String errandId) async {
    if (_hubConnection?.state == HubConnectionState.Connected) {
      await _hubConnection!.invoke("LeaveErrandChat", args: [errandId]);
    }
  }

  void onNewMessage(void Function(List<Object?>?) callback) {
    _hubConnection?.on("NewMessage", callback);
  }

  void onMessagesRead(void Function(List<Object?>?) callback) {
    _hubConnection?.on("MessagesRead", callback);
  }

  Future<void> disconnect() async {
    if (_hubConnection?.state == HubConnectionState.Connected) {
      await _hubConnection!.stop();
    }
  }
}
