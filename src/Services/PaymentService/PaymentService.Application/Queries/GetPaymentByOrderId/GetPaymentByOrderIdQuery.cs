using BuildingBlocks.Common.Results;
using MediatR;
using PaymentService.Application.Commands.ProcessPayment;
using PaymentService.Domain.Repositories;

namespace PaymentService.Application.Queries.GetPaymentByOrderId;

public record GetPaymentByOrderIdQuery(Guid OrderId) : IRequest<Result<PaymentDto>>;

public class GetPaymentByOrderIdQueryHandler : IRequestHandler<GetPaymentByOrderIdQuery, Result<PaymentDto>>
{
    private readonly IPaymentRepository _repository;

    public GetPaymentByOrderIdQueryHandler(IPaymentRepository repository)
    {
        _repository = repository;
    }

    public async Task<Result<PaymentDto>> Handle(GetPaymentByOrderIdQuery request, CancellationToken cancellationToken)
    {
        var payment = await _repository.GetByOrderIdAsync(request.OrderId, cancellationToken);
        if (payment is null)
            return Result.Failure<PaymentDto>(Error.NotFound(nameof(payment), request.OrderId));

        var dto = new PaymentDto(
            payment.Id,
            payment.OrderId,
            payment.Amount,
            payment.Status.ToString(),
            payment.TransactionId,
            payment.FailureReason,
            payment.CreatedAtUtc,
            payment.CompletedAtUtc);

        return Result.Success(dto);
    }
}
