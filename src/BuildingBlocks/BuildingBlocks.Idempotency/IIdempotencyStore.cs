namespace BuildingBlocks.Idempotency;

public interface IIdempotencyStore
{
    Task<IdempotentRequest?> GetByKeyAsync(string key, CancellationToken cancellationToken = default);
    Task SaveAsync(IdempotentRequest request, CancellationToken cancellationToken = default);
    Task UpdateAsync(IdempotentRequest request, CancellationToken cancellationToken = default);
}
