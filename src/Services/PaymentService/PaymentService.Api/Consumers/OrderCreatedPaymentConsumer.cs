using BuildingBlocks.Messaging.Contracts;
using MassTransit;
using MediatR;
using PaymentService.Application.Commands.ProcessPayment;

namespace PaymentService.Api.Consumers;

public class OrderCreatedPaymentConsumer : IConsumer<IOrderCreatedEvent>
{
    private readonly ISender _sender;
    private readonly ILogger<OrderCreatedPaymentConsumer> _logger;

    public OrderCreatedPaymentConsumer(ISender sender, ILogger<OrderCreatedPaymentConsumer> logger)
    {
        _sender = sender;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<IOrderCreatedEvent> context)
    {
        _logger.LogInformation("PaymentService: Consuming IOrderCreatedEvent for Order {OrderId}, Code {OrderCode}, Amount {Amount}, Method {Method}",
            context.Message.OrderId, context.Message.OrderCode, context.Message.TotalAmount, context.Message.PaymentMethod);

        // Tự động xử lý thanh toán dựa trên PaymentMethod của đơn hàng
        await _sender.Send(new ProcessPaymentCommand(
            context.Message.OrderId,
            context.Message.TotalAmount,
            context.Message.PaymentMethod));
    }
}
