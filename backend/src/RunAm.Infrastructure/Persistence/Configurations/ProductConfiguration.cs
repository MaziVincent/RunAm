using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RunAm.Domain.Entities;

namespace RunAm.Infrastructure.Persistence.Configurations;

public class ProductConfiguration : IEntityTypeConfiguration<Product>
{
    public void Configure(EntityTypeBuilder<Product> builder)
    {
        builder.ToTable("Products");

        builder.HasKey(e => e.Id);
        builder.HasIndex(e => e.VendorId);
        builder.HasIndex(e => e.ProductCategoryId);
        builder.HasIndex(e => new { e.VendorId, e.IsAvailable, e.IsActive });

        builder.Property(e => e.Name).HasMaxLength(300).IsRequired();
        builder.Property(e => e.Description).HasMaxLength(2000);
        builder.Property(e => e.Price).HasPrecision(18, 2);
        builder.Property(e => e.CompareAtPrice).HasPrecision(18, 2);
        builder.Property(e => e.ImageUrl).HasMaxLength(500);
        builder.Property(e => e.VariantsJson).HasColumnType("jsonb");
        builder.Property(e => e.ExtrasJson).HasColumnType("jsonb");

        builder.HasOne(e => e.ProductCategory)
            .WithMany(pc => pc.Products)
            .HasForeignKey(e => e.ProductCategoryId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
