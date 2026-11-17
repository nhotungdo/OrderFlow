using BuildingBlocks.Common;
using BuildingBlocks.Idempotency;
using BuildingBlocks.Messaging;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using OrderService.Api.Consumers;
using OrderService.Application;
using OrderService.Application.Commands.CreateOrder;
using OrderService.Application.DTOs;
using OrderService.Application.Queries.GetOrderById;
using OrderService.Application.Queries.GetOrders;
using OrderService.Infrastructure;
using OrderService.Infrastructure.Persistence;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// 1. Core Layers & BuildingBlocks
builder.Services.AddControllers(); // Needed for ActionFilter-based IdempotentAttribute
builder.Services.AddCommonBuildingBlocks();
builder.Services.AddOrderApplication();
builder.Services.AddOrderInfrastructure(builder.Configuration);

// 2. MassTransit RabbitMQ
builder.Services.AddMessagingInfrastructure(builder.Configuration, busConfig =>
{
    busConfig.AddConsumer<OrderPaymentCompletedConsumer>();
    busConfig.AddConsumer<OrderPaymentFailedConsumer>();
    busConfig.AddConsumer<OrderStockReservationFailedConsumer>();
});

// 3. OpenAPI Documentation
builder.Services.AddOpenApi();

var app = builder.Build();

// 4. Auto-migration
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<OrderDbContext>();
    await dbContext.Database.EnsureCreatedAsync();
}

app.UseExceptionHandler();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

app.MapControllers();

// 5. REST Minimal Endpoints for Orders
var ordersGroup = app.MapGroup("/api/orders").WithTags("Orders");

ordersGroup.MapGet("/", async (ISender sender) =>
{
    var result = await sender.Send(new GetOrdersQuery());
    return result.IsSuccess ? Results.Ok(result.Value) : Results.BadRequest(result.Error);
})
.WithName("GetOrders");

ordersGroup.MapGet("/{id:guid}", async (Guid id, ISender sender) =>
{
    var result = await sender.Send(new GetOrderByIdQuery(id));
    return result.IsSuccess ? Results.Ok(result.Value) : Results.NotFound(result.Error);
})
.WithName("GetOrderById");

app.Run();
