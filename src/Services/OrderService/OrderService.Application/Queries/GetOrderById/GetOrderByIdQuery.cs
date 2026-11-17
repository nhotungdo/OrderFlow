using BuildingBlocks.Common.Results;
using MediatR;
using OrderService.Application.DTOs;
using OrderService.Domain.Repositories;

namespace OrderService.Application.Queries.GetOrderById;

public record GetOrderByIdQuery(Guid Id) : IRequest<Result<OrderResponseDto>>;

public class GetOrderByIdQueryHandler : IRequestHandler<GetOrderByIdQuery, Result<OrderResponseDto>>
{
    private readonly IOrderRepository _repository;

    public GetOrderByIdQueryHandler(IOrderRepository repository)
    {
        _repository = repository;
    }

    public async Task<Result<OrderResponseDto>> Handle(GetOrderByIdQuery request, CancellationToken cancellationToken)
    {
        var order = await _repository.GetByIdAsync(request.Id, cancellationToken);
        if (order is null)
            return Result.Failure<OrderResponseDto>(Error.NotFound(nameof(order), request.Id));

        var dto = new OrderResponseDto(
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
        );

        return Result.Success(dto);
    }
}
