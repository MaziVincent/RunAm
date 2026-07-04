import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/ordering_models.dart';

final cartProvider = NotifierProvider<CartNotifier, List<CreateOrderItemRequest>>(CartNotifier.new);

class CartNotifier extends Notifier<List<CreateOrderItemRequest>> {
  @override
  List<CreateOrderItemRequest> build() => [];

  void addItem(CreateOrderItemRequest item) {
    state = [...state, item];
  }

  void removeItem(String productId) {
    state = state.where((item) => item.productId != productId).toList();
  }

  void clear() {
    state = [];
  }
}
