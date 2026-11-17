using InventoryService.Domain.Entities;

namespace InventoryService.Domain.Repositories;

public interface IInventoryRepository
{
    Task<ProductInventory?> GetByIdAsync(Guid productId, CancellationToken cancellationToken = default);
    Task<ProductInventory?> GetBySkuAsync(string sku, CancellationToken cancellationToken = default);
    Task<List<ProductInventory>> GetAllAsync(CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Executes direct atomic SQL conditional update:
    /// UPDATE product_inventories SET available_quantity = available_quantity - @quantity, reserved_quantity = reserved_quantity + @quantity
    /// WHERE product_id = @productId AND available_quantity >= @quantity;
    /// Returns true if updated (sufficient stock), false if insufficient stock / race condition lost.
    /// </summary>
    Task<bool> AtomicReserveStockAsync(Guid productId, int quantity, CancellationToken cancellationToken = default);

    /// <summary>
    /// Atomically releases reserved stock back to available stock.
    /// </summary>
    Task<bool> AtomicReleaseStockAsync(Guid productId, int quantity, CancellationToken cancellationToken = default);

    /// <summary>
    /// Atomically commits reserved stock (deducts from total quantity).
    /// </summary>
    Task<bool> AtomicCommitStockAsync(Guid productId, int quantity, CancellationToken cancellationToken = default);

    Task AddReservationAsync(StockReservation reservation, CancellationToken cancellationToken = default);
    Task<List<StockReservation>> GetActiveReservationsByOrderIdAsync(Guid orderId, CancellationToken cancellationToken = default);
    Task AddProductAsync(ProductInventory product, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
