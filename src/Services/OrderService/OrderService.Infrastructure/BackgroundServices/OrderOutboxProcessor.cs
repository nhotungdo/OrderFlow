using BuildingBlocks.Outbox;
using Microsoft.Extensions.Logging;
using OrderService.Infrastructure.Persistence;

namespace OrderService.Infrastructure.BackgroundServices;

public class OrderOutboxProcessor : OutboxProcessorBackgroundService<OrderDbContext>
{
    public OrderOutboxProcessor(
        IServiceProvider serviceProvider,
        ILogger<OrderOutboxProcessor> logger)
        : base(serviceProvider, logger, TimeSpan.FromSeconds(2))
    {
    }
}
