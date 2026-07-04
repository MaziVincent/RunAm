import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/auth_response.dart';
import '../../../api/api_client.dart';

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  final dio = ref.watch(dioProvider);
  return AuthRepository(dio);
});

class AuthRepository {
  final Dio _dio;

  AuthRepository(this._dio);

  Future<AuthResponse> login(String email, String password) async {
    try {
      final response = await _dio.post('auth/login', data: {
        'email': email,
        'password': password,
      });
      return AuthResponse.fromJson(response.data['data']);
    } catch (e) {
      throw _handleError(e);
    }
  }

  Future<Map<String, dynamic>> register({
    required String email,
    required String phoneNumber,
    required String password,
    required String firstName,
    required String lastName,
  }) async {
    try {
      final response = await _dio.post('auth/register', data: {
        'email': email,
        'phoneNumber': phoneNumber,
        'password': password,
        'firstName': firstName,
        'lastName': lastName,
        'role': 1, // UserRole.Customer
      });
      return response.data['data'] as Map<String, dynamic>;
    } catch (e) {
      throw _handleError(e);
    }
  }

  Future<AuthResponse> verifyOtp(String phoneNumber, String code) async {
    try {
      final response = await _dio.post('auth/verify-otp', data: {
        'phoneNumber': phoneNumber,
        'code': code,
      });
      return AuthResponse.fromJson(response.data['data']);
    } catch (e) {
      throw _handleError(e);
    }
  }

  Exception _handleError(dynamic e) {
    if (e is DioException) {
      final message = e.response?.data?['message'] ?? e.message;
      return Exception(message);
    }
    return Exception(e.toString());
  }
}
