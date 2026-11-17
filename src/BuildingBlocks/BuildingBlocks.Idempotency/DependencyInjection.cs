using Microsoft.Extensions.DependencyInjection;

namespace BuildingBlocks.Idempotency;

public static class DependencyInjection
{
    public static IServiceCollection AddIdempotencyServices(this IServiceCollection services)
    {
        services.AddScoped<IdempotentAttribute>();
        return services;
    }
}
