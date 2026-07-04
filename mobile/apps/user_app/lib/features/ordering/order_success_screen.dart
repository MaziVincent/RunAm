import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:runam_ui/runam_ui.dart';

class OrderSuccessScreen extends StatelessWidget {
  const OrderSuccessScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.check_circle, size: 80, color: AppColors.brand500),
              const SizedBox(height: 24),
              const Text(
                'Order Placed!',
                style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 16),
              const Text(
                'Your order has been placed successfully. A rider will be assigned shortly.',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 16, color: AppColors.textSecondary),
              ),
              const SizedBox(height: 48),
              ElevatedButton(
                onPressed: () => context.go('/tracking'),
                child: const Text('Track Order / Back to Home'),
              )
            ],
          ),
        ),
      ),
    );
  }
}
