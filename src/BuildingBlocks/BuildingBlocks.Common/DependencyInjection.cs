using BuildingBlocks.Common.Behaviors;
using BuildingBlocks.Common.Exceptions;
using MediatR;
using Microsoft.Extensions.DependencyInjection;

namespace BuildingBlocks.Common;

public static class DependencyInjection
{
    public static IServiceCollection AddCommonBuildingBlocks(this IServiceCollection services)
    {
        services.AddExceptionHandler<GlobalExceptionHandler>();
        services.AddProblemDetails();

        services.AddTransient(typeof(IPipelineBehavior<,>), typeof(LoggingBehavior<,>));
        services.AddTransient(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));

        return services;
    }
}
