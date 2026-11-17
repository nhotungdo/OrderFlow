using BuildingBlocks.Messaging.Contracts;
using InventoryService.Application.Commands.ReleaseStock;
using MassTransit;
using MediatR;

namespace InventoryService.Api.Consumers;

public class ReleaseStockConsumer : IConsumer<IReleaseStockCommand>
{
    private readonly ISender _sender;
    private readonly ILogger<ReleaseStockConsumer> _logger;

    public ReleaseStockConsumer(ISender sender, ILogger<ReleaseStockConsumer> logger)
    {
        _sender = sender;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<IReleaseStockCommand> context)
    {
        _logger.LogInformation("Consuming IReleaseStockCommand for Order {OrderId}", context.Message.OrderId);
        await _sender.Send(new ReleaseStockCommand(context.Message.OrderId, context.Message.Reason));
    }
}
