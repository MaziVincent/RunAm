using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RunAm.Domain.Entities;

namespace RunAm.Infrastructure.Persistence.Configurations;

public class WalletConfiguration : IEntityTypeConfiguration<Wallet>
{
    public void Configure(EntityTypeBuilder<Wallet> builder)
    {
        builder.ToTable("Wallets");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Balance).HasPrecision(18, 2);
        builder.Property(x => x.Currency).HasMaxLength(3).HasDefaultValue("NGN");
        builder.Property(x => x.MonnifyAccountReference).HasMaxLength(100);
        builder.Property(x => x.MonnifyAccountNumber).HasMaxLength(50);
        builder.Property(x => x.MonnifyAccountName).HasMaxLength(200);
        builder.Property(x => x.MonnifyBankName).HasMaxLength(100);
        builder.Property(x => x.MonnifyBankCode).HasMaxLength(20);

        builder.HasOne(x => x.User)
            .WithOne()
            .HasForeignKey<Wallet>(x => x.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(x => x.UserId).IsUnique();
        builder.HasIndex(x => x.MonnifyAccountReference).IsUnique();
    }
}

public class WalletTransactionConfiguration : IEntityTypeConfiguration<WalletTransaction>
{
    public void Configure(EntityTypeBuilder<WalletTransaction> builder)
    {
        builder.ToTable("WalletTransactions");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Type).HasConversion<int>();
        builder.Property(x => x.Amount).HasPrecision(18, 2);
        builder.Property(x => x.BalanceAfter).HasPrecision(18, 2);
        builder.Property(x => x.Source).HasConversion<int>();
        builder.Property(x => x.ExternalReference).HasMaxLength(200);
        builder.Property(x => x.Description).HasMaxLength(500);

        builder.HasOne(x => x.Wallet)
            .WithMany(w => w.Transactions)
            .HasForeignKey(x => x.WalletId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(x => new { x.WalletId, x.CreatedAt });
        builder.HasIndex(x => x.ReferenceId);
        builder.HasIndex(x => x.ExternalReference).IsUnique();
    }
}
