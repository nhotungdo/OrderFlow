using BuildingBlocks.Common;
using BuildingBlocks.Messaging;
using MediatR;
using Microsoft.EntityFrameworkCore;
using PaymentService.Api.Consumers;
using PaymentService.Application;
using PaymentService.Application.Commands.ProcessPayment;
using PaymentService.Application.Queries.GetPaymentByOrderId;
using PaymentService.Infrastructure;
using PaymentService.Infrastructure.Persistence;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// 1. CORS Policy
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// 2. Core Layers & BuildingBlocks
builder.Services.AddCommonBuildingBlocks();
builder.Services.AddPaymentApplication();
builder.Services.AddPaymentInfrastructure(builder.Configuration);

// 3. MassTransit RabbitMQ Consumers
builder.Services.AddMessagingInfrastructure(builder.Configuration, busConfig =>
{
    busConfig.AddConsumer<StockReservedPaymentConsumer>();
});

// 4. OpenAPI Documentation
builder.Services.AddOpenApi();

var app = builder.Build();

// 5. Auto-migration
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<PaymentDbContext>();
    await dbContext.Database.EnsureCreatedAsync();
}

app.UseExceptionHandler();
app.UseCors();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

// 6. REST Minimal Endpoints for Payments
var paymentsGroup = app.MapGroup("/api/payments").WithTags("Payments");

paymentsGroup.MapPost("/simulate", async (ProcessPaymentCommand command, ISender sender) =>
{
    var result = await sender.Send(command);
    return result.IsSuccess ? Results.Ok(result.Value) : Results.Conflict(result.Error);
})
.WithName("SimulatePayment");

paymentsGroup.MapGet("/{orderId:guid}", async (Guid orderId, ISender sender) =>
{
    var result = await sender.Send(new GetPaymentByOrderIdQuery(orderId));
    return result.IsSuccess ? Results.Ok(result.Value) : Results.NotFound(result.Error);
})
.WithName("GetPaymentByOrderId");

app.Run();
