using System.Text.Json;
using MassTransit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace BuildingBlocks.Outbox;

public abstract class OutboxProcessorBackgroundService<TDbContext> : BackgroundService
    where TDbContext : DbContext
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger _logger;
    private readonly TimeSpan _pollInterval;

    protected OutboxProcessorBackgroundService(
        IServiceProvider serviceProvider,
        ILogger logger,
        TimeSpan? pollInterval = null)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
        _pollInterval = pollInterval ?? TimeSpan.FromSeconds(2);
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("OutboxProcessor for {DbContext} started.", typeof(TDbContext).Name);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessOutboxBatchAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred processing outbox messages in {DbContext}", typeof(TDbContext).Name);
            }

            await Task.Delay(_pollInterval, stoppingToken);
        }

        _logger.LogInformation("OutboxProcessor for {DbContext} stopped.", typeof(TDbContext).Name);
    }

    private async Task ProcessOutboxBatchAsync(CancellationToken cancellationToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<TDbContext>();
        var publishEndpoint = scope.ServiceProvider.GetRequiredService<IPublishEndpoint>();

        var messages = await dbContext.Set<OutboxMessage>()
            .Where(m => m.ProcessedAtUtc == null && m.RetryCount < 3)
            .OrderBy(m => m.CreatedAtUtc)
            .Take(20)
            .ToListAsync(cancellationToken);

        if (messages.Count == 0) return;

        foreach (var message in messages)
        {
            try
            {
                var eventType = Type.GetType(message.EventType);
                if (eventType is null)
                {
                    message.Error = $"Cannot resolve type: {message.EventType}";
                    message.RetryCount++;
                    continue;
                }

                var eventObj = JsonSerializer.Deserialize(message.Payload, eventType);
                if (eventObj is null)
                {
                    message.Error = "Payload deserialization resulted in null";
                    message.RetryCount++;
                    continue;
                }

                await publishEndpoint.Publish(eventObj, eventType, cancellationToken);
                message.ProcessedAtUtc = DateTime.UtcNow;
                message.Error = null;

                _logger.LogInformation("Published outbox message {MessageId} of type {EventType}", message.Id, message.EventType);
            }
            catch (Exception ex)
            {
                message.RetryCount++;
                message.Error = ex.Message;
                _logger.LogWarning(ex, "Failed to publish outbox message {MessageId}. Retry count: {RetryCount}", message.Id, message.RetryCount);
            }
        }

        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
