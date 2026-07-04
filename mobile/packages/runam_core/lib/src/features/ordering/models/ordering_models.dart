class CreateOrderItemRequest {
  final String productId;
  final int quantity;
  final String? notes;

  CreateOrderItemRequest({
    required this.productId,
    required this.quantity,
    this.notes,
  });

  Map<String, dynamic> toJson() {
    return {
      'productId': productId,
      'quantity': quantity,
      'notes': notes,
    };
  }
}

class CreateMarketplaceOrderRequest {
  final String vendorId;
  final String dropoffAddress;
  final double dropoffLatitude;
  final double dropoffLongitude;
  final int paymentMethod; // e.g., Wallet = 0, Card = 1
  final List<CreateOrderItemRequest> items;

  CreateMarketplaceOrderRequest({
    required this.vendorId,
    required this.dropoffAddress,
    required this.dropoffLatitude,
    required this.dropoffLongitude,
    required this.paymentMethod,
    required this.items,
  });

  Map<String, dynamic> toJson() {
    return {
      'vendorId': vendorId,
      'dropoffAddress': dropoffAddress,
      'dropoffLatitude': dropoffLatitude,
      'dropoffLongitude': dropoffLongitude,
      'paymentMethod': paymentMethod,
      'items': items.map((i) => i.toJson()).toList(),
    };
  }
}

class MarketplaceOrderResult {
  final Map<String, dynamic> errand;
  final String? checkoutUrl;

  MarketplaceOrderResult({
    required this.errand,
    this.checkoutUrl,
  });

  factory MarketplaceOrderResult.fromJson(Map<String, dynamic> json) {
    return MarketplaceOrderResult(
      errand: json['errand'] as Map<String, dynamic>,
      checkoutUrl: json['checkoutUrl'] as String?,
    );
  }
}
