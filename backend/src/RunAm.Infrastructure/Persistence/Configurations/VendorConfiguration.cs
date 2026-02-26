using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RunAm.Domain.Entities;

namespace RunAm.Infrastructure.Persistence.Configurations;

public class VendorConfiguration : IEntityTypeConfiguration<Vendor>
{
    public void Configure(EntityTypeBuilder<Vendor> builder)
    {
        builder.ToTable("Vendors");

        builder.HasKey(e => e.Id);
        builder.HasIndex(e => e.UserId).IsUnique();
        builder.HasIndex(e => e.Status);
        builder.HasIndex(e => e.IsActive);

        builder.Property(e => e.BusinessName).HasMaxLength(300).IsRequired();
        builder.Property(e => e.BusinessDescription).HasMaxLength(2000);
        builder.Property(e => e.LogoUrl).HasMaxLength(500);
        builder.Property(e => e.BannerUrl).HasMaxLength(500);
        builder.Property(e => e.Address).HasMaxLength(500).IsRequired();
        builder.Property(e => e.OperatingHours).HasColumnType("jsonb");
        builder.Property(e => e.MinimumOrderAmount).HasPrecision(18, 2);
        builder.Property(e => e.DeliveryFee).HasPrecision(18, 2);

        builder.HasOne(e => e.User)
            .WithOne()
            .HasForeignKey<Vendor>(e => e.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(e => e.Products)
            .WithOne(p => p.Vendor)
            .HasForeignKey(p => p.VendorId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(e => e.ProductCategories)
            .WithOne(pc => pc.Vendor)
            .HasForeignKey(pc => pc.VendorId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(e => e.Reviews)
            .WithOne(r => r.Vendor)
            .HasForeignKey(r => r.VendorId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
