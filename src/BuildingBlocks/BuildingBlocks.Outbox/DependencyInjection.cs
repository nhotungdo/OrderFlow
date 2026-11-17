using Microsoft.Extensions.DependencyInjection;

namespace BuildingBlocks.Outbox;

public static class DependencyInjection
{
    public static IServiceCollection AddOutboxInfrastructure(this IServiceCollection services)
    {
        services.AddSingleton<ConvertDomainEventsToOutboxMessagesInterceptor>();
        return services;
    }
}
