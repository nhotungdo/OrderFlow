using BuildingBlocks.Idempotency;
using BuildingBlocks.Outbox;
using BuildingBlocks.Redis;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using OrderService.Domain.Repositories;
using OrderService.Infrastructure.BackgroundServices;
using OrderService.Infrastructure.Persistence;
using OrderService.Infrastructure.Persistence.Repositories;

namespace OrderService.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddOrderInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("Database")
            ?? "Host=localhost;Port=5432;Database=orderflow_orders;Username=orderflow_admin;Password=orderflow_secret";

        // Register Outbox Interceptor
        services.AddOutboxInfrastructure();

        services.AddDbContext<OrderDbContext>((sp, options) =>
        {
            var interceptor = sp.GetRequiredService<ConvertDomainEventsToOutboxMessagesInterceptor>();
            options.UseNpgsql(connectionString)
                   .AddInterceptors(interceptor);
        });

        services.AddScoped<IOrderRepository, OrderRepository>();

        // Register Outbox Background Publisher
        services.AddHostedService<OrderOutboxProcessor>();

        // Register Redis & Idempotency Services with OrderDbContext
        services.AddRedisInfrastructure(configuration);
        services.AddIdempotencyServices<OrderDbContext>();

        return services;
    }
}
