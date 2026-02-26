using RunAm.Domain.Enums;

namespace RunAm.Shared.DTOs;

public record UserDto(
    Guid Id,
    string Email,
    string PhoneNumber,
    string FirstName,
    string LastName,
    string? ProfileImageUrl,
    UserRole Role,
    UserStatus Status,
    bool IsPhoneVerified,
    bool IsEmailVerified,
    DateTime CreatedAt
);

public record UpdateProfileRequest(
    string? FirstName,
    string? LastName,
    string? PhoneNumber
);

public record UserAddressDto(
    Guid Id,
    string Label,
    string Address,
    double Latitude,
    double Longitude,
    bool IsDefault
);

public record CreateAddressRequest(
    string Label,
    string Address,
    double Latitude,
    double Longitude,
    bool IsDefault = false
);

public record UpdateAddressRequest(
    string? Label,
    string? Address,
    double? Latitude,
    double? Longitude,
    bool? IsDefault
);
