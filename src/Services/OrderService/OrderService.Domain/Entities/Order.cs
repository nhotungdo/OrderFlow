using BuildingBlocks.Common.Primitives;
using BuildingBlocks.Common.Results;
using BuildingBlocks.Messaging.Contracts;
using OrderService.Domain.Enums;
using OrderService.Domain.Events;

namespace OrderService.Domain.Entities;

public class Order : AggregateRoot<Guid>
{
    private readonly List<OrderItem> _items = [];

    public string OrderCode { get; private set; } = string.Empty;
    public Guid CustomerId { get; private set; }
    public decimal TotalAmount { get; private set; }
    public OrderStatus Status { get; private set; }
    public string PaymentMethod { get; private set; } = string.Empty;
    public string? FailureReason { get; private set; }
    public string? IdempotencyKey { get; private set; }
    public DateTime CreatedAtUtc { get; private set; } = DateTime.UtcNow;
    public DateTime UpdatedAtUtc { get; private set; } = DateTime.UtcNow;

    public IReadOnlyCollection<OrderItem> Items => _items.AsReadOnly();

    private Order() { }

    public static Order Create(
        Guid orderId,
        string orderCode,
        Guid customerId,
        string paymentMethod,
        string? idempotencyKey,
        List<(Guid productId, string productName, decimal unitPrice, int quantity)> items)
    {
        if (items.Count == 0)
            throw new ArgumentException("Order must have at least one item.", nameof(items));

        var order = new Order
        {
            Id = orderId,
            OrderCode = orderCode,
            CustomerId = customerId,
            PaymentMethod = paymentMethod,
            IdempotencyKey = idempotencyKey,
            Status = OrderStatus.Pending,
            CreatedAtUtc = DateTime.UtcNow,
            UpdatedAtUtc = DateTime.UtcNow
        };

        foreach (var item in items)
        {
            var orderItem = OrderItem.Create(order.Id, item.productId, item.productName, item.unitPrice, item.quantity);
            order._items.Add(orderItem);
        }

        order.TotalAmount = order._items.Sum(x => x.TotalPrice);

        // Phát sinh Domain Event -> Outbox Pattern sẽ bắt sự kiện này lưu vào PostgreSQL
        var messageItems = order._items
            .Select(i => new OrderItemMessage(i.ProductId, i.Quantity, i.UnitPrice))
            .ToList();

        order.AddDomainEvent(new OrderCreatedDomainEvent(
            order.Id,
            order.OrderCode,
            order.CustomerId,
            order.TotalAmount,
            order.PaymentMethod,
            messageItems));

        return order;
    }

    public Result MarkAsPaid()
    {
        if (Status != OrderStatus.Pending)
            return Result.Failure(Error.Conflict($"Cannot mark order {OrderCode} as Paid because current status is {Status}."));

        Status = OrderStatus.Paid;
        UpdatedAtUtc = DateTime.UtcNow;

        return Result.Success();
    }

    public Result MarkAsCancelled(string reason)
    {
        if (Status == OrderStatus.Paid || Status == OrderStatus.Completed)
            return Result.Failure(Error.Conflict($"Cannot cancel already settled order {OrderCode}."));

        Status = OrderStatus.Cancelled;
        FailureReason = reason;
        UpdatedAtUtc = DateTime.UtcNow;

        return Result.Success();
    }
}
