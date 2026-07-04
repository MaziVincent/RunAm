import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:runam_ui/runam_ui.dart';

class RiderWalletScreen extends StatelessWidget {
  const RiderWalletScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Wallet'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: AppColors.textPrimary,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Available Balance', style: TextStyle(color: Colors.white70, fontSize: 16)),
                  const SizedBox(height: 8),
                  const Text('₦ 145,500.00', style: TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: () {
                      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Withdrawal requested!')));
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.brand500,
                      minimumSize: const Size(double.infinity, 48),
                    ),
                    child: const Text('Withdraw Funds'),
                  )
                ],
              ),
            ),
            const SizedBox(height: 32),
            const Text('Recent Transactions', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            _buildTransactionTile('Delivery #8472', '₦ 1,500', 'Today, 2:30 PM', true),
            _buildTransactionTile('Delivery #8471', '₦ 2,100', 'Today, 1:15 PM', true),
            _buildTransactionTile('Bank Withdrawal', '-₦ 50,000', 'Yesterday', false),
            _buildTransactionTile('Delivery #8460', '₦ 1,800', 'Yesterday', true),
          ],
        ),
      ),
    );
  }

  Widget _buildTransactionTile(String title, String amount, String date, bool isCredit) {
    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: CircleAvatar(
        backgroundColor: isCredit ? Colors.green.withOpacity(0.1) : Colors.red.withOpacity(0.1),
        child: Icon(
          isCredit ? Icons.arrow_downward : Icons.arrow_upward,
          color: isCredit ? Colors.green : Colors.red,
        ),
      ),
      title: Text(title, style: const TextStyle(fontWeight: FontWeight.bold)),
      subtitle: Text(date),
      trailing: Text(
        amount,
        style: TextStyle(
          fontWeight: FontWeight.bold,
          color: isCredit ? Colors.green : Colors.red,
          fontSize: 16,
        ),
      ),
    );
  }
}
