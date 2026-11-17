using BuildingBlocks.Common.Results;
using BuildingBlocks.Redis;
using InventoryService.Domain.Entities;
using InventoryService.Domain.Repositories;
using MediatR;
using Microsoft.Extensions.Logging;

namespace InventoryService.Application.Commands.SeedProducts;

public record SeedProductsCommand : IRequest<Result>;

public class SeedProductsCommandHandler : IRequestHandler<SeedProductsCommand, Result>
{
    private readonly IInventoryRepository _repository;
    private readonly IRedisService _redisService;
    private readonly ILogger<SeedProductsCommandHandler> _logger;

    public static readonly Guid IPhone16ProId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    public static readonly Guid MacProM3Id = Guid.Parse("22222222-2222-2222-2222-222222222222");
    public static readonly Guid SonyHeadphonesId = Guid.Parse("33333333-3333-3333-3333-333333333333");
    public static readonly Guid AirpodsProId = Guid.Parse("44444444-4444-4444-4444-444444444444");

    public SeedProductsCommandHandler(
        IInventoryRepository repository,
        IRedisService redisService,
        ILogger<SeedProductsCommandHandler> logger)
    {
        _repository = repository;
        _redisService = redisService;
        _logger = logger;
    }

    public async Task<Result> Handle(SeedProductsCommand request, CancellationToken cancellationToken)
    {
        var existing = await _repository.GetAllAsync(cancellationToken);
        if (existing.Count > 0)
        {
            _logger.LogInformation("Products already seeded.");
            return Result.Success();
        }

        var sampleProducts = new List<ProductInventory>
        {
            ProductInventory.Create(IPhone16ProId, "IPHONE-16-PRO", "iPhone 16 Pro Max 256GB - Titan Tự Nhiên", 32990000m, 10), // Giới hạn chỉ 10 món để test race condition
            ProductInventory.Create(MacProM3Id, "MACBOOK-M3-PRO", "MacBook Pro 14 M3 Pro (18GB/512GB)", 49990000m, 20),
            ProductInventory.Create(SonyHeadphonesId, "SONY-WH-1000XM5", "Tai nghe Sony WH-1000XM5 Chống Ồn", 6990000m, 50),
            ProductInventory.Create(AirpodsProId, "AIRPODS-PRO-2", "Apple AirPods Pro 2 MagSafe (USB-C)", 5490000m, 100)
        };

        foreach (var product in sampleProducts)
        {
            await _repository.AddProductAsync(product, cancellationToken);
            // Đồng bộ stock vào Redis
            await _redisService.SetStringAsync($"stock:{product.Id}", product.AvailableQuantity.ToString());
        }

        await _repository.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("Successfully seeded sample products into PostgreSQL and Redis.");

        return Result.Success();
    }
}
