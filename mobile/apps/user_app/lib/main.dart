import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:runam_ui/runam_ui.dart';
import 'package:go_router/go_router.dart';
import 'package:runam_core/runam_core.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'features/auth/login_screen.dart';
import 'features/auth/register_screen.dart';
import 'features/ordering/checkout_screen.dart';
import 'features/ordering/order_success_screen.dart';
import 'features/tracking/tracking_screen.dart';
import 'features/chat/chat_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final prefs = await SharedPreferences.getInstance();

  runApp(
    ProviderScope(
      overrides: [
        sharedPreferencesProvider.overrideWithValue(prefs),
      ],
      child: const RunAmUserApp(),
    ),
  );
}

CustomTransitionPage buildPageWithDefaultTransition<T>({
  required BuildContext context, 
  required GoRouterState state, 
  required Widget child,
}) {
  return CustomTransitionPage<T>(
    key: state.pageKey,
    child: child,
    transitionsBuilder: (context, animation, secondaryAnimation, child) => 
        FadeTransition(opacity: animation, child: child),
  );
}

final goRouterProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authStateProvider);

  return GoRouter(
    initialLocation: '/splash',
    redirect: (context, state) {
      if (state.matchedLocation == '/splash') return null;

      final hasSeenOnboarding = ref.read(onboardingProvider);
      
      if (!hasSeenOnboarding && state.matchedLocation != '/onboarding') {
        return '/onboarding';
      }
      if (!hasSeenOnboarding) return null;

      final isAuth = authState.user != null;
      final isLoggingIn = state.matchedLocation == '/login' || state.matchedLocation == '/register';

      if (!isAuth && !isLoggingIn) return '/login';
      if (isAuth && isLoggingIn) return '/';
      return null;
    },
    routes: [
      GoRoute(
        path: '/splash',
        pageBuilder: (context, state) => buildPageWithDefaultTransition(
          context: context,
          state: state,
          child: RunAmSplashScreen(
            onAnimationComplete: () => context.go('/'),
          ),
        ),
      ),
      GoRoute(
        path: '/onboarding',
        pageBuilder: (context, state) => buildPageWithDefaultTransition(
          context: context,
          state: state,
          child: OnboardingCarousel(
            onComplete: () {
              ref.read(onboardingProvider.notifier).completeOnboarding();
              context.go('/login');
            },
          ),
        ),
      ),
      GoRoute(
        path: '/',
        pageBuilder: (context, state) => buildPageWithDefaultTransition(
          context: context, state: state, child: const HomeScreen(),
        ),
      ),
      GoRoute(
        path: '/login',
        pageBuilder: (context, state) => buildPageWithDefaultTransition(
          context: context, state: state, child: const LoginScreen(),
        ),
      ),
      GoRoute(
        path: '/register',
        pageBuilder: (context, state) => buildPageWithDefaultTransition(
          context: context, state: state, child: const RegisterScreen(),
        ),
      ),
      GoRoute(
        path: '/checkout',
        pageBuilder: (context, state) => buildPageWithDefaultTransition(
          context: context, state: state, child: const CheckoutScreen(),
        ),
      ),
      GoRoute(
        path: '/order-success',
        pageBuilder: (context, state) => buildPageWithDefaultTransition(
          context: context, state: state, child: const OrderSuccessScreen(),
        ),
      ),
      GoRoute(
        path: '/tracking',
        pageBuilder: (context, state) => buildPageWithDefaultTransition(
          context: context, state: state, child: const TrackingScreen(orderId: 'mock-order-id'),
        ),
      ),
      GoRoute(
        path: '/chat/:errandId',
        pageBuilder: (context, state) {
          final errandId = state.pathParameters['errandId']!;
          return buildPageWithDefaultTransition(
            context: context, state: state, child: ChatScreen(errandId: errandId),
          );
        },
      ),
    ],
  );
});

class RunAmUserApp extends ConsumerWidget {
  const RunAmUserApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(goRouterProvider);
    return MaterialApp.router(
      title: 'RunAm User',
      theme: AppTheme.lightTheme,
      routerConfig: router,
      debugShowCheckedModeBanner: false,
    );
  }
}

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('RunAm'),
        leading: IconButton(
          icon: const Icon(Icons.menu),
          onPressed: () {},
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.shopping_bag_outlined),
            onPressed: () => context.go('/checkout'),
          )
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'What would you like to do today?',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 24),
            Row(
              children: [
                Expanded(
                  child: _CategoryCard(
                    title: 'Food Delivery',
                    icon: Icons.fastfood,
                    color: AppColors.brand500,
                    onTap: () {},
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: _CategoryCard(
                    title: 'Send Package',
                    icon: Icons.local_shipping,
                    color: AppColors.orange,
                    onTap: () {},
                  ),
                ),
              ],
            ),
            const SizedBox(height: 32),
            const Text(
              'Order Again',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              height: 140,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: 3,
                separatorBuilder: (context, index) => const SizedBox(width: 16),
                itemBuilder: (context, index) {
                  return Container(
                    width: 200,
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: const [
                        BoxShadow(
                          color: Colors.black12,
                          blurRadius: 10,
                          offset: Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Chicken Republic',
                          style: TextStyle(fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 4),
                        const Text(
                          'Refuel Meal',
                          style: TextStyle(color: AppColors.textSecondary),
                        ),
                        const Spacer(),
                        ElevatedButton(
                          onPressed: () {
                            ref.read(cartProvider.notifier).addItem(
                              CreateOrderItemRequest(
                                productId: '00000000-0000-0000-0000-000000000001',
                                quantity: 1,
                              ),
                            );
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Added to cart!')),
                            );
                          },
                          style: ElevatedButton.styleFrom(
                            minimumSize: const Size(double.infinity, 36),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                          ),
                          child: const Text('Reorder - ₦3,500'),
                        )
                      ],
                    ),
                  );
                },
              ),
            )
          ],
        ),
      ),
    );
  }
}

class _CategoryCard extends StatelessWidget {
  final String title;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;

  const _CategoryCard({
    required this.title,
    required this.icon,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 120,
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: color.withValues(alpha: 0.2)),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 40, color: color),
            const SizedBox(height: 12),
            Text(
              title,
              style: const TextStyle(
                fontWeight: FontWeight.w600,
                color: AppColors.textPrimary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
