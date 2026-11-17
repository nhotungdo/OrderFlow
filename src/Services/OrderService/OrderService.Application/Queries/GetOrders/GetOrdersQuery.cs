using BuildingBlocks.Common.Results;
using MediatR;
using OrderService.Application.DTOs;
using OrderService.Domain.Repositories;

namespace OrderService.Application.Queries.GetOrders;

public record GetOrdersQuery : IRequest<Result<List<OrderResponseDto>>>;

public class GetOrdersQueryHandler : IRequestHandler<GetOrdersQuery, Result<List<OrderResponseDto>>>
{
    private readonly IOrderRepository _repository;

    public GetOrdersQueryHandler(IOrderRepository repository)
    {
        _repository = repository;
    }

    public async Task<Result<List<OrderResponseDto>>> Handle(GetOrdersQuery request, CancellationToken cancellationToken)
    {
        var orders = await _repository.GetAllAsync(cancellationToken);

        var dtos = orders.Select(order => new OrderResponseDto(
            order.Id,
            order.OrderCode,
            order.CustomerId,
            order.TotalAmount,
            order.Status.ToString(),
            order.PaymentMethod,
            order.FailureReason,
            order.IdempotencyKey,
            order.CreatedAtUtc,
            order.Items.Select(x => new OrderItemDto(x.Id, x.ProductId, x.ProductName, x.UnitPrice, x.Quantity, x.TotalPrice)).ToList()
        )).ToList();

        return Result.Success(dtos);
    }
}
