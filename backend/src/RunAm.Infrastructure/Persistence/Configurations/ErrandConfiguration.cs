using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RunAm.Domain.Entities;

namespace RunAm.Infrastructure.Persistence.Configurations;

public class ErrandConfiguration : IEntityTypeConfiguration<Errand>
{
    public void Configure(EntityTypeBuilder<Errand> builder)
    {
        builder.ToTable("Errands");

        builder.HasKey(e => e.Id);
        builder.HasIndex(e => e.CustomerId);
        builder.HasIndex(e => e.RiderId);
        builder.HasIndex(e => e.Status);
        builder.HasIndex(e => e.Category);
        builder.HasIndex(e => e.CreatedAt);

        builder.Property(e => e.Description).HasMaxLength(2000);
        builder.Property(e => e.SpecialInstructions).HasMaxLength(1000);
        builder.Property(e => e.PickupAddress).HasMaxLength(500).IsRequired();
        builder.Property(e => e.DropoffAddress).HasMaxLength(500).IsRequired();
        builder.Property(e => e.RecipientName).HasMaxLength(200);
        builder.Property(e => e.RecipientPhone).HasMaxLength(20);
        builder.Property(e => e.PricingBreakdown).HasColumnType("jsonb");
        builder.Property(e => e.TotalAmount).HasPrecision(18, 2);
        builder.Property(e => e.CommissionAmount).HasPrecision(18, 2);
        builder.Property(e => e.PackageWeight).HasPrecision(10, 2);
        builder.Property(e => e.CancellationReason).HasMaxLength(1000);

        builder.HasOne(e => e.Customer)
            .WithMany(u => u.CustomerErrands)
            .HasForeignKey(e => e.CustomerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.Rider)
            .WithMany(u => u.RiderErrands)
            .HasForeignKey(e => e.RiderId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasMany(e => e.StatusHistory)
            .WithOne(s => s.Errand)
            .HasForeignKey(s => s.ErrandId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(e => e.Stops)
            .WithOne(s => s.Errand)
            .HasForeignKey(s => s.ErrandId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(e => e.Reviews)
            .WithOne(r => r.Errand)
            .HasForeignKey(r => r.ErrandId)
            .OnDelete(DeleteBehavior.Cascade);

        // Marketplace relationships
        builder.HasIndex(e => e.VendorId);
        builder.HasIndex(e => e.ServiceCategoryId);

        builder.HasOne(e => e.Vendor)
            .WithMany()
            .HasForeignKey(e => e.VendorId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(e => e.ServiceCategory)
            .WithMany()
            .HasForeignKey(e => e.ServiceCategoryId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasMany(e => e.OrderItems)
            .WithOne(oi => oi.Errand)
            .HasForeignKey(oi => oi.ErrandId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
