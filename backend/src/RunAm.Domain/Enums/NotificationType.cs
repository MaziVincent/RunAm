namespace RunAm.Domain.Enums;

public enum NotificationType
{
    ErrandCreated = 0,
    ErrandAccepted = 1,
    ErrandStatusUpdate = 2,
    ErrandDelivered = 3,
    ErrandCancelled = 4,
    RiderApproved = 5,
    RiderRejected = 6,
    PaymentReceived = 7,
    PaymentFailed = 8,
    WalletTopUp = 9,
    WalletWithdrawal = 10,
    PromotionAvailable = 11,
    ChatMessage = 12,
    SystemAlert = 13,
    RatingReceived = 14,
    PayoutCompleted = 15
}
