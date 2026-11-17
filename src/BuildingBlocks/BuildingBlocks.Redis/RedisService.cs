using System.Text.Json;
using StackExchange.Redis;

namespace BuildingBlocks.Redis;

public class RedisService : IRedisService
{
    private readonly IConnectionMultiplexer _connection;
    private readonly IDatabase _database;

    // Lua script for atomic stock decrement: checks if stock >= quantity before decrementing
    private const string ReserveStockScript = @"
        local current = tonumber(redis.call('get', KEYS[1]) or '-1')
        local qty = tonumber(ARGV[1])
        if current >= qty then
            redis.call('decrby', KEYS[1], qty)
            return 1
        else
            return 0
        end";

    // Lua script for atomic stock increment
    private const string ReleaseStockScript = @"
        local qty = tonumber(ARGV[1])
        redis.call('incrby', KEYS[1], qty)
        return 1";

    // Lua script for atomic distributed lock release: only releases if value matches
    private const string ReleaseLockScript = @"
        if redis.call('get', KEYS[1]) == ARGV[1] then
            return redis.call('del', KEYS[1])
        else
            return 0
        end";

    public RedisService(IConnectionMultiplexer connection)
    {
        _connection = connection;
        _database = connection.GetDatabase();
    }

    public async Task<bool> SetAsync<T>(string key, T value, TimeSpan? expiry = null)
    {
        var json = JsonSerializer.Serialize(value);
        return await _database.StringSetAsync(key, json, expiry);
    }

    public async Task<T?> GetAsync<T>(string key)
    {
        var value = await _database.StringGetAsync(key);
        if (value.IsNullOrEmpty) return default;
        return JsonSerializer.Deserialize<T>(value.ToString()!);
    }

    public async Task<bool> RemoveAsync(string key)
    {
        return await _database.KeyDeleteAsync(key);
    }

    public async Task<bool> SetIfNotExistsAsync(string key, string value, TimeSpan expiry)
    {
        return await _database.StringSetAsync(key, value, expiry, When.NotExists);
    }

    public async Task<bool> ReleaseLockAsync(string key, string lockValue)
    {
        var result = await _database.ScriptEvaluateAsync(
            ReleaseLockScript,
            [new RedisKey(key)],
            [new RedisValue(lockValue)]
        );
        return (int)result == 1;
    }

    public async Task<bool> ReserveStockLuaAsync(string stockKey, int quantity)
    {
        var result = await _database.ScriptEvaluateAsync(
            ReserveStockScript,
            [new RedisKey(stockKey)],
            [new RedisValue(quantity.ToString())]
        );
        return (int)result == 1;
    }

    public async Task<bool> ReleaseStockLuaAsync(string stockKey, int quantity)
    {
        var result = await _database.ScriptEvaluateAsync(
            ReleaseStockScript,
            [new RedisKey(stockKey)],
            [new RedisValue(quantity.ToString())]
        );
        return (int)result == 1;
    }
}
