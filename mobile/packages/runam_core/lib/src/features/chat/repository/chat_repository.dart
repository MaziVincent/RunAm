import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../api/api_client.dart';
import '../models/chat_models.dart';

final chatRepositoryProvider = Provider<ChatRepository>((ref) {
  final dio = ref.watch(dioProvider);
  return ChatRepository(dio);
});

class ChatRepository {
  final Dio _dio;

  ChatRepository(this._dio);

  Future<List<ChatMessageDto>> getMessages(String errandId) async {
    final response = await _dio.get('errands/$errandId/messages');
    final data = response.data['data'] as List;
    return data.map((json) => ChatMessageDto.fromJson(json)).toList();
  }

  Future<ChatMessageDto> sendMessage(String errandId, SendMessageRequest request) async {
    final response = await _dio.post('errands/$errandId/messages', data: request.toJson());
    return ChatMessageDto.fromJson(response.data['data']);
  }
}
