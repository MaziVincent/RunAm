using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RunAm.Domain.Entities;

namespace RunAm.Infrastructure.Persistence.Configurations;

public class ChatMessageConfiguration : IEntityTypeConfiguration<ChatMessage>
{
    public void Configure(EntityTypeBuilder<ChatMessage> builder)
    {
        builder.ToTable("ChatMessages");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Message).HasMaxLength(2000).IsRequired();
        builder.Property(x => x.MessageType).HasConversion<int>();

        builder.HasOne(x => x.Errand)
            .WithMany()
            .HasForeignKey(x => x.ErrandId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Sender)
            .WithMany()
            .HasForeignKey(x => x.SenderId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(x => new { x.ErrandId, x.CreatedAt });
    }
}
