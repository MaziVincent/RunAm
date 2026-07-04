import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

class RunAmSplashScreen extends StatefulWidget {
  final VoidCallback onAnimationComplete;

  const RunAmSplashScreen({
    super.key,
    required this.onAnimationComplete,
  });

  @override
  State<RunAmSplashScreen> createState() => _RunAmSplashScreenState();
}

class _RunAmSplashScreenState extends State<RunAmSplashScreen> with TickerProviderStateMixin {
  late AnimationController _bikeController;
  late AnimationController _textController;

  late Animation<Offset> _bikeSlideAnimation;
  late Animation<double> _textFadeAnimation;
  late Animation<double> _textScaleAnimation;

  @override
  void initState() {
    super.initState();

    _bikeController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    );

    _textController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );

    _bikeSlideAnimation = Tween<Offset>(
      begin: const Offset(-1.5, 0),
      end: const Offset(1.5, 0),
    ).animate(CurvedAnimation(
      parent: _bikeController,
      curve: Curves.easeInOutCubic,
    ));

    _textFadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _textController,
        curve: Curves.easeIn,
      ),
    );

    _textScaleAnimation = Tween<double>(begin: 0.8, end: 1.0).animate(
      CurvedAnimation(
        parent: _textController,
        curve: Curves.easeOutBack,
      ),
    );

    _startAnimation();
  }

  Future<void> _startAnimation() async {
    // Start bike moving across the screen
    _bikeController.forward();

    // Wait until bike is near the middle
    await Future.delayed(const Duration(milliseconds: 750));

    // Pop the text in
    await _textController.forward();

    // Wait a brief moment before completing
    await Future.delayed(const Duration(milliseconds: 800));

    widget.onAnimationComplete();
  }

  @override
  void dispose() {
    _bikeController.dispose();
    _textController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.brand500,
      body: Center(
        child: Stack(
          alignment: Alignment.center,
          children: [
            // Bike Layer
            SlideTransition(
              position: _bikeSlideAnimation,
              child: const Icon(
                Icons.motorcycle,
                size: 80,
                color: Colors.white,
              ),
            ),
            // Text Layer
            FadeTransition(
              opacity: _textFadeAnimation,
              child: ScaleTransition(
                scale: _textScaleAnimation,
                child: const Text(
                  'RUNAM',
                  style: TextStyle(
                    fontSize: 48,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 4.0,
                    color: Colors.white,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
