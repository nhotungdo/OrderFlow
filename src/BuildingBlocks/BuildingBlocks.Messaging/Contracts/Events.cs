namespace BuildingBlocks.Messaging.Contracts;

public record OrderItemMessage(Guid ProductId, int Quantity, decimal UnitPrice);

public interface IOrderCreatedEvent
{
    Guid OrderId { get; }
    string OrderCode { get; }
    Guid CustomerId { get; }
    decimal TotalAmount { get; }
    IReadOnlyList<OrderItemMessage> Items { get; }
    DateTime CreatedAtUtc { get; }
}

public interface IStockReservedEvent
{
    Guid OrderId { get; }
    Guid ReservationId { get; }
    DateTime ReservedAtUtc { get; }
}

public interface IStockReservationFailedEvent
{
    Guid OrderId { get; }
    string Reason { get; }
    DateTime FailedAtUtc { get; }
}

public interface IProcessPaymentCommand
{
    Guid OrderId { get; }
    Guid CustomerId { get; }
    decimal Amount { get; }
    string PaymentMethod { get; }
}

public interface IPaymentCompletedEvent
{
    Guid OrderId { get; }
    Guid PaymentId { get; }
    string TransactionId { get; }
    decimal Amount { get; }
    DateTime PaidAtUtc { get; }
}

public interface IPaymentFailedEvent
{
    Guid OrderId { get; }
    string Reason { get; }
    DateTime FailedAtUtc { get; }
}

public interface IReleaseStockCommand
{
    Guid OrderId { get; }
    string Reason { get; }
}

public interface IStockReleasedEvent
{
    Guid OrderId { get; }
    DateTime ReleasedAtUtc { get; }
}

public interface IOrderCancelledEvent
{
    Guid OrderId { get; }
    string Reason { get; }
    DateTime CancelledAtUtc { get; }
}
