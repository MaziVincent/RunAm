namespace RunAm.Shared.DTOs.Reviews;

public record ReviewDto(
    Guid Id,
    Guid ErrandId,
    Guid ReviewerId,
    string ReviewerName,
    Guid RevieweeId,
    string RevieweeName,
    int Rating,
    string? Comment,
    bool IsApproved,
    bool IsFlagged,
    string? FlagReason,
    DateTime CreatedAt
);

public record CreateReviewRequest(
    Guid ErrandId,
    int Rating,
    string? Comment
);

public record FlagReviewRequest(
    string Reason
);

public record ReviewSummaryDto(
    double AverageRating,
    int TotalReviews,
    int FiveStarCount,
    int FourStarCount,
    int ThreeStarCount,
    int TwoStarCount,
    int OneStarCount
);

public record NotificationPreferenceDto(
    bool PushEnabled,
    bool EmailEnabled,
    bool SmsEnabled,
    bool ErrandUpdates,
    bool ChatMessages,
    bool PaymentAlerts,
    bool Promotions,
    bool SystemAlerts,
    string? FcmToken
);

public record UpdateNotificationPreferenceRequest(
    bool? PushEnabled,
    bool? EmailEnabled,
    bool? SmsEnabled,
    bool? ErrandUpdates,
    bool? ChatMessages,
    bool? PaymentAlerts,
    bool? Promotions,
    bool? SystemAlerts,
    string? FcmToken
);

public record NotificationTemplateDto(
    Guid Id,
    string Name,
    string Subject,
    string Body,
    string? HtmlBody,
    string Channel,
    bool IsActive,
    DateTime CreatedAt
);

public record CreateNotificationTemplateRequest(
    string Name,
    string Subject,
    string Body,
    string? HtmlBody,
    string Channel
);

public record BroadcastNotificationRequest(
    string Title,
    string Body,
    string? Segment, // "all", "customers", "riders"
    Guid? TemplateId,
    bool SendEmail,
    bool SendSms,
    bool SendPush
);
