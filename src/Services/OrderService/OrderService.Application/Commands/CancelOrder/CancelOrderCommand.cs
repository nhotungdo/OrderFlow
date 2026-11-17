using BuildingBlocks.Common.Results;
using MediatR;
using Microsoft.Extensions.Logging;
using OrderService.Domain.Repositories;

namespace OrderService.Application.Commands.CancelOrder;

public record CancelOrderCommand(Guid OrderId, string Reason) : IRequest<Result>;

public class CancelOrderCommandHandler : IRequestHandler<CancelOrderCommand, Result>
{
    private readonly IOrderRepository _repository;
    private readonly ILogger<CancelOrderCommandHandler> _logger;

    public CancelOrderCommandHandler(IOrderRepository repository, ILogger<CancelOrderCommandHandler> logger)
    {
        _repository = repository;
        _logger = logger;
    }

    public async Task<Result> Handle(CancelOrderCommand request, CancellationToken cancellationToken)
    {
        var order = await _repository.GetByIdAsync(request.OrderId, cancellationToken);
        if (order is null)
            return Result.Failure(Error.NotFound(nameof(order), request.OrderId));

        var cancelResult = order.MarkAsCancelled(request.Reason);
        if (cancelResult.IsFailure)
            return cancelResult;

        await _repository.SaveChangesAsync(cancellationToken);
        _logger.LogWarning("Order {OrderCode} marked as CANCELLED. Reason: {Reason}", order.OrderCode, request.Reason);

        return Result.Success();
    }
}
