using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RunAm.Domain.Entities;

namespace RunAm.Infrastructure.Persistence.Configurations;

public class PaymentConfiguration : IEntityTypeConfiguration<Payment>
{
    public void Configure(EntityTypeBuilder<Payment> builder)
    {
        builder.ToTable("Payments");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Amount).HasPrecision(18, 2);
        builder.Property(x => x.Currency).HasMaxLength(3).HasDefaultValue("NGN");
        builder.Property(x => x.PaymentMethod).HasConversion<int>();
        builder.Property(x => x.Status).HasConversion<int>();
        builder.Property(x => x.PaymentGatewayRef).HasMaxLength(200);

        builder.HasOne(x => x.Errand)
            .WithMany()
            .HasForeignKey(x => x.ErrandId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Payer)
            .WithMany()
            .HasForeignKey(x => x.PayerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(x => x.ErrandId);
        builder.HasIndex(x => x.PaymentGatewayRef);
    }
}
