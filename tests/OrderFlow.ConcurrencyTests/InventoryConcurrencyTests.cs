using System.Collections.Concurrent;
using BuildingBlocks.Common.Results;
using BuildingBlocks.Redis;
using InventoryService.Application.Commands.ReserveStock;
using InventoryService.Application.DTOs;
using InventoryService.Domain.Entities;
using InventoryService.Domain.Repositories;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace OrderFlow.ConcurrencyTests;

public class InventoryConcurrencyTests
{
    [Fact]
    public void ProductInventory_Reserve_ShouldNeverAllowNegativeStock()
    {
        // Arrange
        const int initialStock = 5;
        var product = ProductInventory.Create(Guid.NewGuid(), "TEST-SKU", "Test Product", 1000m, initialStock);

        // Act - Thử reserve 6 món
        var result = product.Reserve(6);

        // Assert
        Assert.True(result.IsFailure);
        Assert.Equal(initialStock, product.AvailableQuantity);
        Assert.Equal(0, product.ReservedQuantity);
    }

    [Fact]
    public async Task ConcurrentReservations_OnSharedInventory_ShouldNeverOversell()
    {
        // Arrange: Giới hạn kho chỉ có 10 sản phẩm
        const int totalStock = 10;
        const int totalConcurrentBuyers = 50; // 50 khách hàng tranh chấp cùng lúc
        var productId = Guid.Parse("11111111-1111-1111-1111-111111111111");

        var repositoryMock = new ThreadSafeInventoryRepository(productId, totalStock);
        var redisMock = new ThreadSafeRedisService(productId, totalStock);

        var handler = new ReserveStockCommandHandler(
            repositoryMock,
            redisMock,
            NullLogger<ReserveStockCommandHandler>.Instance);

        var results = new ConcurrentBag<Result>();

        // Act: 50 requests bắn đồng thời qua Task.WhenAll
        var tasks = Enumerable.Range(1, totalConcurrentBuyers).Select(async i =>
        {
            var command = new ReserveStockCommand(
                OrderId: Guid.NewGuid(),
                Items: [new OrderItemDto(productId, 1)]
            );

            var res = await handler.Handle(command, CancellationToken.None);
            results.Add(res);
        });

        await Task.WhenAll(tasks);

        // Assert
        var successfulPurchases = results.Count(r => r.IsSuccess);
        var failedPurchases = results.Count(r => r.IsFailure);

        Assert.Equal(10, successfulPurchases); // Đúng chính xác 10 người mua thành công
        Assert.Equal(40, failedPurchases);     // Đúng chính xác 40 người bị từ chối hết hàng
        Assert.Equal(0, repositoryMock.AvailableStock); // Kho available về đúng 0, KHÔNG BAO GIỜ BỊ ÂM!
        Assert.Equal(10, repositoryMock.ReservedStock); // Đã giữ đúng 10 món
    }

    [Fact]
    public void Compensation_ReleaseStock_ShouldRestoreAvailableQuantity()
    {
        // Arrange
        var product = ProductInventory.Create(Guid.NewGuid(), "TEST-SKU", "Test Product", 1000m, 10);
        product.Reserve(4);
        Assert.Equal(6, product.AvailableQuantity);
        Assert.Equal(4, product.ReservedQuantity);

        // Act - Giả lập thanh toán lỗi -> Release bù trừ
        var releaseResult = product.Release(4);

        // Assert
        Assert.True(releaseResult.IsSuccess);
        Assert.Equal(10, product.AvailableQuantity);
        Assert.Equal(0, product.ReservedQuantity);
    }

    // Thread-safe Mock Repository mô phỏng hành vi Atomic Conditional Update của PostgreSQL
    private class ThreadSafeInventoryRepository : IInventoryRepository
    {
        private readonly Guid _productId;
        private int _available;
        private int _reserved;
        private readonly object _lock = new();

        public int AvailableStock => _available;
        public int ReservedStock => _reserved;

        public ThreadSafeInventoryRepository(Guid productId, int initialStock)
        {
            _productId = productId;
            _available = initialStock;
            _reserved = 0;
        }

        public Task<bool> AtomicReserveStockAsync(Guid productId, int quantity, CancellationToken cancellationToken = default)
        {
            lock (_lock)
            {
                if (_available >= quantity)
                {
                    _available -= quantity;
                    _reserved += quantity;
                    return Task.FromResult(true);
                }
                return Task.FromResult(false);
            }
        }

        public Task<bool> AtomicReleaseStockAsync(Guid productId, int quantity, CancellationToken cancellationToken = default)
        {
            lock (_lock)
            {
                if (_reserved >= quantity)
                {
                    _reserved -= quantity;
                    _available += quantity;
                    return Task.FromResult(true);
                }
                return Task.FromResult(false);
            }
        }

        public Task<bool> AtomicCommitStockAsync(Guid productId, int quantity, CancellationToken cancellationToken = default)
        {
            lock (_lock)
            {
                if (_reserved >= quantity)
                {
                    _reserved -= quantity;
                    return Task.FromResult(true);
                }
                return Task.FromResult(false);
            }
        }

        public Task<ProductInventory?> GetByIdAsync(Guid productId, CancellationToken cancellationToken = default) => Task.FromResult<ProductInventory?>(null);
        public Task<ProductInventory?> GetBySkuAsync(string sku, CancellationToken cancellationToken = default) => Task.FromResult<ProductInventory?>(null);
        public Task<List<ProductInventory>> GetAllAsync(CancellationToken cancellationToken = default) => Task.FromResult(new List<ProductInventory>());
        public Task AddReservationAsync(StockReservation reservation, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task<List<StockReservation>> GetActiveReservationsByOrderIdAsync(Guid orderId, CancellationToken cancellationToken = default) => Task.FromResult(new List<StockReservation>());
        public Task AddProductAsync(ProductInventory product, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task SaveChangesAsync(CancellationToken cancellationToken = default) => Task.CompletedTask;
    }

    // Thread-safe Mock Redis mô phỏng Redis Lua Script atomic execution
    private class ThreadSafeRedisService : IRedisService
    {
        private readonly Guid _productId;
        private int _stock;
        private readonly object _lock = new();

        public ThreadSafeRedisService(Guid productId, int initialStock)
        {
            _productId = productId;
            _stock = initialStock;
        }

        public Task<bool> ReserveStockLuaAsync(string stockKey, int quantity)
        {
            lock (_lock)
            {
                if (_stock >= quantity)
                {
                    _stock -= quantity;
                    return Task.FromResult(true);
                }
                return Task.FromResult(false);
            }
        }

        public Task<bool> ReleaseStockLuaAsync(string stockKey, int quantity)
        {
            lock (_lock)
            {
                _stock += quantity;
                return Task.FromResult(true);
            }
        }

        public Task<bool> SetAsync<T>(string key, T value, TimeSpan? expiry = null) => Task.FromResult(true);
        public Task<T?> GetAsync<T>(string key) => Task.FromResult<T?>(default);
        public Task<string?> GetStringAsync(string key) => Task.FromResult<string?>(_stock.ToString());
        public Task<bool> SetStringAsync(string key, string value, TimeSpan? expiry = null) => Task.FromResult(true);
        public Task<bool> RemoveAsync(string key) => Task.FromResult(true);
        public Task<bool> SetIfNotExistsAsync(string key, string value, TimeSpan expiry) => Task.FromResult(true);
        public Task<bool> ReleaseLockAsync(string key, string lockValue) => Task.FromResult(true);
    }
}
