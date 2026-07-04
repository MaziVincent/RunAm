class UserDto {
  final String id;
  final String email;
  final String phoneNumber;
  final String firstName;
  final String lastName;
  final String? profileImageUrl;
  final int role;
  final int status;
  final bool isPhoneVerified;
  final bool isEmailVerified;
  final DateTime createdAt;

  UserDto({
    required this.id,
    required this.email,
    required this.phoneNumber,
    required this.firstName,
    required this.lastName,
    this.profileImageUrl,
    required this.role,
    required this.status,
    required this.isPhoneVerified,
    required this.isEmailVerified,
    required this.createdAt,
  });

  factory UserDto.fromJson(Map<String, dynamic> json) {
    return UserDto(
      id: json['id'] as String,
      email: json['email'] as String,
      phoneNumber: json['phoneNumber'] as String,
      firstName: json['firstName'] as String,
      lastName: json['lastName'] as String,
      profileImageUrl: json['profileImageUrl'] as String?,
      role: json['role'] as int,
      status: json['status'] as int,
      isPhoneVerified: json['isPhoneVerified'] as bool,
      isEmailVerified: json['isEmailVerified'] as bool,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'phoneNumber': phoneNumber,
      'firstName': firstName,
      'lastName': lastName,
      'profileImageUrl': profileImageUrl,
      'role': role,
      'status': status,
      'isPhoneVerified': isPhoneVerified,
      'isEmailVerified': isEmailVerified,
      'createdAt': createdAt.toIso8601String(),
    };
  }
}
