using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RunAm.Domain.Entities;

namespace RunAm.Infrastructure.Persistence.Configurations;

public class ErrandStopConfiguration : IEntityTypeConfiguration<ErrandStop>
{
    public void Configure(EntityTypeBuilder<ErrandStop> builder)
    {
        builder.ToTable("ErrandStops");

        builder.HasKey(e => e.Id);
        builder.HasIndex(e => new { e.ErrandId, e.StopOrder });

        builder.Property(e => e.Address).HasMaxLength(500).IsRequired();
        builder.Property(e => e.ContactName).HasMaxLength(200);
        builder.Property(e => e.ContactPhone).HasMaxLength(20);
        builder.Property(e => e.Instructions).HasMaxLength(1000);
    }
}
