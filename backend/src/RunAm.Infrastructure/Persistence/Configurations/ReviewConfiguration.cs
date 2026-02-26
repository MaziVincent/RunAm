using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RunAm.Domain.Entities;

namespace RunAm.Infrastructure.Persistence.Configurations;

public class ReviewConfiguration : IEntityTypeConfiguration<Review>
{
    public void Configure(EntityTypeBuilder<Review> builder)
    {
        builder.ToTable("Reviews");

        builder.HasKey(e => e.Id);
        builder.HasIndex(e => e.ErrandId);
        builder.HasIndex(e => e.RevieweeId);

        builder.Property(e => e.Comment).HasMaxLength(2000);
        builder.Property(e => e.Rating).IsRequired();
        builder.Property(e => e.FlagReason).HasMaxLength(500);

        builder.HasOne(r => r.Reviewer)
            .WithMany(u => u.ReviewsGiven)
            .HasForeignKey(r => r.ReviewerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(r => r.Reviewee)
            .WithMany(u => u.ReviewsReceived)
            .HasForeignKey(r => r.RevieweeId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(r => r.VendorId);
    }
}
