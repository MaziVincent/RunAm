using RunAm.Domain.Enums;

namespace RunAm.Domain.Entities;

public class PromoCode : BaseEntity
{
    public string Code { get; set; } = string.Empty;
    public DiscountType DiscountType { get; set; }
    public decimal DiscountValue { get; set; }
    public decimal? MaxDiscount { get; set; }
    public decimal? MinOrderAmount { get; set; }
    public int UsageLimit { get; set; }
    public int UsedCount { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public bool IsActive { get; set; } = true;

    public bool IsValid()
    {
        if (!IsActive) return false;
        if (ExpiresAt.HasValue && ExpiresAt.Value < DateTime.UtcNow) return false;
        if (UsageLimit > 0 && UsedCount >= UsageLimit) return false;
        return true;
    }

    public decimal CalculateDiscount(decimal orderAmount)
    {
        if (!IsValid()) return 0;
        if (MinOrderAmount.HasValue && orderAmount < MinOrderAmount.Value) return 0;

        var discount = DiscountType == DiscountType.Percentage
            ? orderAmount * (DiscountValue / 100m)
            : DiscountValue;

        if (MaxDiscount.HasValue && discount > MaxDiscount.Value)
            discount = MaxDiscount.Value;

        return Math.Min(discount, orderAmount);
    }
}
