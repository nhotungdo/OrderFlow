using BuildingBlocks.Common.Primitives;
using BuildingBlocks.Common.Results;

namespace InventoryService.Domain.Entities;

public class ProductInventory : AggregateRoot<Guid>
{
    public string Sku { get; private set; } = string.Empty;
    public string ProductName { get; private set; } = string.Empty;
    public decimal UnitPrice { get; private set; }
    public int TotalQuantity { get; private set; }
    public int AvailableQuantity { get; private set; }
    public int ReservedQuantity { get; private set; }
    public int RowVersion { get; private set; } = 1;
    public DateTime UpdatedAtUtc { get; private set; } = DateTime.UtcNow;

    private ProductInventory() { }

    public static ProductInventory Create(Guid productId, string sku, string productName, decimal unitPrice, int totalQuantity)
    {
        if (totalQuantity < 0) throw new ArgumentException("Total quantity cannot be negative.", nameof(totalQuantity));
        if (unitPrice < 0) throw new ArgumentException("Unit price cannot be negative.", nameof(unitPrice));

        return new ProductInventory
        {
            Id = productId,
            Sku = sku,
            ProductName = productName,
            UnitPrice = unitPrice,
            TotalQuantity = totalQuantity,
            AvailableQuantity = totalQuantity,
            ReservedQuantity = 0,
            RowVersion = 1,
            UpdatedAtUtc = DateTime.UtcNow
        };
    }

    public bool CanReserve(int quantity) => quantity > 0 && AvailableQuantity >= quantity;

    public Result Reserve(int quantity)
    {
        if (quantity <= 0)
            return Result.Failure(Error.Validation("Inventory.InvalidQuantity", "Quantity must be greater than zero."));

        if (AvailableQuantity < quantity)
            return Result.Failure(Error.Conflict($"Insufficient stock for SKU {Sku}. Available: {AvailableQuantity}, Requested: {quantity}"));

        AvailableQuantity -= quantity;
        ReservedQuantity += quantity;
        UpdatedAtUtc = DateTime.UtcNow;
        RowVersion++;

        return Result.Success();
    }

    public Result Release(int quantity)
    {
        if (quantity <= 0)
            return Result.Failure(Error.Validation("Inventory.InvalidQuantity", "Quantity must be greater than zero."));

        if (ReservedQuantity < quantity)
            return Result.Failure(Error.Conflict($"Cannot release more than reserved quantity for SKU {Sku}."));

        ReservedQuantity -= quantity;
        AvailableQuantity += quantity;
        UpdatedAtUtc = DateTime.UtcNow;
        RowVersion++;

        return Result.Success();
    }

    public Result Commit(int quantity)
    {
        if (quantity <= 0)
            return Result.Failure(Error.Validation("Inventory.InvalidQuantity", "Quantity must be greater than zero."));

        if (ReservedQuantity < quantity)
            return Result.Failure(Error.Conflict($"Cannot commit more than reserved quantity for SKU {Sku}."));

        ReservedQuantity -= quantity;
        TotalQuantity -= quantity;
        UpdatedAtUtc = DateTime.UtcNow;
        RowVersion++;

        return Result.Success();
    }
}
