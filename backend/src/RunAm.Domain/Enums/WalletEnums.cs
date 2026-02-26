namespace RunAm.Domain.Enums;

public enum TransactionType
{
    Credit = 0,
    Debit = 1
}

public enum TransactionSource
{
    TopUp = 0,
    ErrandPayment = 1,
    ErrandEarning = 2,
    Refund = 3,
    Tip = 4,
    Bonus = 5,
    Withdrawal = 6,
    Commission = 7
}

public enum DiscountType
{
    Percentage = 0,
    FlatAmount = 1
}

public enum PayoutStatus
{
    Pending = 0,
    Processing = 1,
    Completed = 2,
    Failed = 3
}
