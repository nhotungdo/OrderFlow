namespace BuildingBlocks.Redis;

public interface IRedisService
{
    Task<bool> SetAsync<T>(string key, T value, TimeSpan? expiry = null);
    Task<T?> GetAsync<T>(string key);
    Task<string?> GetStringAsync(string key);
    Task<bool> SetStringAsync(string key, string value, TimeSpan? expiry = null);
    Task<bool> RemoveAsync(string key);
    Task<bool> SetIfNotExistsAsync(string key, string value, TimeSpan expiry);
    Task<bool> ReleaseLockAsync(string key, string lockValue);
    
    /// <summary>
    /// Executes an atomic Lua script to decrement available stock if stock >= quantity.
    /// Returns true if stock was reserved successfully, false if out of stock.
    /// </summary>
    Task<bool> ReserveStockLuaAsync(string stockKey, int quantity);
    
    /// <summary>
    /// Executes an atomic Lua script to increment stock back upon cancellation or payment failure.
    /// </summary>
    Task<bool> ReleaseStockLuaAsync(string stockKey, int quantity);
}
