using BuildingBlocks.Common.Results;
using BuildingBlocks.Redis;
using InventoryService.Application.DTOs;
using InventoryService.Domain.Entities;
using InventoryService.Domain.Repositories;
using MediatR;
using Microsoft.Extensions.Logging;

namespace InventoryService.Application.Commands.ReserveStock;

public record ReserveStockCommand(Guid OrderId, List<OrderItemDto> Items) : IRequest<Result>;

public class ReserveStockCommandHandler : IRequestHandler<ReserveStockCommand, Result>
{
    private readonly IInventoryRepository _repository;
    private readonly IRedisService _redisService;
    private readonly ILogger<ReserveStockCommandHandler> _logger;

    public ReserveStockCommandHandler(
        IInventoryRepository repository,
        IRedisService redisService,
        ILogger<ReserveStockCommandHandler> logger)
    {
        _repository = repository;
        _redisService = redisService;
        _logger = logger;
    }

    public async Task<Result> Handle(ReserveStockCommand request, CancellationToken cancellationToken)
    {
        var reservedItemsInRedis = new List<OrderItemDto>();

        try
        {
            // TẦNG 1: Kiểm tra & Giữ chỗ tức thì trên Redis bằng Lua Script (Microsecond latency)
            foreach (var item in request.Items)
            {
                var redisStockKey = $"stock:{item.ProductId}";
                var redisSuccess = await _redisService.ReserveStockLuaAsync(redisStockKey, item.Quantity);

                if (!redisSuccess)
                {
                    _logger.LogWarning("Redis rejected stock reservation for Product {ProductId}, Order {OrderId}", item.ProductId, request.OrderId);
                    // Rollback các món đã trừ trước đó trong giỏ hàng trên Redis
                    await RollbackRedisStockAsync(reservedItemsInRedis);
                    return Result.Failure(Error.Conflict($"Product {item.ProductId} is out of stock in fast cache."));
                }

                reservedItemsInRedis.Add(item);
            }

            // TẦNG 2: PostgreSQL Atomic Conditional Update (Đảm bảo ACID tuyệt đối)
            var reservedInDb = new List<OrderItemDto>();
            foreach (var item in request.Items)
            {
                var dbSuccess = await _repository.AtomicReserveStockAsync(item.ProductId, item.Quantity, cancellationToken);
                if (!dbSuccess)
                {
                    _logger.LogError("PostgreSQL rejected atomic reservation for Product {ProductId}, Order {OrderId}", item.ProductId, request.OrderId);
                    
                    // Rollback DB cho các sản phẩm đã trừ trước
                    foreach (var rolledItem in reservedInDb)
                    {
                        await _repository.AtomicReleaseStockAsync(rolledItem.ProductId, rolledItem.Quantity, cancellationToken);
                    }

                    // Rollback toàn bộ Redis
                    await RollbackRedisStockAsync(reservedItemsInRedis);

                    return Result.Failure(Error.Conflict($"Insufficient stock in database for product {item.ProductId}."));
                }

                reservedInDb.Add(item);

                // Lưu bản ghi StockReservation với thời hạn 15 phút
                var reservation = StockReservation.Create(request.OrderId, item.ProductId, item.Quantity, TimeSpan.FromMinutes(15));
                await _repository.AddReservationAsync(reservation, cancellationToken);
            }

            await _repository.SaveChangesAsync(cancellationToken);
            _logger.LogInformation("Stock successfully reserved for Order {OrderId}", request.OrderId);

            return Result.Success();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Exception during stock reservation for Order {OrderId}", request.OrderId);
            await RollbackRedisStockAsync(reservedItemsInRedis);
            throw;
        }
    }

    private async Task RollbackRedisStockAsync(List<OrderItemDto> items)
    {
        foreach (var item in items)
        {
            var redisStockKey = $"stock:{item.ProductId}";
            await _redisService.ReleaseStockLuaAsync(redisStockKey, item.Quantity);
        }
    }
}
