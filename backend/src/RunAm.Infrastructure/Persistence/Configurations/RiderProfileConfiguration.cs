using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RunAm.Domain.Entities;

namespace RunAm.Infrastructure.Persistence.Configurations;

public class RiderProfileConfiguration : IEntityTypeConfiguration<RiderProfile>
{
    public void Configure(EntityTypeBuilder<RiderProfile> builder)
    {
        builder.ToTable("RiderProfiles");

        builder.HasKey(r => r.Id);
        builder.HasIndex(r => r.UserId).IsUnique();
        builder.HasIndex(r => r.ApprovalStatus);
        builder.HasIndex(r => r.IsOnline);

        builder.Property(r => r.LicensePlate).HasMaxLength(20);
        builder.Property(r => r.IdDocumentUrl).HasMaxLength(500);
        builder.Property(r => r.SelfieUrl).HasMaxLength(500);
        builder.Property(r => r.BackgroundCheckStatus).HasMaxLength(50);
        builder.Property(r => r.Rating).HasPrecision(3, 2);
    }
}
