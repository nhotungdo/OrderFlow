using BuildingBlocks.Common.Results;
using BuildingBlocks.Messaging.Contracts;
using MassTransit;
using MediatR;
using Microsoft.Extensions.Logging;
using PaymentService.Domain.Entities;
using PaymentService.Domain.Repositories;

namespace PaymentService.Application.Commands.ProcessPayment;

public record ProcessPaymentCommand(
    Guid OrderId,
    decimal Amount,
    string PaymentMethod,
    bool? ForceFailure = null,
    string? FailureReason = null) : IRequest<Result<PaymentDto>>;

public record PaymentDto(
    Guid Id,
    Guid OrderId,
    decimal Amount,
    string Status,
    string? TransactionId,
    string? FailureReason,
    DateTime CreatedAtUtc,
    DateTime? CompletedAtUtc
);

public class ProcessPaymentCommandHandler : IRequestHandler<ProcessPaymentCommand, Result<PaymentDto>>
{
    private readonly IPaymentRepository _repository;
    private readonly IPublishEndpoint _publishEndpoint;
    private readonly ILogger<ProcessPaymentCommandHandler> _logger;

    public ProcessPaymentCommandHandler(
        IPaymentRepository repository,
        IPublishEndpoint publishEndpoint,
        ILogger<ProcessPaymentCommandHandler> logger)
    {
        _repository = repository;
        _publishEndpoint = publishEndpoint;
        _logger = logger;
    }

    public async Task<Result<PaymentDto>> Handle(ProcessPaymentCommand request, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Processing payment for Order {OrderId}, Amount: {Amount}, Method: {Method}",
            request.OrderId, request.Amount, request.PaymentMethod);

        var existing = await _repository.GetByOrderIdAsync(request.OrderId, cancellationToken);
        if (existing is not null)
        {
            _logger.LogWarning("Payment for Order {OrderId} already exists with status: {Status}", request.OrderId, existing.Status);
            return Result.Success(new PaymentDto(
                existing.Id,
                existing.OrderId,
                existing.Amount,
                existing.Status.ToString(),
                existing.TransactionId,
                existing.FailureReason,
                existing.CreatedAtUtc,
                existing.CompletedAtUtc));
        }

        var payment = Payment.Create(request.OrderId, request.Amount);

        // Mô phỏng thất bại nếu phương thức thanh toán là FAIL_CARD hoặc bị ép lỗi (ForceFailure)
        var isFailure = request.ForceFailure == true ||
                        request.PaymentMethod.Equals("FAIL_CARD", StringComparison.OrdinalIgnoreCase) ||
                        request.PaymentMethod.Equals("TIMEOUT", StringComparison.OrdinalIgnoreCase);

        if (isFailure)
        {
            var reason = request.FailureReason
                ?? (request.PaymentMethod == "TIMEOUT" ? "Payment Gateway Timeout (504)" : "Card declined by issuing bank (Insufficient funds / Risk block)");

            payment.MarkAsFailed(reason);
            await _repository.AddAsync(payment, cancellationToken);
            await _repository.SaveChangesAsync(cancellationToken);

            _logger.LogWarning("Payment FAILED for Order {OrderId}. Reason: {Reason}. Publishing IPaymentFailedEvent...", request.OrderId, reason);

            // Bắn sự kiện thất bại -> Kích hoạt SAGA Compensation (Hoàn kho & Hủy Order)
            await _publishEndpoint.Publish<IPaymentFailedEvent>(new PaymentFailedEvent(
                payment.OrderId,
                reason,
                DateTime.UtcNow
            ), cancellationToken);

            var failedDto = new PaymentDto(
                payment.Id,
                payment.OrderId,
                payment.Amount,
                payment.Status.ToString(),
                null,
                payment.FailureReason,
                payment.CreatedAtUtc,
                payment.CompletedAtUtc);

            return Result.Failure<PaymentDto>(Error.Conflict(reason));
        }

        // Thanh toán thành công
        var transactionId = $"TXN-{Guid.NewGuid().ToString()[..8].ToUpper()}";
        payment.MarkAsCompleted(transactionId);
        await _repository.AddAsync(payment, cancellationToken);
        await _repository.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Payment SUCCESSFUL for Order {OrderId}, TransactionId: {TxId}. Publishing IPaymentCompletedEvent...", request.OrderId, transactionId);

        // Bắn sự kiện thành công -> Kích hoạt SAGA Fulfillment (Commit trừ kho & Đổi status Order thành Paid)
        await _publishEndpoint.Publish<IPaymentCompletedEvent>(new PaymentCompletedEvent(
            payment.OrderId,
            payment.Id,
            transactionId,
            payment.Amount,
            DateTime.UtcNow
        ), cancellationToken);

        var successDto = new PaymentDto(
            payment.Id,
            payment.OrderId,
            payment.Amount,
            payment.Status.ToString(),
            payment.TransactionId,
            null,
            payment.CreatedAtUtc,
            payment.CompletedAtUtc);

        return Result.Success(successDto);
    }
}
