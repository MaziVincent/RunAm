using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RunAm.Domain.Entities;

namespace RunAm.Infrastructure.Persistence.Configurations;

public class PromoCodeConfiguration : IEntityTypeConfiguration<PromoCode>
{
    public void Configure(EntityTypeBuilder<PromoCode> builder)
    {
        builder.ToTable("PromoCodes");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Code).HasMaxLength(50).IsRequired();
        builder.Property(x => x.DiscountType).HasConversion<int>();
        builder.Property(x => x.DiscountValue).HasPrecision(18, 2);
        builder.Property(x => x.MaxDiscount).HasPrecision(18, 2);
        builder.Property(x => x.MinOrderAmount).HasPrecision(18, 2);

        builder.HasIndex(x => x.Code).IsUnique();
        builder.HasIndex(x => x.IsActive);
    }
}

public class RiderPayoutConfiguration : IEntityTypeConfiguration<RiderPayout>
{
    public void Configure(EntityTypeBuilder<RiderPayout> builder)
    {
        builder.ToTable("RiderPayouts");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Amount).HasPrecision(18, 2);
        builder.Property(x => x.Currency).HasMaxLength(3).HasDefaultValue("NGN");
        builder.Property(x => x.Status).HasConversion<int>();
        builder.Property(x => x.PaymentReference).HasMaxLength(200);
        builder.Property(x => x.DestinationBankCode).HasMaxLength(20).IsRequired();
        builder.Property(x => x.DestinationBankName).HasMaxLength(100).IsRequired();
        builder.Property(x => x.DestinationAccountNumber).HasMaxLength(20).IsRequired();
        builder.Property(x => x.DestinationAccountName).HasMaxLength(200).IsRequired();
        builder.Property(x => x.FailureReason).HasMaxLength(500);

        builder.HasOne(x => x.Rider)
            .WithMany()
            .HasForeignKey(x => x.RiderId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(x => new { x.RiderId, x.CreatedAt });
        builder.HasIndex(x => x.Status);
    }
}
