using InventoryService.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace InventoryService.Infrastructure.Persistence;

public class InventoryDbContext : DbContext
{
    public InventoryDbContext(DbContextOptions<InventoryDbContext> options) : base(options) { }

    public DbSet<ProductInventory> ProductInventories => Set<ProductInventory>();
    public DbSet<StockReservation> StockReservations => Set<StockReservation>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<ProductInventory>(builder =>
        {
            builder.ToTable("product_inventories");

            builder.HasKey(x => x.Id);

            builder.Property(x => x.Sku)
                .HasMaxLength(50)
                .IsRequired();

            builder.HasIndex(x => x.Sku)
                .IsUnique();

            builder.Property(x => x.ProductName)
                .HasMaxLength(255)
                .IsRequired();

            builder.Property(x => x.UnitPrice)
                .HasPrecision(15, 2)
                .IsRequired();

            builder.Property(x => x.TotalQuantity)
                .IsRequired();

            builder.Property(x => x.AvailableQuantity)
                .IsRequired();

            builder.Property(x => x.ReservedQuantity)
                .HasDefaultValue(0)
                .IsRequired();

            builder.Property(x => x.RowVersion)
                .IsConcurrencyToken();

            builder.Property(x => x.UpdatedAtUtc)
                .IsRequired();
        });

        modelBuilder.Entity<StockReservation>(builder =>
        {
            builder.ToTable("stock_reservations");

            builder.HasKey(x => x.Id);

            builder.Property(x => x.OrderId)
                .IsRequired();

            builder.Property(x => x.ProductId)
                .IsRequired();

            builder.Property(x => x.Quantity)
                .IsRequired();

            builder.Property(x => x.Status)
                .HasConversion<string>()
                .HasMaxLength(20)
                .IsRequired();

            builder.Property(x => x.CreatedAtUtc)
                .IsRequired();

            builder.Property(x => x.ExpiresAtUtc)
                .IsRequired();

            builder.HasIndex(x => x.OrderId);
            builder.HasIndex(x => new { x.Status, x.ExpiresAtUtc });
        });
    }
}
