namespace BuildingBlocks.Common.Primitives;

public interface IDomainEvent
{
    Guid EventId => Guid.NewGuid();
    DateTime OccurredOnUtc => DateTime.UtcNow;
}
