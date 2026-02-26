using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RunAm.Domain.Entities;

namespace RunAm.Infrastructure.Persistence.Configurations;

public class OrderItemConfiguration : IEntityTypeConfiguration<OrderItem>
{
    public void Configure(EntityTypeBuilder<OrderItem> builder)
    {
        builder.ToTable("OrderItems");

        builder.HasKey(e => e.Id);
        builder.HasIndex(e => e.ErrandId);
        builder.HasIndex(e => e.ProductId);

        builder.Property(e => e.UnitPrice).HasPrecision(18, 2);
        builder.Property(e => e.TotalPrice).HasPrecision(18, 2);
        builder.Property(e => e.Notes).HasMaxLength(1000);
        builder.Property(e => e.SelectedVariantJson).HasColumnType("jsonb");
        builder.Property(e => e.SelectedExtrasJson).HasColumnType("jsonb");

        builder.HasOne(e => e.Errand)
            .WithMany(er => er.OrderItems)
            .HasForeignKey(e => e.ErrandId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(e => e.Product)
            .WithMany()
            .HasForeignKey(e => e.ProductId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
