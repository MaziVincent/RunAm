import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/chat_models.dart';
import '../repository/chat_repository.dart';
import '../services/signalr_service.dart';

final chatProvider = Provider.family<ChatNotifier, String>((ref, errandId) {
  final notifier = ChatNotifier(
    errandId: errandId,
    repository: ref.watch(chatRepositoryProvider),
    signalRService: ref.watch(signalRServiceProvider),
  );
  ref.onDispose(() => notifier.dispose());
  return notifier;
});

class ChatNotifier extends ChangeNotifier {
  final String _errandId;
  final ChatRepository _repository;
  final SignalRService _signalRService;

  List<ChatMessageDto> messages = [];

  ChatNotifier({
    required String errandId,
    required ChatRepository repository,
    required SignalRService signalRService,
  })  : _errandId = errandId,
        _repository = repository,
        _signalRService = signalRService {
    _init();
  }

  Future<void> _init() async {
    try {
      messages = await _repository.getMessages(_errandId);
      notifyListeners();
    } catch (e) {
      // Handle error
    }

    final baseUrl = 'http://10.0.2.2:5000/hubs/chat';
    await _signalRService.connect(baseUrl);
    await _signalRService.joinErrandChat(_errandId);

    _signalRService.onNewMessage((args) {
      if (args != null && args.isNotEmpty) {
        final messageJson = args[0] as Map<String, dynamic>;
        final message = ChatMessageDto.fromJson(messageJson);
        messages = [...messages, message];
        notifyListeners();
      }
    });
  }

  Future<void> sendMessage(String text) async {
    try {
      final request = SendMessageRequest(text: text);
      await _repository.sendMessage(_errandId, request);
    } catch (e) {
      // Handle error
    }
  }

  @override
  void dispose() {
    _signalRService.leaveErrandChat(_errandId);
    _signalRService.disconnect();
    super.dispose();
  }
}
