using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RunAm.Domain.Entities;

namespace RunAm.Infrastructure.Persistence.Configurations;

public class ErrandStatusHistoryConfiguration : IEntityTypeConfiguration<ErrandStatusHistory>
{
    public void Configure(EntityTypeBuilder<ErrandStatusHistory> builder)
    {
        builder.ToTable("ErrandStatusHistory");

        builder.HasKey(e => e.Id);
        builder.HasIndex(e => e.ErrandId);
        builder.HasIndex(e => e.CreatedAt);

        builder.Property(e => e.Notes).HasMaxLength(1000);
        builder.Property(e => e.ImageUrl).HasMaxLength(500);
    }
}
