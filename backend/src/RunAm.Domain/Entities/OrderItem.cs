using RunAm.Domain.Enums;

namespace RunAm.Domain.Entities;

public class OrderItem : BaseEntity
{
    public Guid ErrandId { get; set; }
    public Guid ProductId { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal TotalPrice { get; set; }
    public string? Notes { get; set; }
    public string? SelectedVariantJson { get; set; }
    public string? SelectedExtrasJson { get; set; }
    public OrderItemStatus Status { get; set; } = OrderItemStatus.Pending;

    // Navigation
    public Errand Errand { get; set; } = null!;
    public Product Product { get; set; } = null!;
}
