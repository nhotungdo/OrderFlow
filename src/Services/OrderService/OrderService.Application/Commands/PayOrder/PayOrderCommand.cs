using BuildingBlocks.Common.Results;
using MediatR;
using Microsoft.Extensions.Logging;
using OrderService.Domain.Repositories;

namespace OrderService.Application.Commands.PayOrder;

public record PayOrderCommand(Guid OrderId) : IRequest<Result>;

public class PayOrderCommandHandler : IRequestHandler<PayOrderCommand, Result>
{
    private readonly IOrderRepository _repository;
    private readonly ILogger<PayOrderCommandHandler> _logger;

    public PayOrderCommandHandler(IOrderRepository repository, ILogger<PayOrderCommandHandler> logger)
    {
        _repository = repository;
        _logger = logger;
    }

    public async Task<Result> Handle(PayOrderCommand request, CancellationToken cancellationToken)
    {
        var order = await _repository.GetByIdAsync(request.OrderId, cancellationToken);
        if (order is null)
            return Result.Failure(Error.NotFound(nameof(order), request.OrderId));

        var payResult = order.MarkAsPaid();
        if (payResult.IsFailure)
            return payResult;

        await _repository.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("Order {OrderCode} marked as PAID.", order.OrderCode);

        return Result.Success();
    }
}
