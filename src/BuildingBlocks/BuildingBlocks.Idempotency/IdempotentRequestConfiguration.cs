using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BuildingBlocks.Idempotency;

public class IdempotentRequestConfiguration : IEntityTypeConfiguration<IdempotentRequest>
{
    public void Configure(EntityTypeBuilder<IdempotentRequest> builder)
    {
        builder.ToTable("idempotent_requests");

        builder.HasKey(x => x.Key);

        builder.Property(x => x.Key)
            .HasMaxLength(128)
            .IsRequired();

        builder.Property(x => x.RequestName)
            .HasMaxLength(255)
            .IsRequired();

        builder.Property(x => x.RequestHash)
            .HasMaxLength(64)
            .IsRequired();

        builder.Property(x => x.Status)
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(x => x.ResponseCode)
            .IsRequired(false);

        builder.Property(x => x.ResponseBody)
            .HasColumnType("jsonb")
            .IsRequired(false);

        builder.Property(x => x.CreatedAtUtc)
            .IsRequired();

        builder.Property(x => x.ExpiresAtUtc)
            .IsRequired();

        builder.HasIndex(x => x.ExpiresAtUtc);
    }
}
