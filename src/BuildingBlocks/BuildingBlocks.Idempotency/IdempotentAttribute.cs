using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using BuildingBlocks.Redis;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace BuildingBlocks.Idempotency;

[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class)]
public class IdempotentAttribute : Attribute, IAsyncActionFilter
{
    private const string IdempotencyHeader = "X-Idempotency-Key";

    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var httpContext = context.HttpContext;
        var logger = httpContext.RequestServices.GetRequiredService<ILogger<IdempotentAttribute>>();
        var redisService = httpContext.RequestServices.GetRequiredService<IRedisService>();
        var idempotencyStore = httpContext.RequestServices.GetService<IIdempotencyStore>();

        if (!httpContext.Request.Headers.TryGetValue(IdempotencyHeader, out var keyValues) ||
            string.IsNullOrWhiteSpace(keyValues.ToString()))
        {
            context.Result = new BadRequestObjectResult(new { error = $"Missing required header: {IdempotencyHeader}" });
            return;
        }

        var idempotencyKey = keyValues.ToString().Trim();
        var redisLockKey = $"idemp:{idempotencyKey}";

        // Tầng 1: Redis In-Flight Lock (Chặn request trùng lặp trong 60 giây)
        var acquired = await redisService.SetIfNotExistsAsync(redisLockKey, "PROCESSING", TimeSpan.FromSeconds(60));
        if (!acquired)
        {
            // Kiểm tra xem đơn đã hoàn tất hay vẫn đang xử lý
            if (idempotencyStore is not null)
            {
                var existing = await idempotencyStore.GetByKeyAsync(idempotencyKey, httpContext.RequestAborted);
                if (existing is not null && existing.Status == IdempotencyStatus.Completed && existing.ResponseCode.HasValue)
                {
                    logger.LogInformation("Returning cached response for idempotency key: {Key}", idempotencyKey);
                    context.Result = new ContentResult
                    {
                        StatusCode = existing.ResponseCode.Value,
                        Content = existing.ResponseBody ?? string.Empty,
                        ContentType = "application/json"
                    };
                    return;
                }
            }

            logger.LogWarning("Concurrent duplicate request detected for idempotency key: {Key}", idempotencyKey);
            context.Result = new ConflictObjectResult(new { error = "A request with this idempotency key is currently being processed. Please wait." });
            return;
        }

        // Tầng 2: Kiểm tra Persistent Store nếu có
        if (idempotencyStore is not null)
        {
            var persistentRecord = await idempotencyStore.GetByKeyAsync(idempotencyKey, httpContext.RequestAborted);
            if (persistentRecord is not null && persistentRecord.Status == IdempotencyStatus.Completed && persistentRecord.ResponseCode.HasValue)
            {
                await redisService.SetAsync(redisLockKey, "COMPLETED", TimeSpan.FromHours(24));
                context.Result = new ContentResult
                {
                    StatusCode = persistentRecord.ResponseCode.Value,
                    Content = persistentRecord.ResponseBody ?? string.Empty,
                    ContentType = "application/json"
                };
                return;
            }

            // Ghi nhận record Pending
            await idempotencyStore.SaveAsync(new IdempotentRequest
            {
                Key = idempotencyKey,
                RequestName = context.ActionDescriptor.DisplayName ?? "Unknown",
                RequestHash = string.Empty,
                Status = IdempotencyStatus.Pending,
                ExpiresAtUtc = DateTime.UtcNow.AddHours(24)
            }, httpContext.RequestAborted);
        }

        // Thực thi Action tiếp theo
        var executedContext = await next();

        // Lưu kết quả phản hồi thành công vào Persistent Store & Redis
        if (executedContext.Result is ObjectResult objectResult && (objectResult.StatusCode is null or >= 200 and < 300))
        {
            var statusCode = objectResult.StatusCode ?? StatusCodes.Status200OK;
            var jsonBody = JsonSerializer.Serialize(objectResult.Value);

            if (idempotencyStore is not null)
            {
                await idempotencyStore.UpdateAsync(new IdempotentRequest
                {
                    Key = idempotencyKey,
                    RequestName = context.ActionDescriptor.DisplayName ?? "Unknown",
                    RequestHash = string.Empty,
                    Status = IdempotencyStatus.Completed,
                    ResponseCode = statusCode,
                    ResponseBody = jsonBody,
                    ExpiresAtUtc = DateTime.UtcNow.AddHours(24)
                }, httpContext.RequestAborted);
            }

            await redisService.SetAsync(redisLockKey, "COMPLETED", TimeSpan.FromHours(24));
        }
        else
        {
            // Nếu action bị lỗi hoặc exception, giải phóng lock trên Redis để client có thể retry
            await redisService.RemoveAsync(redisLockKey);
            if (idempotencyStore is not null)
            {
                await idempotencyStore.UpdateAsync(new IdempotentRequest
                {
                    Key = idempotencyKey,
                    RequestName = context.ActionDescriptor.DisplayName ?? "Unknown",
                    RequestHash = string.Empty,
                    Status = IdempotencyStatus.Failed,
                    ExpiresAtUtc = DateTime.UtcNow.AddHours(24)
                }, httpContext.RequestAborted);
            }
        }
    }
}
