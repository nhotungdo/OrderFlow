using BuildingBlocks.Common.Primitives;

namespace PaymentService.Domain.Entities;

public enum PaymentStatus
{
    Pending = 1,
    Completed = 2,
    Failed = 3
}

public class Payment : AggregateRoot<Guid>
{
    public Guid OrderId { get; private set; }
    public decimal Amount { get; private set; }
    public PaymentStatus Status { get; private set; }
    public string? TransactionId { get; private set; }
    public string? FailureReason { get; private set; }
    public DateTime CreatedAtUtc { get; private set; } = DateTime.UtcNow;
    public DateTime? CompletedAtUtc { get; private set; }

    private Payment() { }

    public static Payment Create(Guid orderId, decimal amount)
    {
        return new Payment
        {
            Id = Guid.NewGuid(),
            OrderId = orderId,
            Amount = amount,
            Status = PaymentStatus.Pending,
            CreatedAtUtc = DateTime.UtcNow
        };
    }

    public void MarkAsCompleted(string transactionId)
    {
        Status = PaymentStatus.Completed;
        TransactionId = transactionId;
        CompletedAtUtc = DateTime.UtcNow;
    }

    public void MarkAsFailed(string reason)
    {
        Status = PaymentStatus.Failed;
        FailureReason = reason;
        CompletedAtUtc = DateTime.UtcNow;
    }
}
