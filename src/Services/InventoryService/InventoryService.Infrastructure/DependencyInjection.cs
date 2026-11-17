using BuildingBlocks.Redis;
using InventoryService.Domain.Repositories;
using InventoryService.Infrastructure.Persistence;
using InventoryService.Infrastructure.Persistence.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace InventoryService.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInventoryInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("Database")
            ?? "Host=localhost;Port=5432;Database=orderflow_inventory;Username=orderflow_admin;Password=orderflow_secret";

        services.AddDbContext<InventoryDbContext>(options =>
            options.UseNpgsql(connectionString));

        services.AddScoped<IInventoryRepository, InventoryRepository>();

        // Tích hợp Redis Lua Infrastructure
        services.AddRedisInfrastructure(configuration);

        return services;
    }
}
