using BuildingBlocks.Common.Results;
using MediatR;
using Microsoft.Extensions.Logging;
using OrderService.Application.DTOs;
using OrderService.Domain.Entities;
using OrderService.Domain.Repositories;

namespace OrderService.Application.Commands.CreateOrder;

public record CreateOrderCommand(
    Guid CustomerId,
    string PaymentMethod,
    string? IdempotencyKey,
    List<CreateOrderItemRequest> Items) : IRequest<Result<OrderResponseDto>>;

public class CreateOrderCommandHandler : IRequestHandler<CreateOrderCommand, Result<OrderResponseDto>>
{
    private readonly IOrderRepository _orderRepository;
    private readonly ILogger<CreateOrderCommandHandler> _logger;

    public CreateOrderCommandHandler(
        IOrderRepository orderRepository,
        ILogger<CreateOrderCommandHandler> logger)
    {
        _orderRepository = orderRepository;
        _logger = logger;
    }

    public async Task<Result<OrderResponseDto>> Handle(CreateOrderCommand request, CancellationToken cancellationToken)
    {
        var orderId = Guid.NewGuid();
        var orderCode = $"ORD-{DateTime.UtcNow:yyyyMMdd}-{orderId.ToString()[..8].ToUpper()}";

        _logger.LogInformation("Creating order {OrderCode} with {ItemCount} items. IdempotencyKey: {Key}",
            orderCode, request.Items.Count, request.IdempotencyKey);

        var domainItems = request.Items.Select(i => (i.ProductId, i.ProductName, i.UnitPrice, i.Quantity)).ToList();

        var order = Order.Create(
            orderId,
            orderCode,
            request.CustomerId,
            request.PaymentMethod,
            request.IdempotencyKey,
            domainItems);

        await _orderRepository.AddAsync(order, cancellationToken);
        // Lưu Order + OutboxMessage vào PostgreSQL trong 1 giao dịch ACID nguyên tử
        await _orderRepository.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Order {OrderCode} created and Outbox event queued successfully.", orderCode);

        var responseDto = new OrderResponseDto(
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

        return Result.Success(responseDto);
    }
}
