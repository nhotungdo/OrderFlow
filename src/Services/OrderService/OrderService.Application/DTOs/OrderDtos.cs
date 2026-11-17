namespace OrderService.Application.DTOs;

public record CreateOrderItemRequest(Guid ProductId, string ProductName, decimal UnitPrice, int Quantity);

public record CreateOrderRequest(Guid CustomerId, string PaymentMethod, List<CreateOrderItemRequest> Items);

public record OrderItemDto(Guid Id, Guid ProductId, string ProductName, decimal UnitPrice, int Quantity, decimal TotalPrice);

public record OrderResponseDto(
    Guid Id,
    string OrderCode,
    Guid CustomerId,
    decimal TotalAmount,
    string Status,
    string PaymentMethod,
    string? FailureReason,
    string? IdempotencyKey,
    DateTime CreatedAtUtc,
    List<OrderItemDto> Items
);
