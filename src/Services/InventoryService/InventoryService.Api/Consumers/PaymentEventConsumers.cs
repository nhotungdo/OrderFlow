using BuildingBlocks.Messaging.Contracts;
using InventoryService.Application.Commands.CommitStock;
using InventoryService.Application.Commands.ReleaseStock;
using MassTransit;
using MediatR;

namespace InventoryService.Api.Consumers;

public class PaymentFailedConsumer : IConsumer<IPaymentFailedEvent>
{
    private readonly ISender _sender;
    private readonly ILogger<PaymentFailedConsumer> _logger;

    public PaymentFailedConsumer(ISender sender, ILogger<PaymentFailedConsumer> logger)
    {
        _sender = sender;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<IPaymentFailedEvent> context)
    {
        _logger.LogWarning("Consuming IPaymentFailedEvent for Order {OrderId}. Initiating stock compensation...", context.Message.OrderId);
        await _sender.Send(new ReleaseStockCommand(context.Message.OrderId, $"Compensating after payment failure: {context.Message.Reason}"));
    }
}

public class PaymentCompletedConsumer : IConsumer<IPaymentCompletedEvent>
{
    private readonly ISender _sender;
    private readonly ILogger<PaymentCompletedConsumer> _logger;

    public PaymentCompletedConsumer(ISender sender, ILogger<PaymentCompletedConsumer> logger)
    {
        _sender = sender;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<IPaymentCompletedEvent> context)
    {
        _logger.LogInformation("Consuming IPaymentCompletedEvent for Order {OrderId}. Committing stock deduction...", context.Message.OrderId);
        await _sender.Send(new CommitStockCommand(context.Message.OrderId));
    }
}
