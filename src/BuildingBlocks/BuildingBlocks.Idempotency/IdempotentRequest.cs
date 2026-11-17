namespace BuildingBlocks.Idempotency;

public enum IdempotencyStatus
{
    Pending = 1,
    Completed = 2,
    Failed = 3
}

public class IdempotentRequest
{
    public string Key { get; set; } = string.Empty;
    public string RequestName { get; set; } = string.Empty;
    public string RequestHash { get; set; } = string.Empty;
    public IdempotencyStatus Status { get; set; } = IdempotencyStatus.Pending;
    public int? ResponseCode { get; set; }
    public string? ResponseBody { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime ExpiresAtUtc { get; set; }
}
