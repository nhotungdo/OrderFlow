using BuildingBlocks.Common.Primitives;

namespace InventoryService.Domain.Entities;

public enum ReservationStatus
{
    Pending = 1,
    Committed = 2,
    Released = 3
}

public class StockReservation : Entity<Guid>
{
    public Guid OrderId { get; private set; }
    public Guid ProductId { get; private set; }
    public int Quantity { get; private set; }
    public ReservationStatus Status { get; private set; }
    public DateTime ExpiresAtUtc { get; private set; }
    public DateTime CreatedAtUtc { get; private set; } = DateTime.UtcNow;

    private StockReservation() { }

    public static StockReservation Create(Guid orderId, Guid productId, int quantity, TimeSpan duration)
    {
        return new StockReservation
        {
            Id = Guid.NewGuid(),
            OrderId = orderId,
            ProductId = productId,
            Quantity = quantity,
            Status = ReservationStatus.Pending,
            CreatedAtUtc = DateTime.UtcNow,
            ExpiresAtUtc = DateTime.UtcNow.Add(duration)
        };
    }

    public void MarkAsCommitted()
    {
        Status = ReservationStatus.Committed;
    }

    public void MarkAsReleased()
    {
        Status = ReservationStatus.Released;
    }
}
