using BuildingBlocks.Common.Results;
using BuildingBlocks.Redis;
using InventoryService.Domain.Repositories;
using MediatR;
using Microsoft.Extensions.Logging;

namespace InventoryService.Application.Commands.ReleaseStock;

public record ReleaseStockCommand(Guid OrderId, string Reason) : IRequest<Result>;

public class ReleaseStockCommandHandler : IRequestHandler<ReleaseStockCommand, Result>
{
    private readonly IInventoryRepository _repository;
    private readonly IRedisService _redisService;
    private readonly ILogger<ReleaseStockCommandHandler> _logger;

    public ReleaseStockCommandHandler(
        IInventoryRepository repository,
        IRedisService redisService,
        ILogger<ReleaseStockCommandHandler> logger)
    {
        _repository = repository;
        _redisService = redisService;
        _logger = logger;
    }

    public async Task<Result> Handle(ReleaseStockCommand request, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Releasing reserved stock for Order {OrderId}. Reason: {Reason}", request.OrderId, request.Reason);

        var activeReservations = await _repository.GetActiveReservationsByOrderIdAsync(request.OrderId, cancellationToken);
        if (activeReservations.Count == 0)
        {
            _logger.LogWarning("No active stock reservations found to release for Order {OrderId}", request.OrderId);
            return Result.Success();
        }

        foreach (var reservation in activeReservations)
        {
            // 1. Hoàn lại kho trong PostgreSQL
            await _repository.AtomicReleaseStockAsync(reservation.ProductId, reservation.Quantity, cancellationToken);

            // 2. Tăng lại kho trong Redis qua Lua Script
            var redisStockKey = $"stock:{reservation.ProductId}";
            await _redisService.ReleaseStockLuaAsync(redisStockKey, reservation.Quantity);

            // 3. Đánh dấu bản ghi reservation là Released
            reservation.MarkAsReleased();
        }

        await _repository.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("Successfully released stock for Order {OrderId}", request.OrderId);

        return Result.Success();
    }
}
