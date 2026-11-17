using BuildingBlocks.Common.Results;
using InventoryService.Domain.Repositories;
using MediatR;
using Microsoft.Extensions.Logging;

namespace InventoryService.Application.Commands.CommitStock;

public record CommitStockCommand(Guid OrderId) : IRequest<Result>;

public class CommitStockCommandHandler : IRequestHandler<CommitStockCommand, Result>
{
    private readonly IInventoryRepository _repository;
    private readonly ILogger<CommitStockCommandHandler> _logger;

    public CommitStockCommandHandler(
        IInventoryRepository repository,
        ILogger<CommitStockCommandHandler> logger)
    {
        _repository = repository;
        _logger = logger;
    }

    public async Task<Result> Handle(CommitStockCommand request, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Committing stock deduction for Order {OrderId}", request.OrderId);

        var activeReservations = await _repository.GetActiveReservationsByOrderIdAsync(request.OrderId, cancellationToken);
        if (activeReservations.Count == 0)
        {
            _logger.LogWarning("No active stock reservations found to commit for Order {OrderId}", request.OrderId);
            return Result.Success();
        }

        foreach (var reservation in activeReservations)
        {
            // Trừ vĩnh viễn khỏi TotalQuantity trong PostgreSQL
            await _repository.AtomicCommitStockAsync(reservation.ProductId, reservation.Quantity, cancellationToken);
            reservation.MarkAsCommitted();
        }

        await _repository.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("Successfully committed stock for Order {OrderId}", request.OrderId);

        return Result.Success();
    }
}
