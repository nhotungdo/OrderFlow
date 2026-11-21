using BuildingBlocks.Common;
using BuildingBlocks.Messaging;
using InventoryService.Api.Consumers;
using InventoryService.Application;
using InventoryService.Application.Commands.CommitStock;
using InventoryService.Application.Commands.ReleaseStock;
using InventoryService.Application.Commands.ReserveStock;
using InventoryService.Application.Commands.SeedProducts;
using InventoryService.Application.Queries.GetProducts;
using InventoryService.Infrastructure;
using InventoryService.Infrastructure.Persistence;
using MediatR;
using Microsoft.EntityFrameworkCore;
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

// 2. BuildingBlocks & Layer Services
builder.Services.AddCommonBuildingBlocks();
builder.Services.AddInventoryApplication();
builder.Services.AddInventoryInfrastructure(builder.Configuration);

// 3. MassTransit RabbitMQ Consumers
builder.Services.AddMessagingInfrastructure(builder.Configuration, busConfig =>
{
    busConfig.AddConsumer<OrderCreatedInventoryConsumer>();
    busConfig.AddConsumer<ReleaseStockConsumer>();
    busConfig.AddConsumer<PaymentFailedConsumer>();
    busConfig.AddConsumer<PaymentCompletedConsumer>();
});

// 4. OpenAPI Documentation
builder.Services.AddOpenApi();

var app = builder.Build();

// 5. Auto-migration & Database setup
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<InventoryDbContext>();
    await dbContext.Database.EnsureCreatedAsync();
}

app.UseExceptionHandler();
app.UseCors();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

// 6. REST Endpoints for Inventory
var inventoryGroup = app.MapGroup("/api/inventory").WithTags("Inventory");

inventoryGroup.MapGet("/products", async (ISender sender) =>
{
    var result = await sender.Send(new GetProductsQuery());
    return result.IsSuccess ? Results.Ok(result.Value) : Results.BadRequest(result.Error);
})
.WithName("GetProducts");

inventoryGroup.MapPost("/reserve", async (ReserveStockCommand command, ISender sender) =>
{
    var result = await sender.Send(command);
    return result.IsSuccess ? Results.Ok(new { message = "Stock reserved successfully" }) : Results.Conflict(result.Error);
})
.WithName("ReserveStock");

inventoryGroup.MapPost("/release", async (ReleaseStockCommand command, ISender sender) =>
{
    var result = await sender.Send(command);
    return result.IsSuccess ? Results.Ok(new { message = "Stock released successfully" }) : Results.BadRequest(result.Error);
})
.WithName("ReleaseStock");

inventoryGroup.MapPost("/commit", async (CommitStockCommand command, ISender sender) =>
{
    var result = await sender.Send(command);
    return result.IsSuccess ? Results.Ok(new { message = "Stock committed successfully" }) : Results.BadRequest(result.Error);
})
.WithName("CommitStock");

inventoryGroup.MapPost("/seed", async (ISender sender) =>
{
    var result = await sender.Send(new SeedProductsCommand());
    return result.IsSuccess ? Results.Ok(new { message = "Sample inventory seeded successfully" }) : Results.BadRequest(result.Error);
})
.WithName("SeedProducts");

app.Run();
