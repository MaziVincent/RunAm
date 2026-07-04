import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../api/api_client.dart';
import '../models/ordering_models.dart';

final orderingRepositoryProvider = Provider<OrderingRepository>((ref) {
  final dio = ref.watch(dioProvider);
  return OrderingRepository(dio);
});

class OrderingRepository {
  final Dio _dio;

  OrderingRepository(this._dio);

  Future<MarketplaceOrderResult> createMarketplaceOrder(CreateMarketplaceOrderRequest request) async {
    try {
      final response = await _dio.post('errands/marketplace', data: request.toJson());
      return MarketplaceOrderResult.fromJson(response.data['data']);
    } catch (e) {
      if (e is DioException) {
        final message = e.response?.data?['message'] ?? e.message;
        throw Exception(message);
      }
      throw Exception(e.toString());
    }
  }
}
