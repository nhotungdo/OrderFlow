using Microsoft.EntityFrameworkCore;

namespace BuildingBlocks.Idempotency;

public class EfCoreIdempotencyStore<TDbContext> : IIdempotencyStore
    where TDbContext : DbContext
{
    private readonly TDbContext _dbContext;

    public EfCoreIdempotencyStore(TDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IdempotentRequest?> GetByKeyAsync(string key, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Set<IdempotentRequest>()
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Key == key, cancellationToken);
    }

    public async Task SaveAsync(IdempotentRequest request, CancellationToken cancellationToken = default)
    {
        await _dbContext.Set<IdempotentRequest>().AddAsync(request, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateAsync(IdempotentRequest request, CancellationToken cancellationToken = default)
    {
        _dbContext.Set<IdempotentRequest>().Update(request);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }
}
