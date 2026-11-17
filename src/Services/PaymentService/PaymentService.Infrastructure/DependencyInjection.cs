using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using PaymentService.Domain.Repositories;
using PaymentService.Infrastructure.Persistence;
using PaymentService.Infrastructure.Persistence.Repositories;

namespace PaymentService.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddPaymentInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("Database")
            ?? "Host=localhost;Port=5432;Database=orderflow_payments;Username=orderflow_admin;Password=orderflow_secret";

        services.AddDbContext<PaymentDbContext>(options =>
            options.UseNpgsql(connectionString));

        services.AddScoped<IPaymentRepository, PaymentRepository>();

        return services;
    }
}
