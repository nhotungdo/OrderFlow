using System.Reflection;
using BuildingBlocks.Common.Behaviors;
using MediatR;
using Microsoft.Extensions.DependencyInjection;

namespace PaymentService.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddPaymentApplication(this IServiceCollection services)
    {
        var assembly = Assembly.GetExecutingAssembly();

        services.AddMediatR(cfg =>
        {
            cfg.RegisterServicesFromAssembly(assembly);
            cfg.AddOpenBehavior(typeof(LoggingBehavior<,>));
        });

        return services;
    }
}
