using BuildingBlocks.Messaging.Contracts;
using InventoryService.Application.Commands.ReserveStock;
using InventoryService.Application.DTOs;
using MassTransit;
using MediatR;
using Microsoft.Extensions.Logging;

namespace InventoryService.Api.Consumers;

public class OrderCreatedInventoryConsumer : IConsumer<IOrderCreatedEvent>
{
    private readonly ISender _sender;
    private readonly IPublishEndpoint _publishEndpoint;
    private readonly ILogger<OrderCreatedInventoryConsumer> _logger;

    public OrderCreatedInventoryConsumer(
        ISender sender,
        IPublishEndpoint publishEndpoint,
        ILogger<OrderCreatedInventoryConsumer> logger)
    {
        _sender = sender;
        _publishEndpoint = publishEndpoint;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<IOrderCreatedEvent> context)
    {
        var msg = context.Message;
        _logger.LogInformation("InventoryService: Received IOrderCreatedEvent for Order {OrderId}, Code {OrderCode}. Initiating 2-Tier stock reservation...",
            msg.OrderId, msg.OrderCode);

        var items = msg.Items.Select(x => new OrderItemDto(x.ProductId, x.Quantity)).ToList();
        var reserveResult = await _sender.Send(new ReserveStockCommand(msg.OrderId, items));

        if (reserveResult.IsSuccess)
        {
            _logger.LogInformation("InventoryService: Stock reserved successfully for Order {OrderId}. Publishing IStockReservedEvent...", msg.OrderId);
            
            // Bắn sự kiện giữ kho thành công -> PaymentService sẽ lắng nghe để trừ tiền
            await _publishEndpoint.Publish<IStockReservedEvent>(new StockReservedEvent(
                msg.OrderId,
                msg.CustomerId,
                msg.TotalAmount,
                msg.PaymentMethod,
                DateTime.UtcNow
            ), context.CancellationToken);
        }
        else
        {
            _logger.LogWarning("InventoryService: Stock reservation FAILED for Order {OrderId}. Reason: {Reason}. Publishing IStockReservationFailedEvent...",
                msg.OrderId, reserveResult.Error.Message);

            // Bắn sự kiện thất bại -> OrderService sẽ lắng nghe để hủy đơn do hết hàng
            await _publishEndpoint.Publish<IStockReservationFailedEvent>(new StockReservationFailedEvent(
                msg.OrderId,
                reserveResult.Error.Message,
                DateTime.UtcNow
            ), context.CancellationToken);
        }
    }
}
