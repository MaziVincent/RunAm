using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RunAm.Domain.Entities;

namespace RunAm.Infrastructure.Persistence.Configurations;

public class RiderLocationConfiguration : IEntityTypeConfiguration<RiderLocation>
{
    public void Configure(EntityTypeBuilder<RiderLocation> builder)
    {
        builder.ToTable("RiderLocations");

        builder.HasKey(e => e.Id);
        builder.Property(e => e.Id).ValueGeneratedOnAdd();
        builder.HasIndex(e => e.RiderId);
        builder.HasIndex(e => e.RecordedAt);

        builder.HasOne(e => e.Rider)
            .WithMany()
            .HasForeignKey(e => e.RiderId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
