namespace InventoryService.Application.DTOs;

public record OrderItemDto(Guid ProductId, int Quantity);

public record ProductDto(
    Guid Id,
    string Sku,
    string ProductName,
    decimal UnitPrice,
    int TotalQuantity,
    int AvailableQuantity,
    int ReservedQuantity,
    int RedisStock
);
