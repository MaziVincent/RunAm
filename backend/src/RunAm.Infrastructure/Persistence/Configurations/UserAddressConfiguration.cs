using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RunAm.Domain.Entities;

namespace RunAm.Infrastructure.Persistence.Configurations;

public class UserAddressConfiguration : IEntityTypeConfiguration<UserAddress>
{
    public void Configure(EntityTypeBuilder<UserAddress> builder)
    {
        builder.ToTable("UserAddresses");

        builder.HasKey(e => e.Id);
        builder.HasIndex(e => e.UserId);

        builder.Property(e => e.Label).HasMaxLength(50).IsRequired();
        builder.Property(e => e.Address).HasMaxLength(500).IsRequired();
    }
}
