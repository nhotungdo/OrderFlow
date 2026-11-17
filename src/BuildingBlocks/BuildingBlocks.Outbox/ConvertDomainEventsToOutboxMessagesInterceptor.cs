using System.Text.Json;
using BuildingBlocks.Common.Primitives;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace BuildingBlocks.Outbox;

public sealed class ConvertDomainEventsToOutboxMessagesInterceptor : SaveChangesInterceptor
{
    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData,
        InterceptionResult<int> result,
        CancellationToken cancellationToken = default)
    {
        var dbContext = eventData.Context;
        if (dbContext is null)
        {
            return base.SavingChangesAsync(eventData, result, cancellationToken);
        }

        var domainEvents = dbContext.ChangeTracker
            .Entries<IAggregateRoot>()
            .Select(x => x.Entity)
            .SelectMany(aggregateRoot =>
            {
                var events = aggregateRoot.DomainEvents.ToList();
                aggregateRoot.ClearDomainEvents();
                return events;
            })
            .ToList();

        if (domainEvents.Count != 0)
        {
            var outboxMessages = domainEvents.Select(domainEvent => new OutboxMessage
            {
                Id = Guid.NewGuid(),
                EventType = domainEvent.GetType().AssemblyQualifiedName ?? domainEvent.GetType().Name,
                Payload = JsonSerializer.Serialize(domainEvent, domainEvent.GetType()),
                CreatedAtUtc = DateTime.UtcNow,
                RetryCount = 0
            }).ToList();

            dbContext.Set<OutboxMessage>().AddRange(outboxMessages);
        }

        return base.SavingChangesAsync(eventData, result, cancellationToken);
    }
}
