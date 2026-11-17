using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using StackExchange.Redis;

namespace BuildingBlocks.Redis;

public static class DependencyInjection
{
    public static IServiceCollection AddRedisInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var redisConn = configuration.GetConnectionString("Redis") ?? "localhost:6379";
        
        services.AddSingleton<IConnectionMultiplexer>(_ => 
            ConnectionMultiplexer.Connect(ConfigurationOptions.Parse(redisConn, true)));

        services.AddSingleton<IRedisService, RedisService>();

        return services;
    }
}
