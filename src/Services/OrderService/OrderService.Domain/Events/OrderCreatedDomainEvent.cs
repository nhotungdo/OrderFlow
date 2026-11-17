using BuildingBlocks.Common.Primitives;
using BuildingBlocks.Messaging.Contracts;

namespace OrderService.Domain.Events;

public class OrderCreatedDomainEvent : IDomainEvent, IOrderCreatedEvent
{
    public Guid OrderId { get; }
    public string OrderCode { get; }
    public Guid CustomerId { get; }
    public decimal TotalAmount { get; }
    public string PaymentMethod { get; }
    public IReadOnlyList<OrderItemMessage> Items { get; }
    public DateTime CreatedAtUtc { get; }

    public OrderCreatedDomainEvent(
        Guid orderId,
        string orderCode,
        Guid customerId,
        decimal totalAmount,
        string paymentMethod,
        IReadOnlyList<OrderItemMessage> items)
    {
        OrderId = orderId;
        OrderCode = orderCode;
        CustomerId = customerId;
        TotalAmount = totalAmount;
        PaymentMethod = paymentMethod;
        Items = items;
        CreatedAtUtc = DateTime.UtcNow;
    }
}
