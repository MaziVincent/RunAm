using RunAm.Domain.Enums;

namespace RunAm.Shared.DTOs.Riders;

public record RiderProfileDto(
    Guid Id,
    Guid UserId,
    string RiderName,
    VehicleType VehicleType,
    string? LicensePlate,
    ApprovalStatus ApprovalStatus,
    decimal Rating,
    int TotalCompletedTasks,
    bool IsOnline,
    double? CurrentLatitude,
    double? CurrentLongitude,
    DateTime? LastLocationUpdate,
    DateTime CreatedAt
);

public record CreateRiderProfileRequest(
    VehicleType VehicleType,
    string? LicensePlate,
    string Nin,
    string? SelfieUrl,
    string Address,
    string City,
    string State,
    string SettlementBankCode,
    string SettlementBankName,
    string SettlementAccountNumber,
    string SettlementAccountName,
    bool AgreedToTerms
);

public record UpdateRiderLocationRequest(
    double Latitude,
    double Longitude,
    double? Heading,
    double? Speed
);

public record BatchLocationUpdate(
    List<LocationPoint> Points
);

public record LocationPoint(
    double Latitude,
    double Longitude,
    double? Heading,
    double? Speed,
    DateTime RecordedAt
);

public record RiderStatusRequest(bool IsOnline);

public record ValidateBankAccountRequest(string BankCode, string AccountNumber);

public record ValidateBankAccountResult(bool Success, string? AccountName, string? Message);

public record ApproveRiderRequest(
    ApprovalStatus Status,
    string? Reason
);
