using BuildingBlocks.Messaging.Contracts;
using MassTransit;
using MediatR;
using Microsoft.Extensions.Logging;
using PaymentService.Application.Commands.ProcessPayment;

namespace PaymentService.Api.Consumers;

public class StockReservedPaymentConsumer : IConsumer<IStockReservedEvent>
{
    private readonly ISender _sender;
    private readonly ILogger<StockReservedPaymentConsumer> _logger;

    public StockReservedPaymentConsumer(ISender sender, ILogger<StockReservedPaymentConsumer> logger)
    {
        _sender = sender;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<IStockReservedEvent> context)
    {
        var msg = context.Message;
        _logger.LogInformation("PaymentService: Received IStockReservedEvent for Order {OrderId}, Amount {Amount}, Method {Method}. Initiating payment processing...",
            msg.OrderId, msg.TotalAmount, msg.PaymentMethod);

        await _sender.Send(new ProcessPaymentCommand(
            msg.OrderId,
            msg.TotalAmount,
            msg.PaymentMethod));
    }
}
