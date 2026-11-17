using BuildingBlocks.Common.Results;
using BuildingBlocks.Redis;
using InventoryService.Application.DTOs;
using InventoryService.Domain.Repositories;
using MediatR;

namespace InventoryService.Application.Queries.GetProducts;

public record GetProductsQuery : IRequest<Result<List<ProductDto>>>;

public class GetProductsQueryHandler : IRequestHandler<GetProductsQuery, Result<List<ProductDto>>>
{
    private readonly IInventoryRepository _repository;
    private readonly IRedisService _redisService;

    public GetProductsQueryHandler(
        IInventoryRepository repository,
        IRedisService redisService)
    {
        _repository = repository;
        _redisService = redisService;
    }

    public async Task<Result<List<ProductDto>>> Handle(GetProductsQuery request, CancellationToken cancellationToken)
    {
        var products = await _repository.GetAllAsync(cancellationToken);

        var dtos = new List<ProductDto>();
        foreach (var p in products)
        {
            var redisVal = await _redisService.GetStringAsync($"stock:{p.Id}");
            var redisStock = int.TryParse(redisVal, out var stock) ? stock : p.AvailableQuantity;

            dtos.Add(new ProductDto(
                p.Id,
                p.Sku,
                p.ProductName,
                p.UnitPrice,
                p.TotalQuantity,
                p.AvailableQuantity,
                p.ReservedQuantity,
                redisStock
            ));
        }

        return Result.Success(dtos);
    }
}
