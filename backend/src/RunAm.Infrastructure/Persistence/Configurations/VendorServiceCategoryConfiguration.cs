using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RunAm.Domain.Entities;

namespace RunAm.Infrastructure.Persistence.Configurations;

public class VendorServiceCategoryConfiguration : IEntityTypeConfiguration<VendorServiceCategory>
{
    public void Configure(EntityTypeBuilder<VendorServiceCategory> builder)
    {
        builder.ToTable("VendorServiceCategories");

        builder.HasKey(e => new { e.VendorId, e.ServiceCategoryId });

        builder.HasOne(e => e.Vendor)
            .WithMany(v => v.VendorServiceCategories)
            .HasForeignKey(e => e.VendorId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(e => e.ServiceCategory)
            .WithMany(sc => sc.VendorServiceCategories)
            .HasForeignKey(e => e.ServiceCategoryId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
