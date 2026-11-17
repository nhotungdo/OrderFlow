using BuildingBlocks.Common.Primitives;

namespace OrderService.Domain.Entities;

public class OrderItem : Entity<Guid>
{
    public Guid OrderId { get; private set; }
    public Guid ProductId { get; private set; }
    public string ProductName { get; private set; } = string.Empty;
    public decimal UnitPrice { get; private set; }
    public int Quantity { get; private set; }
    public decimal TotalPrice => UnitPrice * Quantity;

    private OrderItem() { }

    public static OrderItem Create(Guid orderId, Guid productId, string productName, decimal unitPrice, int quantity)
    {
        if (quantity <= 0) throw new ArgumentException("Quantity must be greater than zero.", nameof(quantity));
        if (unitPrice < 0) throw new ArgumentException("Unit price cannot be negative.", nameof(unitPrice));

        return new OrderItem
        {
            Id = Guid.NewGuid(),
            OrderId = orderId,
            ProductId = productId,
            ProductName = productName,
            UnitPrice = unitPrice,
            Quantity = quantity
        };
    }
}
