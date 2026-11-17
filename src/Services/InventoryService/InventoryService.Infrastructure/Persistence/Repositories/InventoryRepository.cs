using InventoryService.Domain.Entities;
using InventoryService.Domain.Repositories;
using Microsoft.EntityFrameworkCore;

namespace InventoryService.Infrastructure.Persistence.Repositories;

public class InventoryRepository : IInventoryRepository
{
    private readonly InventoryDbContext _dbContext;

    public InventoryRepository(InventoryDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<ProductInventory?> GetByIdAsync(Guid productId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.ProductInventories
            .FirstOrDefaultAsync(x => x.Id == productId, cancellationToken);
    }

    public async Task<ProductInventory?> GetBySkuAsync(string sku, CancellationToken cancellationToken = default)
    {
        return await _dbContext.ProductInventories
            .FirstOrDefaultAsync(x => x.Sku == sku, cancellationToken);
    }

    public async Task<List<ProductInventory>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.ProductInventories
            .AsNoTracking()
            .OrderBy(x => x.ProductName)
            .ToListAsync(cancellationToken);
    }

    public async Task<bool> AtomicReserveStockAsync(Guid productId, int quantity, CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        // Conditional Update bảo đảm không bị race condition hay overselling ở tầng PostgreSQL
        var rowsAffected = await _dbContext.Database.ExecuteSqlInterpolatedAsync(
            $@"UPDATE product_inventories 
               SET available_quantity = available_quantity - {quantity}, 
                   reserved_quantity = reserved_quantity + {quantity}, 
                   row_version = row_version + 1, 
                   updated_at_utc = {now} 
               WHERE id = {productId} AND available_quantity >= {quantity};",
            cancellationToken);

        return rowsAffected > 0;
    }

    public async Task<bool> AtomicReleaseStockAsync(Guid productId, int quantity, CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var rowsAffected = await _dbContext.Database.ExecuteSqlInterpolatedAsync(
            $@"UPDATE product_inventories 
               SET reserved_quantity = reserved_quantity - {quantity}, 
                   available_quantity = available_quantity + {quantity}, 
                   row_version = row_version + 1, 
                   updated_at_utc = {now} 
               WHERE id = {productId} AND reserved_quantity >= {quantity};",
            cancellationToken);

        return rowsAffected > 0;
    }

    public async Task<bool> AtomicCommitStockAsync(Guid productId, int quantity, CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var rowsAffected = await _dbContext.Database.ExecuteSqlInterpolatedAsync(
            $@"UPDATE product_inventories 
               SET reserved_quantity = reserved_quantity - {quantity}, 
                   total_quantity = total_quantity - {quantity}, 
                   row_version = row_version + 1, 
                   updated_at_utc = {now} 
               WHERE id = {productId} AND reserved_quantity >= {quantity};",
            cancellationToken);

        return rowsAffected > 0;
    }

    public async Task AddReservationAsync(StockReservation reservation, CancellationToken cancellationToken = default)
    {
        await _dbContext.StockReservations.AddAsync(reservation, cancellationToken);
    }

    public async Task<List<StockReservation>> GetActiveReservationsByOrderIdAsync(Guid orderId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.StockReservations
            .Where(x => x.OrderId == orderId && x.Status == ReservationStatus.Pending)
            .ToListAsync(cancellationToken);
    }

    public async Task AddProductAsync(ProductInventory product, CancellationToken cancellationToken = default)
    {
        await _dbContext.ProductInventories.AddAsync(product, cancellationToken);
    }

    public async Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        await _dbContext.SaveChangesAsync(cancellationToken);
    }
}
