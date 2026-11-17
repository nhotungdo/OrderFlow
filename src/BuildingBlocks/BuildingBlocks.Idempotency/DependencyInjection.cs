using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace BuildingBlocks.Idempotency;

public static class DependencyInjection
{
    public static IServiceCollection AddIdempotencyServices<TDbContext>(this IServiceCollection services)
        where TDbContext : DbContext
    {
        services.AddScoped<IIdempotencyStore, EfCoreIdempotencyStore<TDbContext>>();
        services.AddScoped<IdempotentAttribute>();
        return services;
    }
}
