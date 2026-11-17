using BuildingBlocks.Idempotency;
using BuildingBlocks.Outbox;
using Microsoft.EntityFrameworkCore;
using OrderService.Domain.Entities;

namespace OrderService.Infrastructure.Persistence;

public class OrderDbContext : DbContext
{
    private readonly ConvertDomainEventsToOutboxMessagesInterceptor? _outboxInterceptor;

    public OrderDbContext(
        DbContextOptions<OrderDbContext> options,
        ConvertDomainEventsToOutboxMessagesInterceptor? outboxInterceptor = null) : base(options)
    {
        _outboxInterceptor = outboxInterceptor;
    }

    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<OutboxMessage> OutboxMessages => Set<OutboxMessage>();
    public DbSet<IdempotentRequest> IdempotentRequests => Set<IdempotentRequest>();

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        base.OnConfiguring(optionsBuilder);
        if (_outboxInterceptor is not null)
        {
            optionsBuilder.AddInterceptors(_outboxInterceptor);
        }
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Apply Configurations from Outbox & Idempotency BuildingBlocks
        modelBuilder.ApplyConfiguration(new OutboxMessageConfiguration());
        modelBuilder.ApplyConfiguration(new IdempotentRequestConfiguration());

        modelBuilder.Entity<Order>(builder =>
        {
            builder.ToTable("orders");

            builder.HasKey(x => x.Id);

            builder.Property(x => x.OrderCode)
                .HasMaxLength(50)
                .IsRequired();

            builder.HasIndex(x => x.OrderCode)
                .IsUnique();

            builder.Property(x => x.CustomerId)
                .IsRequired();

            builder.Property(x => x.TotalAmount)
                .HasPrecision(15, 2)
                .IsRequired();

            builder.Property(x => x.Status)
                .HasConversion<string>()
                .HasMaxLength(20)
                .IsRequired();

            builder.Property(x => x.PaymentMethod)
                .HasMaxLength(50)
                .IsRequired();

            builder.Property(x => x.FailureReason)
                .HasMaxLength(500)
                .IsRequired(false);

            builder.Property(x => x.IdempotencyKey)
                .HasMaxLength(128)
                .IsRequired(false);

            builder.HasIndex(x => x.IdempotencyKey)
                .IsUnique(false);

            builder.Property(x => x.CreatedAtUtc)
                .IsRequired();

            builder.Property(x => x.UpdatedAtUtc)
                .IsRequired();

            builder.HasMany(x => x.Items)
                .WithOne()
                .HasForeignKey(x => x.OrderId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<OrderItem>(builder =>
        {
            builder.ToTable("order_items");

            builder.HasKey(x => x.Id);

            builder.Property(x => x.OrderId)
                .IsRequired();

            builder.Property(x => x.ProductId)
                .IsRequired();

            builder.Property(x => x.ProductName)
                .HasMaxLength(255)
                .IsRequired();

            builder.Property(x => x.UnitPrice)
                .HasPrecision(15, 2)
                .IsRequired();

            builder.Property(x => x.Quantity)
                .IsRequired();

            builder.Ignore(x => x.TotalPrice);
        });
    }
}
