import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:runam_core/runam_core.dart';
import 'package:runam_ui/runam_ui.dart';

class CheckoutScreen extends ConsumerStatefulWidget {
  const CheckoutScreen({super.key});

  @override
  ConsumerState<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends ConsumerState<CheckoutScreen> {
  final _addressController = TextEditingController();
  bool _isLoading = false;

  void _submitOrder() async {
    final cart = ref.read(cartProvider);
    if (cart.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Cart is empty')));
      return;
    }

    if (_addressController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please enter a delivery address')));
      return;
    }

    setState(() => _isLoading = true);
    try {
      final request = CreateMarketplaceOrderRequest(
        vendorId: '00000000-0000-0000-0000-000000000000', // Mock Vendor ID
        dropoffAddress: _addressController.text,
        dropoffLatitude: 6.5244, // Mock Lagos coordinates
        dropoffLongitude: 3.3792,
        paymentMethod: 1, // Card / Paystack
        items: cart,
      );

      await ref.read(orderingRepositoryProvider).createMarketplaceOrder(request);
      ref.read(cartProvider.notifier).clear();
      
      if (mounted) {
        context.go('/order-success');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final cart = ref.watch(cartProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Checkout')),
      body: cart.isEmpty
          ? const Center(child: Text('Your cart is empty.'))
          : SingleChildScrollView(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Delivery Address', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _addressController,
                    decoration: const InputDecoration(
                      hintText: 'e.g. 10 Herbert Macaulay Way, Yaba',
                      prefixIcon: Icon(Icons.location_on_outlined),
                    ),
                  ),
                  const SizedBox(height: 32),
                  const Text('Order Summary', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 12),
                  ...cart.map((item) => ListTile(
                        contentPadding: EdgeInsets.zero,
                        title: Text('Product ID: ${item.productId.substring(0, 5)}...'),
                        trailing: Text('Qty: ${item.quantity}'),
                      )),
                  const SizedBox(height: 32),
                  ElevatedButton(
                    onPressed: _isLoading ? null : _submitOrder,
                    style: ElevatedButton.styleFrom(backgroundColor: AppColors.brand500),
                    child: _isLoading
                        ? const CircularProgressIndicator(color: Colors.white)
                        : const Text('Place Order'),
                  )
                ],
              ),
            ),
    );
  }
}
