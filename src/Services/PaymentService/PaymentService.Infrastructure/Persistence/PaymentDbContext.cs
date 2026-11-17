using Microsoft.EntityFrameworkCore;
using PaymentService.Domain.Entities;

namespace PaymentService.Infrastructure.Persistence;

public class PaymentDbContext : DbContext
{
    public PaymentDbContext(DbContextOptions<PaymentDbContext> options) : base(options) { }

    public DbSet<Payment> Payments => Set<Payment>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Payment>(builder =>
        {
            builder.ToTable("payments");

            builder.HasKey(x => x.Id);

            builder.Property(x => x.OrderId)
                .IsRequired();

            builder.HasIndex(x => x.OrderId);

            builder.Property(x => x.Amount)
                .HasPrecision(15, 2)
                .IsRequired();

            builder.Property(x => x.Status)
                .HasConversion<string>()
                .HasMaxLength(20)
                .IsRequired();

            builder.Property(x => x.TransactionId)
                .HasMaxLength(100)
                .IsRequired(false);

            builder.Property(x => x.FailureReason)
                .HasMaxLength(500)
                .IsRequired(false);

            builder.Property(x => x.CreatedAtUtc)
                .IsRequired();

            builder.Property(x => x.CompletedAtUtc)
                .IsRequired(false);
        });
    }
}
