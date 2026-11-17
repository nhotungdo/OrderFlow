using BuildingBlocks.Messaging.Contracts;
using MassTransit;
using MediatR;
using OrderService.Application.Commands.CancelOrder;
using OrderService.Application.Commands.PayOrder;

namespace OrderService.Api.Consumers;

public class OrderPaymentCompletedConsumer : IConsumer<IPaymentCompletedEvent>
{
    private readonly ISender _sender;
    private readonly ILogger<OrderPaymentCompletedConsumer> _logger;

    public OrderPaymentCompletedConsumer(ISender sender, ILogger<OrderPaymentCompletedConsumer> logger)
    {
        _sender = sender;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<IPaymentCompletedEvent> context)
    {
        _logger.LogInformation("OrderService: Received IPaymentCompletedEvent for Order {OrderId}", context.Message.OrderId);
        await _sender.Send(new PayOrderCommand(context.Message.OrderId));
    }
}

public class OrderPaymentFailedConsumer : IConsumer<IPaymentFailedEvent>
{
    private readonly ISender _sender;
    private readonly ILogger<OrderPaymentFailedConsumer> _logger;

    public OrderPaymentFailedConsumer(ISender sender, ILogger<OrderPaymentFailedConsumer> logger)
    {
        _sender = sender;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<IPaymentFailedEvent> context)
    {
        _logger.LogWarning("OrderService: Received IPaymentFailedEvent for Order {OrderId}. Cancelling order...", context.Message.OrderId);
        await _sender.Send(new CancelOrderCommand(context.Message.OrderId, $"Payment Failed: {context.Message.Reason}"));
    }
}

public class OrderStockReservationFailedConsumer : IConsumer<IStockReservationFailedEvent>
{
    private readonly ISender _sender;
    private readonly ILogger<OrderStockReservationFailedConsumer> _logger;

    public OrderStockReservationFailedConsumer(ISender sender, ILogger<OrderStockReservationFailedConsumer> logger)
    {
        _sender = sender;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<IStockReservationFailedEvent> context)
    {
        _logger.LogWarning("OrderService: Received IStockReservationFailedEvent for Order {OrderId}. Cancelling order...", context.Message.OrderId);
        await _sender.Send(new CancelOrderCommand(context.Message.OrderId, $"Out of Stock: {context.Message.Reason}"));
    }
}
